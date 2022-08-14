import * as path from "path";
import * as fs from "fs";
import { ExtensionSubclass } from "../types";

export const readExtensionDirPaths = (extensionsPath: string) => {
  const extensionPaths = fs
    .readdirSync(extensionsPath)
    .map((p) => path.join(extensionsPath, p))
    .filter((p) => fs.lstatSync(p).isDirectory());

  return extensionPaths;
};

export const importExtensions = async (
  extensionsPath: string
): Promise<ExtensionSubclass[]> => {
  const extensionDirPaths = readExtensionDirPaths(extensionsPath);
  const extensionClasses: ExtensionSubclass[] = [];

  for (const extensionDirPath of extensionDirPaths) {
    const extensionClass = await import(extensionDirPath);
    extensionClasses.push(extensionClass.default);
  }

  return extensionClasses;
};
