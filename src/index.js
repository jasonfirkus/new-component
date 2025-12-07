#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { program } from "commander";

import {
  getConfig,
  buildPrettifier,
  createParentDirectoryIfNecessary,
  logIntro,
  logItemCompletion,
  logConclusion,
  logError,
} from "./helpers.js";
import { mkDirPromise, readFilePromiseRelative, writeFilePromise } from "./utils.js";

import pkg from "../package.json" with { type: "json" };
const { version } = pkg;

const config = getConfig();
const prettify = buildPrettifier(config.prettierConfig);

program
  .version(version)
  .arguments("<componentName>")
  .option(
    "-l, --lang <language>",
    'Which language to use (default: "js")',
    /^(js|ts)$/i,
    config.lang
  )
  .option(
    "-d, --dir <pathToDirectory>",
    'Path to the "components" directory (default: "src/components")',
    config.dir
  )
  .option("--barrel", "Create a folder with index file (barrel export)")
  .parse(process.argv);

const [componentName] = program.args;
const options = program.opts();

if (!componentName) {
  logError("Sorry, you need to specify a name for your component like this: new-component <name>");
  process.exit(1);
}

const fileExtension = "tsx";
const indexExtension = "ts";
const templatePath = `./templates/${options.lang}.js`;

const useBarrel = !!options.barrel;

// Where to place files
const baseDir = options.dir; // always exists/created
const targetDir = useBarrel ? path.join(baseDir, componentName) : baseDir;

// File paths
const componentFilename = useBarrel
  ? `${componentName}.${fileExtension}`
  : `${componentName}.${fileExtension}`;
const componentPath = path.join(
  targetDir,
  useBarrel ? componentFilename : `${componentName}.${fileExtension}`
);
const indexPath = path.join(targetDir, `index.${indexExtension}`);

// Inline index template (barrel)
const indexTemplate = prettify(
  `export * from './${componentName}';
export { default } from './${componentName}';
`
);

// Intro log
logIntro({
  name: componentName,
  dir: useBarrel ? targetDir : baseDir,
  lang: options.lang,
});

async function run() {
  // Ensure base components directory exists
  await createParentDirectoryIfNecessary(baseDir);

  // Prevent overwrites
  if (useBarrel) {
    if (fs.existsSync(path.resolve(targetDir))) {
      logError(
        `Looks like this component already exists! There's already a directory at ${targetDir}. Please delete it and try again.`
      );
      process.exit(1);
    }
  } else {
    if (fs.existsSync(path.resolve(componentPath))) {
      logError(
        `Looks like this component already exists! There's already a file at ${componentPath}. Please delete it and try again.`
      );
      process.exit(1);
    }
  }

  // Create target dir only if using barrel
  if (useBarrel) {
    await mkDirPromise(targetDir);
    logItemCompletion("Directory created.");
  }

  // Build component from template
  const rawTemplate = await readFilePromiseRelative(templatePath);
  const filled = rawTemplate.replace(/COMPONENT_NAME/g, componentName);
  await writeFilePromise(componentPath, prettify(filled));
  logItemCompletion(`Component built and saved to ${useBarrel ? componentPath : baseDir}.`);

  // If barrel, write index file
  if (useBarrel) {
    await writeFilePromise(indexPath, prettify(indexTemplate));
    logItemCompletion("Index file built and saved to disk.");
  }

  logConclusion();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
