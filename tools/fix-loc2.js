const fs = require("fs");
let c = fs.readFileSync(
  "campaigns/world-library/manual-curation/hidan-p6-output/location-graph.json",
  "utf8"
);

// Fix ALL Chinese inner double quotes inside JSON string values
// Strategy: find pattern ChineseChar"text"ChineseChar and replace with 「text」
c = c.replace(
  /([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef])"([^"]{1,20})"([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef，。、])/g,
  "$1「$2」$3"
);

// Also fix closing " that appears before , } ]
c = c.replace(
  /"([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef，。、]+)"/g,
  (m) => {
    // Only replace if this might be inside a JSON string value
    if (m.startsWith('"') && m.endsWith('"')) {
      return '"' + m.slice(1, -1).replace(/"/g, "」") + '"';
    }
    return m;
  }
);

// Fix duplicate closing braces
while (c.includes("}\n  }")) {
  c = c.replace("}\n  }", "}");
}

// Remove trailing commas
c = c.replace(/,\s*\n\s*\]/g, "\n]");
c = c.replace(/,\s*\n\s*\}/g, "\n}");

try {
  const d = JSON.parse(c);
  console.log("OK: " + d.nodes.length + " nodes, " + (d.edges?.length || 0) + " edges");
  fs.writeFileSync(
    "campaigns/world-library/manual-curation/hidan-p6-output/location-graph.json",
    JSON.stringify(d, null, 2)
  );
  console.log("SAVED");
} catch (e) {
  console.log("FAIL: " + e.message.substring(0, 100));
  const p = parseInt(e.message.match(/position (\d+)/)?.[1] || "0");
  if (p > 0) console.log("Near: " + c.substring(Math.max(0, p - 30), Math.min(c.length, p + 30)));
}
