# Mothership Crew Relationships

A Foundry VTT module that adds a crew relationships system to Mothership characters. This module allows GMs to roll for relationships between crew members and track them directly on character sheets.

## Features

- **Relationship Rolling**: GMs can roll for relationships between player characters using a two-tier dice system (1d8 for category, 1d10 for specific relationship)
- **Relationships Tab**: Adds a dedicated "Relationships" tab to Mothership character sheets
- **8 Relationship Categories**: Companions, Professional, Romantic, Obligation & Debt, Shared Secrets, History, Conflict, and Family & Kin
- **80 Unique Relationships**: 10 specific relationships per category.
- **Custom Relationships**: Don't like the built-in relationships? Edit them and write your own!
- **Custom Nested RollTable Support**: Supports using your own nested-rolltables for relationships.
- **Relationship Map Viewer**: A button in the token section allows you to view a relationship web.

## Requirements

- Foundry VTT v13 or higher
- One of the following systems:
  - Mothership RPG System (mosh) v0.6.0 or higher
  - MotherShip 1e - Français (mothership-fr) v1.6.41 or higher

## Installation

1. In Foundry VTT, go to the Add-on Modules tab
2. Click "Install Module"
3. Search for "Mothership Crew Relationships" in Foundry or paste the manifest URL
4. Click Install

### Manifest URL

```
https://github.com/EddieDover/mothership-crew-relationships/releases/latest/download/module.json
```

## Usage

### For GMs

**Rolling Individual Relationships:**

_Please note that relationships can only be assigned to characters who are actively assigned to players._

1. Open a player character sheet
2. Navigate to the "Relationships" tab
3. Click the button next to another player character's name
4. The relationship will be rolled and posted to chat, then stored on the character sheet

#### Custom Roll Tables

To create a set of roll-tables refer to the [Foundry VTT Documentation](https://foundryvtt.com/article/roll-tables/#nesting).

1. Create a rollable table for each category you want such as "Positive", "Negative", or "Rivals"
2. Within that table, create new items for each of the outcomes. For instance, if they are close, this might be "One reminds the other of a lost friend or family member." or "They both witnessed something they shouldn't have."
   1. Each of these items should have a description of the relationship. Try to keep this a short descriptive sentence.
   2. If no description is set, the name of the item is used.
3. Once you have all of your relationship tables built, create one more rollable table to link them together. Drag the tables you have created into the list of this primary table.
   1. Make sure to edit the `Roll Formula` in the `Summary` tab, to match the amount of sub-tables you have created. _If you have 6 sub-tables, it should list the roll as 1d6, etc._
4. Open your settings, and change the custom table dropdown for `mothership-crew-relationships` to use your newly created custom table.

### For Players

Players can view their character's relationships on the "Relationships" tab of their character sheet. Only GMs can roll for new relationships.

## Relationship Categories

1. **Companions** - Close bonds and friendships
2. **Professional** - Work-related connections
3. **Romantic** - Romantic entanglements
4. **Obligation & Debt** - Favors owed and life debts
5. **Rivalry** - Various degrees of animosity
6. **Ambivalent** - Couldn't care less
7. **Shared Trauma** - Experienced horrifying events
8. **Unlikely Bond** - Differing attitudes or lifestyles

## Screenshots

<img width="823" height="457" alt="image" src="https://github.com/user-attachments/assets/68fa73ab-d1e0-4c35-86fd-da501a9915d0" />

<img width="926" height="715" alt="image" src="https://github.com/user-attachments/assets/9849af5b-11b6-4d9f-b46c-e55168984f82" />

## Support

Please file a bug report above if possible. For things not bug related, please use the Discussion tab and open a discussion.

Otherwise, please contact me on Discord: EddieDover or at my Discord Server [here](https://discord.gg/hshfZA73fG).
