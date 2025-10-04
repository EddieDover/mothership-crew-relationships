// Mothership Crew Relationships Module
import { RELATIONSHIP_DATA } from "./relationships.js";

class CrewRelationships {
  static MODULE_ID = "mothership-crew-relationships";
  static RELATIONSHIP_TABLE_NAME = "Crew Relationships";

  static async initialize() {
    console.log("Mothership Crew Relationships | Initializing");

    // Register settings
    // eslint-disable-next-line no-undef
    game.settings.register(this.MODULE_ID, "relationshipTableId", {
      name: "Relationship Roll Table ID",
      hint: "The ID of the roll table to use for relationships",
      scope: "world",
      config: false,
      type: String,
      default: "",
    });

    // eslint-disable-next-line no-undef
    game.settings.register(this.MODULE_ID, "relationshipData", {
      scope: "world",
      config: false,
      type: Object,
      default: {},
    });
  }

  static async ready() {
    console.log("Mothership Crew Relationships | Ready");

    // Create default relationship table if it doesn't exist
    await this.ensureRelationshipTable();
  }

  static async ensureRelationshipTable() {
    // Check if we have relationship data
    // eslint-disable-next-line no-undef
    const relationshipData = game.settings.get(
      this.MODULE_ID,
      "relationshipData"
    );

    if (!relationshipData || Object.keys(relationshipData).length === 0) {
      // Create the default relationship data
      await this.createDefaultRelationshipTable();
    }
  }

  static async createDefaultRelationshipTable() {
    console.log(
      "Mothership Crew Relationships | Creating default relationship tables"
    );

    // eslint-disable-next-line no-undef
    await game.settings.set(
      this.MODULE_ID,
      "relationshipData",
      RELATIONSHIP_DATA
    );

    // eslint-disable-next-line no-undef
    ui.notifications.info("Crew Relationships tables initialized");
    return true;
  }

  static async rollRelationshipForActor(actor, targetActor) {
    // eslint-disable-next-line no-undef
    const relationshipData = game.settings.get(
      this.MODULE_ID,
      "relationshipData"
    );

    if (!relationshipData || Object.keys(relationshipData).length === 0) {
      // eslint-disable-next-line no-undef
      ui.notifications.warn("Crew Relationships data not found!");
      return null;
    }

    // Roll 1d8 for major category
    // eslint-disable-next-line no-undef
    const majorRoll = new Roll("1d8");
    await majorRoll.evaluate();
    const majorResult = majorRoll.total;
    const majorCategory = relationshipData[majorResult];

    // Roll 1d10 for minor relationship
    // eslint-disable-next-line no-undef
    const minorRoll = new Roll("1d10");
    await minorRoll.evaluate();
    const minorResult = minorRoll.total - 1;
    const relationship = majorCategory.relationships[minorResult];

    // Create the full relationship text with category
    const fullRelationship = `${majorCategory.name}: ${relationship}`;

    // Update both actors' relationships
    const actorRelationships = actor.system.relationships || {};
    actorRelationships[targetActor.id] = fullRelationship;
    await actor.update({ "system.relationships": actorRelationships });

    const targetRelationships = targetActor.system.relationships || {};
    targetRelationships[actor.id] = fullRelationship;
    await targetActor.update({ "system.relationships": targetRelationships });

    // Send chat message with dice rolls
    // eslint-disable-next-line no-undef
    ChatMessage.create({
      // eslint-disable-next-line no-undef
      user: game.user.id,
      // eslint-disable-next-line no-undef
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: `
                <div class="crew-relationship-roll">
                    <strong>${actor.name}</strong> and <strong>${targetActor.name}</strong>'s relationship:
                    <br/>
                    <div style="margin-top: 8px;">
                        <strong>Category Roll (1d8):</strong> ${majorResult} - <em>${majorCategory.name}</em>
                        <br/>
                        <strong>Relationship Roll (1d10):</strong> ${minorRoll.total}
                    </div>
                    <div style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.2); border-left: 3px solid white;">
                        <strong>${relationship}</strong>
                    </div>
                </div>
            `,
    });

    return fullRelationship;
  }

