import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : walk(absolute);
    return [absolute];
  });
}

for (const directory of [path.join(root, "backend"), path.join(root, "frontend", "js")]) {
  for (const file of walk(directory)) {
    if (path.extname(file) !== ".js") continue;
    try {
      execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    } catch {
      failures.push(`${path.relative(root, file)}: JavaScript syntax check failed`);
    }
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  process.exitCode = 1;
} else {
  console.log("PASS JavaScript syntax checks");
}
