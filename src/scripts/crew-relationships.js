// Mothership Crew Relationships Module
import {
  createDiceRollChatMessage,
  getLocalizedRelationshipData,
} from "./utils.js";
class CrewRelationships {
  static MODULE_ID = "mothership-crew-relationships";
  static RELATIONSHIP_TABLE_NAME = "Crew Relationships";

  static async initialize() {
    console.log(game.i18n.localize("MODULE.Initializing"));
  }

  static async ready() {
    console.log(game.i18n.localize("MODULE.Ready"));
  }

  static async rollRelationshipForActor(actor, targetActor) {
    // Always load fresh data from localization files
    // This avoids Foundry's JSON serialization issues with arrays
    const relationshipData = getLocalizedRelationshipData();

    // Roll 1d8 for major category
    const majorRoll = new Roll("1d8");
    await majorRoll.evaluate();
    const majorResult = majorRoll.total;
    const majorCategory = relationshipData[majorResult];

    // Roll 1d10 for minor relationship
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
    ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: createDiceRollChatMessage(
        actor,
        targetActor,
        majorResult,
        majorCategory,
        minorRoll,
        fullRelationship
      ),
    });

    return fullRelationship;
  }

  static getActorRelationships(actor) {
    const relationships = actor.system.relationships || {};
    const result = [];

    for (const [actorId, relationship] of Object.entries(relationships)) {
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

Hooks.once("init", () => CrewRelationships.initialize());

Hooks.once("ready", () => CrewRelationships.ready());

// Hook into actor sheet rendering to add relationships tab
// eslint-disable-next-line no-unused-vars
Hooks.on("renderMothershipActorSheet", async (app, html, data) => {
  if (app.actor.type !== "character") return;

  // Only add relationships tab for player-assigned characters
  if (!app.actor.hasPlayerOwner) return;

  // Add the Relationships tab to the navigation
  const tabNav = html.find("nav.sheet-tabs");
  if (!tabNav.length) {
    console.warn(game.i18n.localize("WARNINGS.TabNavigationNotFound"));
    return;
  }

  // Add new tab button
  tabNav.append(
    `<a class="tab-select" data-tab="relationships">${game.i18n.localize("UI.Relationships")}</a>`
  );

  // Create the relationships tab content
  const sheetBody = html.find(".sheet-body");
  if (!sheetBody.length) {
    console.warn(game.i18n.localize("WARNINGS.SheetBodyNotFound"));
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
                    <h2>${game.i18n.localize("UI.CrewRelationships")}</h2>
                </div>
    `;

  if (allRelationships.length === 0) {
    relationshipsTabHtml += `
            <div class="relationships-empty">
                <p>${game.i18n.localize("UI.NoCrewMembers")}</p>
                <p>${game.i18n.localize("UI.CreateMoreCharacters")}</p>
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
                        <button class="roll-single-relationship" data-target-id="${rel.actor.id}" title="${game.i18n.localize("UI.ReRoll")}">
                            <i class="fas fa-dice"></i> ${game.i18n.localize("UI.ReRoll")}
                        </button>
                    </div>
                `;
      } else {
        // No relationship yet
        relationshipsTabHtml += `
                    <div class="relationship-item no-relationship" data-actor-id="${rel.actor.id}">
                        <div class="relationship-name">${rel.actor.name}</div>
                        <div class="relationship-description unrolled">${game.i18n.localize("UI.NoRelationshipEstablished")}</div>
                        <button class="roll-single-relationship" data-target-id="${rel.actor.id}" title="${game.i18n.localize("UI.Roll")}">
                            <i class="fas fa-dice"></i> ${game.i18n.localize("UI.Roll")}
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
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("NOTIFICATIONS.OnlyGMCanRoll"));
      return;
    }

    const targetId = event.currentTarget.dataset.targetId;

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
