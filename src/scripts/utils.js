/**
 * Get localized relationship data
 * @returns {Object} Relationship data with localized strings
 */
export function getLocalizedRelationshipData(
  categoryCount = 8,
  relationshipCount = 10
) {
  const data = {};

  for (let i = 1; i <= categoryCount; i++) {
    const categoryName = game.i18n.localize(`RELATIONSHIPS.Categories.${i}`);

    // Get the relationship array from the translations
    const relationshipsArray = [];
    for (let j = 0; j < relationshipCount; j++) {
      const key = `RELATIONSHIPS.${i}.${j}`;
      const translation = game.i18n.localize(key);
      // Only add if translation exists (not the key itself)
      if (translation !== key) {
        relationshipsArray.push(translation);
      }
    }

    data[i] = {
      name: categoryName,
      relationships: relationshipsArray,
    };
  }

  return data;
}

/**
 * Create a chat message HTML snippet for a dice roll result
 *
 * @export
 * @param {*} actor - The actor performing the roll
 * @param {*} targetActor - The target actor of the roll
 * @param {*} majorResult - The major roll result
 * @param {*} majorCategory - The major category object
 * @param {*} minorRoll - The minor roll result object
 * @param {*} relationship - The relationship description
 * @returns {string} HTML string for the chat message
 */
export function createDiceRollChatMessage(
  actor,
  targetActor,
  majorResult,
  majorCategory,
  minorRoll,
  relationship
) {
  return `<div class="crew-relationship-roll">
                    <strong>${actor.name}</strong> and <strong>${targetActor.name}</strong>'s relationship:
                    <br/>
                    <div style="margin-top: 8px;">
                        <strong>${game.i18n.localize("UI.CategoryRoll")}</strong> ${majorResult} - <em>${majorCategory.name}</em>
                        <br/>
                        <strong>${game.i18n.localize("UI.RelationshipRoll")}</strong> ${minorRoll.total}
                    </div>
                    <div style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.2); border-left: 3px solid white;">
                        <strong>${relationship}</strong>
                    </div>
                </div>
            `;
}
