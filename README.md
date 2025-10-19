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
3. <s>Search for "Mothership Crew Relationships"</s> (coming soon!) or paste the manifest URL
4. Click Install

### Manifest URL

```
https://github.com/EddieDover/mothership-crew-relationships/releases/latest/download/module.json
```

## Usage

### For GMs

**Rolling Individual Relationships:**

1. Open a player character sheet
2. Navigate to the "Relationships" tab
3. Click the button next to another player character's name
4. The relationship will be rolled and posted to chat, then stored on the character sheet

#### Custom Roll Tables

To create a compatible nested rolltable configuration, do the following:

1. Create 1 roll table per sub-category of your planned, primary, relationships roll-table.
2. Create items inside each of the sub-category roll-tables. The module will look for item description first, and then fall back to item name if it is not set.
3. Create a primary relationships roll table. Inside of which, create one item per sub-category. Change the name of the item to the sub-category name, and change the Result Type to Document. Then drag the sub-category roll table onto the provided field.
4. Click the `Copy Document UUID` button on the primary relationships table, and paste the string into provided text input in the module settings.

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
