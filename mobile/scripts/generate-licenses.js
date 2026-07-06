// Regenerates ../../licenses.html — a static open-source license notices page
// served on GitHub Pages (https://granborg.github.io/mke_map/licenses.html)
// and linked from the app's store listing. Run after adding/upgrading
// dependencies:
//   npm run generate-licenses
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const raw = JSON.parse(
  execFileSync("npx", ["--yes", "license-checker", "--production", "--json"], {
    cwd: path.join(__dirname, ".."),
    maxBuffer: 64 * 1024 * 1024,
  })
);

const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const entries = [];
for (const key of Object.keys(raw).sort()) {
  if (key.startsWith("mobile@")) continue; // the app itself
  const v = raw[key];
  const at = key.lastIndexOf("@");
  let license = v.licenses || "Unknown";
  // node-forge is dual-licensed; we take it under BSD-3-Clause.
  if (license === "(BSD-3-Clause OR GPL-2.0)") license = "BSD-3-Clause";

  let text = "";
  // license-checker falls back to the README when a package has no LICENSE
  // file; a README is not a license notice, so skip those.
  if (v.licenseFile && !path.basename(v.licenseFile).toLowerCase().includes("readme")) {
    try {
      text = fs.readFileSync(v.licenseFile, "utf8").trim();
    } catch {}
  }

  entries.push({
    name: key.slice(0, at),
    version: key.slice(at + 1),
    license,
    publisher: v.publisher || "",
    repository: v.repository || "",
    text,
  });
}

const items = entries
  .map((e) => {
    const meta = [e.license, e.publisher].filter(Boolean).join(" · ");
    const body = e.text
      ? `<pre>${escape(e.text)}</pre>`
      : `<p>Licensed under ${escape(e.license)}.${
          e.repository ? ` See <a href="${escape(e.repository)}">${escape(e.repository)}</a>.` : ""
        }</p>`;
    return `<details>
<summary><strong>${escape(e.name)}</strong> <span class="v">${escape(e.version)}</span> <span class="meta">${escape(meta)}</span></summary>
${body}
</details>`;
  })
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MKE Neighborhood Watch — Open-Source Licenses</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px 16px; color: #222; }
  h1 { font-size: 1.4rem; }
  details { border-bottom: 1px solid #eee; padding: 8px 0; }
  summary { cursor: pointer; }
  .v, .meta { color: #888; font-size: 0.85em; }
  pre { white-space: pre-wrap; font-size: 0.75rem; background: #f6f6f6; padding: 12px; border-radius: 6px; overflow-x: auto; }
  @media (prefers-color-scheme: dark) {
    body { background: #111; color: #ddd; }
    details { border-bottom-color: #333; }
    pre { background: #1c1c1c; }
    a { color: #7ab8ff; }
  }
</style>
</head>
<body>
<h1>MKE Neighborhood Watch — Open-Source Licenses</h1>
<p>This app is built with the ${entries.length} open-source packages below. Click a package to view its license text.</p>
${items}
</body>
</html>
`;

const out = path.join(__dirname, "..", "..", "licenses.html");
fs.writeFileSync(out, html);
console.log(`Wrote ${entries.length} entries to ${path.relative(process.cwd(), out)}`);
