import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root })
  .toString("utf8").split("\0").filter(Boolean);
const failures = [];
const blockedPath = /(^|\/)(\.env(?:\..+)?|node_modules|uploads)(\/|$)|\.(?:db|sqlite|sqlite3|pem|key|p12|pfx)$/i;
const secretPatterns = [
  ["private key", /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{30,}\b/],
];

for (const relative of files) {
  if (relative !== "backend/.env.example" && blockedPath.test(relative)) {
    failures.push(`${relative}: sensitive/generated path is publishable`);
    continue;
  }
  const absolute = path.join(root, relative);
  const stat = fs.statSync(absolute);
  if (stat.size > 15 * 1024 * 1024) failures.push(`${relative}: file exceeds 15 MiB`);
  if (stat.size === 0 || stat.size > 2 * 1024 * 1024) continue;
  const content = fs.readFileSync(absolute);
  if (content.includes(0)) continue;
  const text = content.toString("utf8");
  for (const [label, pattern] of secretPatterns) {
    if (pattern.test(text)) failures.push(`${relative}: possible ${label}`);
  }
}

for (const sensitive of ["backend/.env", "backend/database/masjid.db"]) {
  if (!fs.existsSync(path.join(root, sensitive))) continue;
  try {
    execFileSync("git", ["check-ignore", "--quiet", "--", sensitive], { cwd: root, stdio: "ignore" });
  } catch {
    failures.push(`${sensitive}: local sensitive file exists but is not ignored`);
  }
}

const approvalPath = path.join(root, "content-review.json");
if (!fs.existsSync(approvalPath)) {
  failures.push("content-review.json: private organization/content approval record is missing");
} else {
  try {
    const approval = JSON.parse(fs.readFileSync(approvalPath, "utf8"));
    const required = [
      "organization_authority_approved",
      "photos_and_video_approved",
      "names_and_contacts_approved",
      "events_and_program_details_verified",
      "donation_and_submission_copy_approved",
      "deployment_configuration_verified",
    ];
    if (!approval.reviewer || !approval.reviewed_at) failures.push("content-review.json: reviewer and reviewed_at are required");
    for (const field of required) if (approval[field] !== true) failures.push(`content-review.json: ${field} is not approved`);
  } catch {
    failures.push("content-review.json: invalid JSON");
  }
}

if (failures.length) {
  [...new Set(failures)].sort().forEach((failure) => console.error(`FAIL ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`PASS checked ${files.length} publishable files and private approval record`);
}
