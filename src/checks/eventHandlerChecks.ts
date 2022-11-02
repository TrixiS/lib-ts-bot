import { CustomId } from "../customId";
import { eventHandlerCheckFactory } from "./checkFactory";

export const buttonInteractionHandler = () =>
  eventHandlerCheckFactory<"interactionCreate">(async (interaction) => {
    return interaction.isButton();
  });

export const selectMenuInteractionHandler = () =>
  eventHandlerCheckFactory<"interactionCreate">(async (interaction) => {
    return interaction.isSelectMenu();
  });

export const modalSubmitInteractionHandler = () =>
  eventHandlerCheckFactory<"interactionCreate">(async (interaction) => {
    return interaction.isModalSubmit();
  });

export const checkCustomId = (customId: CustomId<any>) =>
  eventHandlerCheckFactory<"interactionCreate">(async (interaction) => {
    return (
      interaction.isMessageComponent() &&
      interaction.customId.startsWith(customId.prefix)
    );
  });
