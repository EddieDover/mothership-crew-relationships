// Mothership Crew Relationships Module
import { RelationshipViewer } from "./relationship-viewer.js";
import {
  createDiceRollChatMessage,
  getLocalizedRelationshipData,
} from "./utils.js";

let relationshipViewerInstance = null;

class CrewRelationships {
  static MODULE_ID = "mothership-crew-relationships";
  static RELATIONSHIP_TABLE_NAME = "Crew Relationships";

  static async registerSettings() {
    await game.settings.register(
      "mothership-crew-relationships",
      "customRollTable",
      {
        name: "SETTINGS.CustomRollTable.Name",
        hint: "SETTINGS.CustomRollTable.Hint",
        scope: "world",
        config: true,
        type: String,
        default: "",
        onChange: (value) => {
          console.log(
            "Custom Relationship Roll Table setting changed to:",
            value
          );
        },
      }
    );

    console.log("Mothership Crew Relationships | Settings Registered");
  }

  static async initialize() {
    console.log(
      game.i18n.localize("Mothership Crew Relationships | Initalizing")
    );

    await this.registerSettings();
  }

  static async ready() {
    console.log(game.i18n.localize("MODULE.Ready"));
  }

  static openRelationshipViewer() {
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("NOTIFICATIONS.OnlyGMCanView"));
      return;
    }
    if (relationshipViewerInstance?.rendered) {
      relationshipViewerInstance.close();
    } else {
      relationshipViewerInstance = new RelationshipViewer();
      relationshipViewerInstance.render(true);
    }
  }

  static async rollRelationshipForActor(actor, targetActor) {
    const customTableId = await game.settings.get(
      "mothership-crew-relationships",
      "customRollTable"
    );
    /**
     * @type {{ actor: Actor, targetActor: Actor, majorResult: number, majorCategory: string, minorRoll: Roll, fullRelationship: string }}
     */
    let chatMessageArgs = {
      actor: actor,
      targetActor: targetActor,
      majorRollFormula: "",
      minorRollFormula: "",
      majorResult: null,
      majorCategory: null,
      minorRoll: null,
      fullRelationship: null,
    };
    let fullRelationship = "";
    const isUsingCustomTable = !!customTableId;

    if (isUsingCustomTable === false) {
      // Always load fresh data from localization files
      // This avoids Foundry's JSON serialization issues with arrays
      const relationshipData = getLocalizedRelationshipData();

      // Roll 1d8 for major category
      const majorRollFormula = "1d8";
      const majorRoll = new Roll(majorRollFormula);
      await majorRoll.evaluate();
      const majorResult = majorRoll.total;
      const majorCategory = relationshipData[majorResult];

      // Roll 1d10 for minor relationship
      const minorRollFormula = "1d10";
      const minorRoll = new Roll(minorRollFormula);
      await minorRoll.evaluate();
      const minorResult = minorRoll.total - 1;
      const relationship = majorCategory.relationships[minorResult];

      // Create the full relationship text with category
      fullRelationship = `${majorCategory.name}: ${relationship}`;

      chatMessageArgs.majorRollFormula = majorRollFormula;
      chatMessageArgs.majorResult = majorResult;
      chatMessageArgs.majorCategory = majorCategory.name;
      chatMessageArgs.minorRollFormula = minorRollFormula;
      chatMessageArgs.minorRoll = minorRoll;
      chatMessageArgs.fullRelationship = fullRelationship;
    } else {
      // Use custom roll table if specified
      const tableId = customTableId.replace("RollTable.", "");
      const rollTable = game.tables.get(tableId);
      if (!rollTable) {
        ui.notifications.error(game.i18n.localize("ERRORS.RollTableNotFound"));
        return null;
      }
      const draw = await rollTable.draw({
        displayChat: false,
        recursive: true,
      });
      const drawResults = draw.results[0];
      const relationshipText = drawResults.description || drawResults.name;
      fullRelationship = relationshipText;
      const subResultCollection = drawResults.collection;
      const subResultId = drawResults.id;
      let subResultIndex = -1;
      subResultCollection.contents.forEach((item, idx) => {
        if (item.id === subResultId) {
          subResultIndex = idx;
        }
      });

      chatMessageArgs.majorResult = draw.roll.total;
      chatMessageArgs.majorRollFormula = draw.roll.formula;
      chatMessageArgs.majorCategory = drawResults.parent.name;
      chatMessageArgs.minorRoll = {
        total: subResultIndex + 1,
      };
      chatMessageArgs.minorRollFormula = drawResults.parent.formula;
      chatMessageArgs.fullRelationship = fullRelationship;
    }

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
        chatMessageArgs.actor,
        chatMessageArgs.targetActor,
        chatMessageArgs.majorRollFormula,
        chatMessageArgs.minorRollFormula,
        chatMessageArgs.majorResult,
        { name: chatMessageArgs.majorCategory },
        chatMessageArgs.minorRoll,
        chatMessageArgs.fullRelationship
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

  static async setRelationship(actor, targetActor, relationshipText) {
    // Update both actors' relationships
    const actorRelationships = actor.system.relationships || {};
    actorRelationships[targetActor.id] = relationshipText;
    await actor.update({ "system.relationships": actorRelationships });

    const targetRelationships = targetActor.system.relationships || {};
    targetRelationships[actor.id] = relationshipText;
    await targetActor.update({ "system.relationships": targetRelationships });

    return relationshipText;
  }

  static async deleteRelationship(actor, targetActor) {
    // Remove relationship from both actors
    const actorRelationships = actor.system.relationships || {};
    delete actorRelationships[targetActor.id];
    await actor.update({ "system.relationships": actorRelationships });

    const targetRelationships = targetActor.system.relationships || {};
    delete targetRelationships[actor.id];
    await targetActor.update({ "system.relationships": targetRelationships });
  }
}

