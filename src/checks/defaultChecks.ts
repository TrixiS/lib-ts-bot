import { checkFactory } from "./checkFactory";
import { CommandRunOptions } from "../command";
import { PermissionResolvable } from "discord.js";

export const guildOnly = () => {
  return checkFactory(async ({ interaction }: CommandRunOptions) => {
    return Boolean(interaction.guild && interaction.member);
  });
};

export const hasPermissions = (...permissions: PermissionResolvable[]) => {
  return checkFactory(async ({ interaction }: CommandRunOptions) => {
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
