import { CustomId } from "../customId";
import { eventHandlerCheckFactory } from "./checkFactory";

export const checkCustomId = (customId: CustomId<any>) =>
  eventHandlerCheckFactory<"interactionCreate">(async (interaction) => {
    if (!interaction.isMessageComponent() && !interaction.isModalSubmit()) {
      return false;
    }

    const { prefix } = customId.parse(interaction.customId);
    return customId.prefix === prefix;
  });
