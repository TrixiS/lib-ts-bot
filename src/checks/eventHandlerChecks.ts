import { eventHandlerCheckFactory } from "./checkFactory";

// TODO: custom ID factory

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
