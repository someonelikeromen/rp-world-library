const fs = require("fs");

// A two-pass approach using structural awareness
function fixLocationGraph(filepath) {
  let content = fs.readFileSync(filepath, "utf8");
  
  // Pass 1: fix ALL inner ASCII double quotes inside string values
  // Strategy: process character by character with state tracking
  let result = [];
  let inStr = false;
  let i = 0;
  
  while (i < content.length) {
    const c = content[i];
    const next = content[i + 1] || "";
    
    if (c === '"') {
      if (!inStr) {
        // Check if this starts a string value
        // The char before should be : , [ or whitespace (for array elements)
        const before = content.substring(Math.max(0, i - 20), i);
        result.push(c);
        // Only start string if this looks like a value-opening quote
        if (/:\s*$/.test(before) || /,\s*$/.test(before) || /\[\s*$/.test(before)) {
          inStr = true;
        }
      } else {
        // We're inside a string - check if this is structural closing
        const after = content.substring(i + 1, Math.min(content.length, i + 10));
        if (/^[,\]\}\s\n\r]/.test(after) || /^:\s/.test(after)) {
          // This is the closing quote of the JSON string
          result.push(c);
          inStr = false;
        } else {
          // This is an inner quote - replace with smart quotes
          // Use \u201C or \u201D based on context
          const trailingText = after.substring(0, 5);
          if (/^[^\s,}\]]/.test(trailingText)) {
            result.push("\u201C"); // opening smart quote
          } else {
            result.push("\u201D"); // closing smart quote
          }
        }
      }
    } else {
      result.push(c);
    }
    i++;
  }
  
  content = result.join("");
  
  // Pass 2: Remove duplicate closing braces
  content = content.replace(/}\s*\n\s*}\s*\n\s*\]/g, "}\n  ]");
  
  // Remove trailing commas
  content = content.replace(/,\s*\n\s*\]/g, "\n]");
  content = content.replace(/,\s*\n\s*\}/g, "\n}");
  
  try {
    const data = JSON.parse(content);
    console.log("OK: " + data.nodes.length + " nodes, " + (data.edges?.length || 0) + " edges");
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    return true;
  } catch(e) {
    console.log("Still broken: " + e.message.substring(0, 100));
    const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || "0");
    if (pos > 0) {
      console.log("Context: " + content.substring(Math.max(0, pos - 40), Math.min(content.length, pos + 40)));
    }
    return false;
  }
}

fixLocationGraph("campaigns/world-library/manual-curation/hidan-p6-output/location-graph.json");