  static async rollAllRelationships(actor) {
    // Get all player character actors except this one
    // eslint-disable-next-line no-undef
    const otherCharacters = game.actors.filter(
      (a) => a.type === "character" && a.id !== actor.id && a.hasPlayerOwner
    );

    if (otherCharacters.length === 0) {
      // eslint-disable-next-line no-undef
      ui.notifications.info(
        "No other player characters found to establish relationships with."
      );
      return;
    }

    // Initialize relationships object if it doesn't exist
    if (!actor.system.relationships) {
      await actor.update({ "system.relationships": {} });
    }

    const relationships = {};
    const chatMessages = [`<h3>${actor.name}'s Crew Relationships</h3><hr/>`];

    for (const other of otherCharacters) {
      // eslint-disable-next-line no-undef
      const tableId = game.settings.get(this.MODULE_ID, "relationshipTableId");
      // eslint-disable-next-line no-undef
      const table = game.tables.get(tableId);

      if (table) {
        const draw = await table.draw({ displayChat: false });
        const relationship = draw.results[0]?.text || "No relationship";
        relationships[other.id] = relationship;
        chatMessages.push(`<strong>${other.name}:</strong> ${relationship}`);
      }
    }

    // Update actor with relationships
    await actor.update({ "system.relationships": relationships });

    // Send a single chat message with all relationships
    // eslint-disable-next-line no-undef
    ChatMessage.create({
      // eslint-disable-next-line no-undef
      user: game.user.id,
      // eslint-disable-next-line no-undef
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: chatMessages.join("<br/>"),
    });

    // eslint-disable-next-line no-undef
    ui.notifications.info(`Rolled relationships for ${actor.name}`);
  }

  static getActorRelationships(actor) {
    const relationships = actor.system.relationships || {};
    const result = [];

    for (const [actorId, relationship] of Object.entries(relationships)) {
      // eslint-disable-next-line no-undef
      const other = game.actors.get(actorId);
      if (other) {
        result.push({
          actor: other,
          relationship: relationship,
        });
      }
    }

    return result;
  }

  static getAllPotentialRelationships(actor) {
    // Get all player character actors except this one
    // eslint-disable-next-line no-undef
    const otherCharacters = game.actors.filter(
      (a) => a.type === "character" && a.id !== actor.id && a.hasPlayerOwner
    );

    const existingRelationships = actor.system.relationships || {};
    const result = [];

    for (const other of otherCharacters) {
      result.push({
        actor: other,
        relationship: existingRelationships[other.id] || null,
      });
    }

    return result;
  }
}

// eslint-disable-next-line no-undef
Hooks.once("init", () => CrewRelationships.initialize());
// eslint-disable-next-line no-undef
Hooks.once("ready", () => CrewRelationships.ready());

