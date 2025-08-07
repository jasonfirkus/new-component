/*
Utils are general building blocks. Platform-specific, but not
application-specific

They're useful for abstracting away the configuration for native methods,
or defining new convenience methods for things like working with files,
data munging, etc.

NOTE: Utils should be general enough to be useful in any Node application.
For application-specific concerns, use `helpers.js`.
*/
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load a local config file if it exists, otherwise return {}.
 * Supports JSON and CommonJS. (Keeps it synchronous.)
 */
function requireOptional(p) {
  const abs = path.isAbsolute(p) ? p : path.resolve(p);

  if (!fs.existsSync(abs)) return {};

  // JSON: read directly (no ESM import assertions, no URL fuss)
  if (abs.toLowerCase().endsWith(".json")) {
    try {
      const raw = fs.readFileSync(abs, "utf8");
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  // CJS: try require
  try {
    return require(abs);
  } catch {
    // If it’s not JSON/CJS or fails, just fall back to empty
    return {};
  }
}

const mkDirPromise = dirPath =>
  new Promise((resolve, reject) => {
    fs.mkdir(dirPath, err => {
      err ? reject(err) : resolve();
    });
  });

// Simple promise wrappers for read/write files.
// utf-8 is assumed.
const readFilePromise = fileLocation =>
  new Promise((resolve, reject) => {
    fs.readFile(fileLocation, "utf-8", (err, text) => {
      err ? reject(err) : resolve(text);
    });
  });

const writeFilePromise = (fileLocation, fileContent) =>
  new Promise((resolve, reject) => {
    fs.writeFile(fileLocation, fileContent, "utf-8", err => {
      err ? reject(err) : resolve();
    });
  });

// Somewhat counter-intuitively, `fs.readFile` works relative to the current
// working directory (if the user is in their own project, it's relative to
// their project). This is unlike `require()` calls, which are always relative
// to the code's directory.
const readFilePromiseRelative = fileLocation => readFilePromise(path.join(__dirname, fileLocation));

const sample = arr => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export {
  requireOptional,
  mkDirPromise,
  readFilePromise,
  writeFilePromise,
  readFilePromiseRelative,
  sample,
};
