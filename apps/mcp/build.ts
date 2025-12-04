#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";

import plugin from "bun-plugin-tailwind";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
🏗️  Bun Build Script

Usage: bun run build.ts [options]

Common Options:
  --outdir <path>          Output directory (default: "dist")
  --minify                 Enable minification (or --minify.whitespace, --minify.syntax, etc)
  --sourcemap <type>      Sourcemap type: none|linked|inline|external
  --target <target>        Build target: browser|bun|node
  --format <format>        Output format: esm|cjs|iife
  --splitting              Enable code splitting
  --packages <type>        Package handling: bundle|external
  --public-path <path>     Public path for assets
  --env <mode>             Environment handling: inline|disable|prefix*
  --conditions <list>      Package.json export conditions (comma separated)
  --external <list>        External packages (comma separated)
  --banner <text>          Add banner text to output
  --footer <text>          Add footer text to output
  --define <obj>           Define global constants (e.g. --define.VERSION=1.0.0)
  --help, -h               Show this help message

Example:
  bun run build.ts --outdir=dist --minify --sourcemap=linked --external=react,react-dom
`);
  process.exit(0);
}

const toCamelCase = (str: string): string =>
  str.replaceAll(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

type ParsedValue = boolean | number | string | string[];

const parseValue = (value: string): ParsedValue => {
  if (value === "true") return true;
  if (value === "false") return false;

  if (/^\d+$/.test(value)) return Number.parseInt(value, 10);
  if (/^\d*\.\d+$/.test(value)) return Number.parseFloat(value);

  if (value.includes(",")) return value.split(",").map((v) => v.trim());

  return value;
};

interface ParsedArg {
  key: string;
  value: ParsedValue;
  skip: number;
}

function parseNegatedArg(arg: string): ParsedArg | undefined {
  if (!arg.startsWith("--no-")) return undefined;
  return { key: toCamelCase(arg.slice(5)), value: false, skip: 0 };
}

function parseBooleanFlag(
  arg: string,
  nextArg: string | undefined,
): ParsedArg | undefined {
  if (arg.includes("=")) return undefined;
  if (nextArg !== undefined && !nextArg.startsWith("--")) return undefined;
  return { key: toCamelCase(arg.slice(2)), value: true, skip: 0 };
}

function parseKeyValueArg(
  arg: string,
  nextArg: string | undefined,
): ParsedArg | undefined {
  let key: string;
  let value: string;
  let skip = 0;

  if (arg.includes("=")) {
    const parts = arg.slice(2).split("=", 2) as [string, string];
    key = parts[0];
    value = parts[1];
  } else {
    key = arg.slice(2);
    value = nextArg ?? "";
    skip = 1;
  }

  return { key: toCamelCase(key), value: parseValue(value), skip };
}

/* eslint-disable security/detect-object-injection -- Build script config keys come from trusted CLI args */
function setConfigValue(
  config: Record<string, unknown>,
  key: string,
  value: ParsedValue,
): void {
  if (key.includes(".")) {
    const [parentKey, childKey] = key.split(".") as [string, string];
    const parent = (config[parentKey] as Record<string, unknown>) ?? {};
    parent[childKey] = value;
    config[parentKey] = parent;
  } else {
    config[key] = value;
  }
}
/* eslint-enable security/detect-object-injection */

/* eslint-disable security/detect-object-injection -- Array indices are bounded by loop condition */
function parseArgs(): Partial<Bun.BuildConfig> {
  const config: Record<string, unknown> = {};
  const args = process.argv.slice(2);
  let i = 0;

  while (i < args.length) {
    const arg = args[i];
    if (arg === undefined || !arg.startsWith("--")) {
      i++;
      continue;
    }

    const parsed =
      parseNegatedArg(arg) ??
      parseBooleanFlag(arg, args[i + 1]) ??
      parseKeyValueArg(arg, args[i + 1]);

    if (parsed) {
      setConfigValue(config, parsed.key, parsed.value);
      i += parsed.skip;
    }
    i++;
  }

  return config as Partial<Bun.BuildConfig>;
}
/* eslint-enable security/detect-object-injection */

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes.toFixed(2)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

console.log("\n🚀 Starting build process...\n");

const cliConfig = parseArgs();
const outdir = cliConfig.outdir || path.join(process.cwd(), "dist");

// eslint-disable-next-line security/detect-non-literal-fs-filename -- outdir is a trusted build output path
if (existsSync(outdir)) {
  console.log(`🗑️ Cleaning previous build at ${outdir}`);
  await rm(outdir, { recursive: true, force: true });
}

const start = performance.now();

const entrypoints = [...new Bun.Glob("**.html").scanSync("src")]
  .map((a) => path.resolve("src", a))
  .filter((dir) => !dir.includes("node_modules"));
console.log(
  `📄 Found ${entrypoints.length} HTML ${entrypoints.length === 1 ? "file" : "files"} to process\n`,
);

const result = await Bun.build({
  entrypoints,
  outdir,
  plugins: [plugin],
  minify: true,
  target: "browser",
  sourcemap: "linked",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  ...cliConfig,
});

const end = performance.now();

const outputTable = result.outputs.map((output) => ({
  File: path.relative(process.cwd(), output.path),
  Type: output.kind,
  Size: formatFileSize(output.size),
}));

console.table(outputTable);
const buildTime = (end - start).toFixed(2);

console.log(`\n✅ Build completed in ${buildTime}ms\n`);
