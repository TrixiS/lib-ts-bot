import { commandCheckFactory } from "./checkFactory";
import { CommandContext } from "../command";
import { PermissionResolvable } from "discord.js";

export const guildOnly = () => {
  return commandCheckFactory(async ({ interaction }: CommandContext) => {
    return Boolean(interaction.guild && interaction.member);
  });
};

export const hasPermissions = (...permissions: PermissionResolvable[]) => {
  return commandCheckFactory(async ({ interaction }: CommandContext) => {
    if (!interaction.guild) {
      return false;
    }

    const resolvedMember = interaction.guild.members.resolve(
      interaction.user.id
    );

    if (!resolvedMember) {
      return false;
    }

    return permissions
      .map((permission) => resolvedMember.permissions.has(permission))
      .every((result) => result);
  });
};

// TODO: default cooldown check
