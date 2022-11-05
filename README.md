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
* commandCheckFactory
* commandHandlerCheckFactory
* eventHandlerCheckFactory

## Client
[Own subclass of Discord.js Client](https://github.com/TrixiS/lib-ts-bot/blob/master/src/client.ts) is used
```TypeScript
import { BotClient } from "@trixis/lib-ts-bot";

const client = new BotClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

...

client.login(process.env.BOT_TOKEN);
```

## BaseExtension
```TypeScript
import { Message } from "discord.js";
import { BaseExtension, eventHandler } from "@trixis/lib-ts-bot";

class TestExtension extends BaseExtension {
  @eventHandler("messageCreate")
  async messageCreateHandler(message: Message) {
    await message.channel.send({ content: "Hello world" }); 
  }
}

...

await client.registerExtension(TestExtension);

...
```

## CommandContext
An object with command contextual data. Instances are created with BaseSlashCommand.getContext method
```TypeScript
type CommandContext<
  I extends CommandInteraction = CommandInteraction,
  O extends Record<string, any> = Record<string, any>,
  D extends Record<string, any> = Record<string, any>
> = {
  client: BotClient;
  interaction: I;
  member?: GuildMember;
  guild?: Guild;
  options: O;
  data: D;
};
```

## BaseSlashCommand
```TypeScript
import { SlashCommandBuilder } from "discord.js";
import {
  BaseSlashCommand,
  commandHandler,
  CommandContext,
} from "@trixis/lib-ts-bot";

class TestCommand extends BaseSlashCommand<TestExtension> {
  constructor(extension: TestExtension) {
    const builder = new SlashCommandBuilder()
      .setName("test")
      .setDescription("Some test command!");
      
    super(extension, builder);
    
  @commandHandler({ name: "test" }})
  async testCommandHandler(ctx: CommandContext) {
    await ctx.interaction.reply("Hello world!");
  }
}

...

testExtension.addCommand(TestCommand); // instance of TestExtension is used (not the class itself)

...
```

## Checks
Check predicate takes a single argument - CommandContext instance. All checks should return Promise<boolean>.
### Command checks
```TypeScript
...
import { guildOnlyCommand } from "@trixis/lib-ts-bot";

@guildOnlyCommand() // makes all command handlers of TestCommand guild only (would't work in DMs)
class TestCommand extends BaseSlashCommand<TestExtension> {
  ...
}

...
```

### Command handler checks
```TypeScript
...
import { commandHandlerCheckFactory } from "@trixis/lib-ts-bot";

const guildOnlyCommandHandler = () => commandHandlerCheckFactory(async (ctx) => Boolean(ctx.guild));

class TestCommand extends BaseSlashCommand<TestExtension> {
  ...
  
  @guildOnlyCommandHandler() // makes a single command handler guild only
  @commandHandler({ name: "test" })
  async testCommandHandler(ctx: CommandContext) {
    ...
  }
}

...
```

### Event handler checks
```TypeScript
...
import { eventHandlerCheckFactory } from "@trixis/lib-ts-bot";

const guildOnlyEvent = () => eventHandlerCheckFactory(async (ctx) => Boolean(ctx.guild));

class TestExtension extends BaseExtension {
  @guildOnlyEvent() // check if event interaction guild is set 
  @eventHandler("interactionCreate")
  async interactionHandler(interaction: Interaction) {
    ...
  }
}

...
```

## Command handling
Commands would not be handled automatically by default. There is defaut CommandHandlerExtension you need to register yourself. Or write it yourself
```TypeScript
import { CommandHandlerExtension } from "@trixis/lib-ts-bot";

// ... create a client instance
await client.registerExtension(CommandHandlerExtension);
// ... register your extensions and commands
// ... login the client
```

## Custom id factory
Zod is used for data validation
```TypeScript
...
import { CustomId, checkCustomId } from "@trixis/lib-ts-bot";
import { z } from "zod";

const testCustomId = new CustomId("test", z.object({ testId: z.number() }));

class TestExtension extends BaseExtension {
  @checkCustomId(testCustomId) // would check if interaction custom id is specified one
  @eventHandler("interactionCreate")
  async interactionHandler(interaction: Interaction) {
      const data = testCustomId.unpack(interaction.customId);
      console.log(data.testId);
      // interaction type has no customId, it given here for example
  }
}
  
...
```
