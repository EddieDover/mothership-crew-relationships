import {
  createDiceRollChatMessage,
  getLocalizedRelationshipData,
} from "../utils.js";
/* eslint-disable no-undef */
describe("Utils tests", () => {
  describe("getLocalizedRelationshipData", () => {
    beforeEach(() => {
      global.game = {
        i18n: {
          localize: (key) => {
            const translations = {
              "mothership-crew-relationships.RELATIONSHIPS.Categories.1":
                "Category 1",
              "mothership-crew-relationships.RELATIONSHIPS.Categories.2":
                "Category 2",
              "mothership-crew-relationships.RELATIONSHIPS.1.0":
                "Relationship 1-0",
              "mothership-crew-relationships.RELATIONSHIPS.1.1":
                "Relationship 1-1",
              "mothership-crew-relationships.RELATIONSHIPS.2.0":
                "Relationship 2-0",
              "mothership-crew-relationships.RELATIONSHIPS.2.1":
                "Relationship 2-1",
            };
            return translations[key] || key; // Returns key if not found
          },
        },
      };
    });

    test("returns localized data with custom counts", () => {
      const result = getLocalizedRelationshipData(2, 2);
      expect(result).toEqual({
        1: {
          name: "Category 1",
          relationships: ["Relationship 1-0", "Relationship 1-1"],
        },
        2: {
          name: "Category 2",
          relationships: ["Relationship 2-0", "Relationship 2-1"],
        },
      });
    });

    test("filters out missing translations", () => {
      // This tests the `if (translation !== key)` branch
      const result = getLocalizedRelationshipData(2, 3); // Request 3 relationships but only 2 exist
      expect(result).toEqual({
        1: {
          name: "Category 1",
          relationships: ["Relationship 1-0", "Relationship 1-1"], // No "Relationship 1-2"
        },
        2: {
          name: "Category 2",
          relationships: ["Relationship 2-0", "Relationship 2-1"], // No "Relationship 2-2"
        },
      });
    });

    test("uses default parameter values", () => {
      const result = getLocalizedRelationshipData(); // Tests defaults: 8 categories, 10 relationships
      expect(Object.keys(result)).toHaveLength(8);
      // Check that all 8 categories are present
      for (let i = 1; i <= 8; i++) {
        expect(result[i]).toBeDefined();
        expect(result[i].name).toBeDefined();
        expect(Array.isArray(result[i].relationships)).toBe(true);
      }
    });

    test("handles categories with no translations", () => {
      const result = getLocalizedRelationshipData(3, 2); // Category 3 has no translations
      expect(result[3]).toEqual({
        name: "mothership-crew-relationships.RELATIONSHIPS.Categories.3", // Fallback to key
        relationships: [], // Empty because no translations exist
      });
    });
  });

  describe("createDiceRollChatMessage", () => {
    const actorMock = { name: "Actor One" };
    const targetActorMock = { name: "Actor Two" };
    const majorCategoryMock = { name: "Major Category" };
    const minorRollMock = { total: 7 };
    const relationshipMock = "A strong bond";
    const majorRollFormulaMock = "2d6";
    const minorRollFormulaMock = "1d10";

    beforeEach(() => {
      global.game = {
        i18n: {
          localize: (key) => {
            const translations = {
              "mothership-crew-relationships.UI.CategoryRoll": "Category Roll",
              "mothership-crew-relationships.UI.RelationshipRoll":
                "Relationship Roll",
            };
            return translations[key] || key; // Returns key if not found
          },
        },
      };
    });

    test("generates correct HTML structure", () => {
      const result = createDiceRollChatMessage(
        actorMock,
        targetActorMock,
        majorRollFormulaMock,
        minorRollFormulaMock,
        12,
        majorCategoryMock,
        minorRollMock,
        relationshipMock
      );

      expect(result).toContain('<div class="crew-relationship-roll">');
      expect(result).toContain("<strong>Actor One</strong>");
      expect(result).toContain("<strong>Actor Two</strong>");
      expect(result).toContain(
        "<strong>Category Roll (2d6):</strong> 12 - <em>Major Category</em>"
      );
      expect(result).toContain("<strong>Relationship Roll (1d10):</strong> 7");
      expect(result).toContain("<strong>A strong bond</strong>");
    });

    test("handles different input values", () => {
      const majorRollFormulaMock = "2d6";
      const minorRollFormulaMock = "1d10";
      const result = createDiceRollChatMessage(
        { name: "Alice" },
        { name: "Bob" },
        majorRollFormulaMock,
        minorRollFormulaMock,
        5,
        { name: "Friendship" },
        { total: 3 },
        "They are friends"
      );

      expect(result).toContain("<strong>Alice</strong>");
      expect(result).toContain("<strong>Bob</strong>");
      expect(result).toContain(
        "<strong>Category Roll (2d6):</strong> 5 - <em>Friendship</em>"
      );
      expect(result).toContain("<strong>Relationship Roll (1d10):</strong> 3");
      expect(result).toContain("<strong>They are friends</strong>");
    });
  });
});