// Hook into actor sheet rendering to add relationships tab
// eslint-disable-next-line no-undef, no-unused-vars
Hooks.on("renderMothershipActorSheet", async (app, html, data) => {
  if (app.actor.type !== "character") return;

  // Only add relationships tab for player-assigned characters
  if (!app.actor.hasPlayerOwner) return;

  // Add the Relationships tab to the navigation
  const tabNav = html.find("nav.sheet-tabs");
  if (!tabNav.length) {
    console.warn("Crew Relationships: Could not find tab navigation");
    return;
  }

  // Add new tab button
  tabNav.append(
    `<a class="tab-select" data-tab="relationships">Relationships</a>`
  );

  // Create the relationships tab content
  const sheetBody = html.find(".sheet-body");
  if (!sheetBody.length) {
    console.warn("Crew Relationships: Could not find sheet body");
    return;
  }

  // Check if we need to restore the relationships tab
  const shouldActivateRelationships = app._savedTab === "relationships";
  if (shouldActivateRelationships) {
    // Clear the saved tab
    delete app._savedTab;
  }

  const allRelationships = CrewRelationships.getAllPotentialRelationships(
    app.actor
  );

  let relationshipsTabHtml = `
        <div class="tab relationships-tab" data-tab="relationships" data-group="primary">
            <div class="crew-relationships-container">
                <div class="relationships-header">
                    <h2>Crew Relationships</h2>
                </div>
    `;

  if (allRelationships.length === 0) {
    relationshipsTabHtml += `
            <div class="relationships-empty">
                <p>No other crew members found.</p>
                <p>Create more player characters to establish relationships.</p>
            </div>
        `;
  } else {
    relationshipsTabHtml += `<div class="relationships-list">`;
    for (const rel of allRelationships) {
      if (rel.relationship) {
        // Existing relationship
        relationshipsTabHtml += `
                    <div class="relationship-item" data-actor-id="${rel.actor.id}">
                        <div class="relationship-name">${rel.actor.name}</div>
                        <div class="relationship-description">${rel.relationship}</div>
                        <button class="roll-single-relationship" data-target-id="${rel.actor.id}" title="Re-roll relationship">
                            <i class="fas fa-dice"></i> Re-roll
                        </button>
                    </div>
                `;
      } else {
        // No relationship yet
        relationshipsTabHtml += `
                    <div class="relationship-item no-relationship" data-actor-id="${rel.actor.id}">
                        <div class="relationship-name">${rel.actor.name}</div>
                        <div class="relationship-description unrolled">No relationship established</div>
                        <button class="roll-single-relationship" data-target-id="${rel.actor.id}" title="Roll relationship">
                            <i class="fas fa-dice"></i> Roll
                        </button>
                    </div>
                `;
      }
    }
    relationshipsTabHtml += `</div>`;
  }

  relationshipsTabHtml += `
            </div>
        </div>
    `;

  sheetBody.append(relationshipsTabHtml);

  html.find(".roll-single-relationship").click(async (event) => {
    event.preventDefault();

    // Check if user is GM
    // eslint-disable-next-line no-undef
    if (!game.user.isGM) {
      // eslint-disable-next-line no-undef
      ui.notifications.warn("Only the GM can roll relationships.");
      return;
    }

    const targetId = event.currentTarget.dataset.targetId;
    // eslint-disable-next-line no-undef
    const targetActor = game.actors.get(targetId);

    if (targetActor) {
      await CrewRelationships.rollRelationshipForActor(app.actor, targetActor);

      // Store the current tab before re-rendering
      app._savedTab = "relationships";

      // Re-render the sheet
      app.render(false);
    }
  });

  // Make sure tab switching works for our new tab
  const relationshipsTabLink = html[0].querySelector(
    'a.tab-select[data-tab="relationships"]'
  );
  if (relationshipsTabLink) {
    relationshipsTabLink.addEventListener("click", function () {
      const tab = this.dataset.tab;
      html[0]
        .querySelectorAll(".tab")
        .forEach((el) => el.classList.remove("active"));
      const tabContent = html[0].querySelector(`.tab[data-tab="${tab}"]`);
      if (tabContent) tabContent.classList.add("active");
      html[0]
        .querySelectorAll("a.tab-select")
        .forEach((el) => el.classList.remove("active"));
      this.classList.add("active");
    });
  }

  // Activate the relationships tab if we just rolled
  if (shouldActivateRelationships) {
    html[0]
      .querySelectorAll(".tab")
      .forEach((el) => el.classList.remove("active"));
    const relationshipsTab = html[0].querySelector(
      '.tab[data-tab="relationships"]'
    );
    if (relationshipsTab) relationshipsTab.classList.add("active");
    html[0]
      .querySelectorAll("a.tab-select")
      .forEach((el) => el.classList.remove("active"));
    const relationshipsLink = html[0].querySelector(
      'a.tab-select[data-tab="relationships"]'
    );
    if (relationshipsLink) relationshipsLink.classList.add("active");
  }
});

// Export for use in macros
window.CrewRelationships = CrewRelationships;