Hooks.once("init", () => CrewRelationships.initialize());

Hooks.once("ready", () => CrewRelationships.ready());

// Add scene control button for GMs
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM) return;

  const button = {
    name: "relationship-viewer",
    title: game.i18n.localize("UI.ViewRelationships"),
    icon: "fas fa-project-diagram",
    visible: true,
    button: true,
    onChange: () => CrewRelationships.openRelationshipViewer(),
  };

  controls.tokens.tools["relationship-viewer"] = button;
});

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
                        <div class="relationship-buttons">
                            <button class="roll-single-relationship" type="button" data-target-id="${rel.actor.id}" title="${game.i18n.localize("UI.ReRoll")}">
                                <i class="fas fa-dice"></i>
                            </button>
                            <button class="edit-relationship" type="button" data-target-id="${rel.actor.id}" title="${game.i18n.localize("UI.Edit")}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-relationship" type="button" data-target-id="${rel.actor.id}" title="${game.i18n.localize("UI.Delete")}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
      } else {
        // No relationship yet
        relationshipsTabHtml += `
                    <div class="relationship-item no-relationship" data-actor-id="${rel.actor.id}">
                        <div class="relationship-name">${rel.actor.name}</div>
                        <div class="relationship-description unrolled">${game.i18n.localize("UI.NoRelationshipEstablished")}</div>
                        <div class="relationship-buttons">
                            <button class="roll-single-relationship" type="button" data-target-id="${rel.actor.id}" title="${game.i18n.localize("UI.Roll")}">
                                <i class="fas fa-dice"></i>
                            </button>
                            <button class="edit-relationship"  type="button" data-target-id="${rel.actor.id}" title="${game.i18n.localize("UI.Edit")}">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
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

  html.find(".edit-relationship").click(async (event) => {
    event.preventDefault();

    // Check if user is GM
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("NOTIFICATIONS.OnlyGMCanEdit"));
      return;
    }

    const targetId = event.currentTarget.dataset.targetId;
    const targetActor = game.actors.get(targetId);

    if (!targetActor) return;

    const currentRelationship =
      app.actor.system.relationships?.[targetId] || "";

    const dialog = new Dialog({
      title: game.i18n.format("UI.EditRelationshipTitle", {
        actor1: app.actor.name,
        actor2: targetActor.name,
      }),
      content: `
        <form>
          <div class="form-group">
            <label>${game.i18n.localize("UI.RelationshipText")}:</label>
            <input type="text" name="relationship" value="${currentRelationship}" autofocus />
          </div>
        </form>
      `,
      buttons: {
        save: {
          icon: '<i class="fas fa-save"></i>',
          label: game.i18n.localize("UI.Save"),
          callback: async (html) => {
            const newRelationship = html.find('[name="relationship"]').val();
            if (newRelationship && newRelationship.trim() !== "") {
              await CrewRelationships.setRelationship(
                app.actor,
                targetActor,
                newRelationship.trim()
              );

              // Store the current tab before re-rendering
              app._savedTab = "relationships";

              // Re-render the sheet
              app.render(false);
            }
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("UI.Cancel"),
        },
      },
      default: "save",
      render: (html) => {
        // Prevent form submission on Enter key
        html.find("form").on("submit", (e) => {
          e.preventDefault();
          dialog.submit();
        });
      },
    }).render(true);
  });

  html.find(".delete-relationship").click(async (event) => {
    event.preventDefault();

    // Check if user is GM
    if (!game.user.isGM) {
      ui.notifications.warn(
        game.i18n.localize("NOTIFICATIONS.OnlyGMCanDelete")
      );
      return;
    }

    const targetId = event.currentTarget.dataset.targetId;
    const targetActor = game.actors.get(targetId);

    if (!targetActor) return;

    await CrewRelationships.deleteRelationship(app.actor, targetActor);

    // Store the current tab before re-rendering
    app._savedTab = "relationships";

    // Re-render the sheet
    app.render(false);
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
window.RelationshipViewer = RelationshipViewer;
