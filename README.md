# lib-ts-bot
Package for Discord bots micro-framework template - https://github.com/TrixiS/base-ts-bot

Used in [base-ts-bot](https://github.com/TrixiS/base-ts-bot)

# Documentation
Built ontop [Discord.js](https://github.com/discordjs/discord.js/)
## Concepts
The library provides several base classes:
* Extensions - classes for storing commands and event listeting (see [BaseExtension](https://github.com/TrixiS/lib-ts-bot/blob/master/src/extension.ts) ABC)
* Commands - classes for incapsulating command data and interaction event handlers (see [BaseSlashCommand](https://github.com/TrixiS/lib-ts-bot/blob/master/src/command.ts) ABC]

## Decorators
The library uses [TypeScript decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) for event listener registration. Also provides some decorators for different use cases:
* [commandHandler](https://github.com/TrixiS/lib-ts-bot/blob/master/src/commandHandler.ts) - a decorator used in BaseSlashCommand subclasses to register command interaction event listeners
* [eventHandler](https://github.com/TrixiS/lib-ts-bot/blob/master/src/eventHandler.ts) - a decorator used in BaseExtension subclasses to register Discord.js Client event listeners

### Checks
Checks are decorators used to register command guard predicates. There are several [check decorator factories](https://github.com/TrixiS/lib-ts-bot/blob/master/src/checks/checkFactory.ts):
* commandCheckFactory - a decorator used to register a check on BaseSlashCommand subclasses (the check would be applied on all commandHandlers in that subclass)
* commandHandlerCheckFactory - a decorator used to register a check on a single BaseSlashCommand commandHandler
* eventHandlerCheckFactory - a decorator used to register a check on a eventHandler
