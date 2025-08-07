// helpers.js (ESM)

import os from "os";
import fs from "fs";
import path from "path";

import prettier from "prettier";
import chalk from "chalk";

import { requireOptional, sample } from "./utils.js";
import AFFIRMATIONS from "./affirmations.js";

// Get the configuration for this component.
export const getConfig = () => {
  const home = os.homedir();
  const currentPath = process.cwd();

  const defaults = { lang: "ts", dir: "src/components" };

  const globalOverrides = requireOptional(path.join(home, ".new-component-config.json"));

  const localOverrides = requireOptional(path.join(currentPath, ".new-component-config.json"));

  return Object.assign({}, defaults, globalOverrides, localOverrides);
};

// Build a prettier formatter that ignores the Tailwind plugin
export const buildPrettifier = () => {
  // Prefer async API, but we can keep sync semantics here by resolving now.
  let config = prettier.resolveConfig.sync(process.cwd());

  // default config:
  config = config || {
    semi: true,
    singleQuote: true,
    trailingComma: "es5",
  };

  // Ensure a parser is set:
  config.parser = config.parser || "babel";

  // --- KEY PART: remove/prevent Tailwind plugin loading ---
  // 1) Drop any configured plugins that include 'prettier-plugin-tailwindcss'
  if (config.plugins) {
    config.plugins = config.plugins.filter(p => {
      const id = typeof p === "string" ? p : String(p?.name || p);
      return !/prettier-plugin-tailwindcss/.test(id);
    });
  }
  // 2) Disable plugin auto-discovery so Prettier won't try to load it anyway
  config.pluginSearchDirs = false;

  return text => prettier.format(text, config);
};

export const createParentDirectoryIfNecessary = async dir => {
  const fullPathToParentDir = path.resolve(dir);

  if (!fs.existsSync(fullPathToParentDir)) {
    fs.mkdirSync(dir);
  }
};

// Emit a message confirming the creation of the component
const colors = {
  red: [216, 16, 16],
  green: [142, 215, 0],
  blue: [0, 186, 255],
  gold: [255, 204, 0],
  mediumGray: [128, 128, 128],
  darkGray: [90, 90, 90],
};

const langNames = {
  js: "JavaScript",
  ts: "TypeScript",
};

const logComponentLang = selected =>
  ["js", "ts"]
    .map(option =>
      option === selected
        ? `${chalk.bold.rgb(...colors.blue)(langNames[option])}`
        : `${chalk.rgb(...colors.darkGray)(langNames[option])}`
    )
    .join("  ");

export const logIntro = ({ name, dir, lang }) => {
  console.info("\n");
  console.info(`✨  Creating the ${chalk.bold.rgb(...colors.gold)(name)} component ✨`);
  console.info("\n");

  const pathString = chalk.bold.rgb(...colors.blue)(dir);
  const langString = logComponentLang(lang);

  console.info(`Directory:  ${pathString}`);
  console.info(`Language:   ${langString}`);
  console.info(chalk.rgb(...colors.darkGray)("========================================="));

  console.info("\n");
};

export const logItemCompletion = successText => {
  const checkmark = chalk.rgb(...colors.green)("✓");
  console.info(`${checkmark} ${successText}`);
};

export const logConclusion = () => {
  console.info("\n");
  console.info(chalk.bold.rgb(...colors.green)("Component created!"));
  console.info(chalk.rgb(...colors.mediumGray)(sample(AFFIRMATIONS)));
  console.info("\n");
};

export const logError = error => {
  console.info("\n");
  console.info(chalk.bold.rgb(...colors.red)("Error creating component."));
  console.info(chalk.rgb(...colors.red)(error));
  console.info("\n");
};
