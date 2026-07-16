const fs = require("fs");
let content = fs.readFileSync("campaigns/world-library/manual-curation/hidan-p6-output/location-graph.json","utf8");

// Process line by line - find "key": "value" patterns and fix inner quotes
const lines = content.split("\n");
let fixed = [];

for (const line of lines) {
  const match = line.match(/^(\s*"\w+":\s*)"(.+)"(,?\s*)$/);
  if (match) {
    let prefix = match[1];
    let val = match[2];
    let suffix = match[3];
    // Replace ALL inner " with smart quotes
    val = val.replace(/"/g, "\u201D");
    // Restore the opening and closing JSON quotes
    fixed.push(prefix + '"' + val + '"' + suffix);
  } else {
    fixed.push(line);
  }
}

content = fixed.join("\n");

// Fix trailing commas
content = content.replace(/,\s*\n\s*\]/g, "\n]");
content = content.replace(/,\s*\n\s*\}/g, "\n}");

try {
  const data = JSON.parse(content);
  console.log("Fixed: " + data.nodes.length + " nodes, " + (data.edges?.length || 0) + " edges");
  fs.writeFileSync("campaigns/world-library/manual-curation/hidan-p6-output/location-graph.json", JSON.stringify(data, null, 2));
  console.log("SAVED OK");
} catch(e) {
  console.log("Still: " + e.message.substring(0,100));
  const p = parseInt(e.message.match(/position (\d+)/)?.[1] || "0");
  if (p > 0) console.log("Context:", content.substring(Math.max(0,p-50), Math.min(content.length, p+50)));
}
