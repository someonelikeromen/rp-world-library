const fs = require('fs');

function fixAndParse(content) {
  // Remove control characters (except tab, newline)
  content = content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  
  // Fix unescaped inner double quotes in string values
  // Look for patterns like "text"inside"quotes" that break JSON
  // Strategy: replace " inside a value context with smart quotes
  
  // First pass: fix known patterns
  content = content.replace(/"\s*"([^"]{1,10})"/g, (m, inner) => {
    // This looks like a value followed by another value - probably a split
    return '"' + inner.trim() + '"';
  });
  
  // Fix Chinese-style quotes inside JSON values (「」 instead of "")
  // Pattern: : "some text "inner" more" -> : "some text 「inner」 more"
  let result = '';
  let inString = false;
  let stringStart = -1;
  let prevChar = '';
  
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i+1] || '';
    
    if (c === '"' && !inString) {
      // Check if this starts a value (preceded by : or , or [ or start)
      inString = true;
      stringStart = i;
      result += c;
    } else if (c === '"' && inString) {
      // Check if this ends the string (followed by , } ] : or whitespace+these)
      if (next === ',' || next === '}' || next === ']' || next === ':' || next === '\n' || next === '\r' || next === '\t' || next === ' ' || i === content.length - 1 || 
          (next === '"' && content[i+2] !== undefined)) {
        inString = false;
        result += c;
      } else if (prevChar !== '\\') {
        // This is an unescaped inner quote - replace with smart quote
        result += '\u201D';
      } else {
        result += c;
      }
    } else {
      result += c;
    }
    prevChar = c;
  }
  
  content = result;
  
  // Fix trailing commas
  content = content.replace(/,\s*\]/g, ']');
  content = content.replace(/,\s*\}/g, '}');
  
  return JSON.parse(content);
}

const dir = 'campaigns/world-library/manual-curation/hidan-p6-output/';
const files = ['location-graph.json', 'plot-graph.json'];

for (const file of files) {
  const path = dir + file;
  let content = fs.readFileSync(path, 'utf8');
  
  try {
    const data = JSON.parse(content);
    console.log(file + ': already valid - ' + 
      (data.nodes ? data.nodes.length + ' nodes, ' + (data.edges?.length||0) + ' edges' : 
       data.battles ? data.battles.length + ' battles' : ''));
    continue;
  } catch(e) {
    console.log(file + ': ' + e.message.substring(0,60) + ' - fixing...');
  }
  
  try {
    const data = fixAndParse(content);
    if (data.nodes) {
      console.log(file + ': ' + data.nodes.length + ' nodes, ' + (data.edges?.length||0) + ' edges');
    } else {
      console.log(file + ': ' + Object.keys(data).join(', '));
    }
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    console.log(file + ': SAVED ✅');
  } catch(e2) {
    console.log(file + ' STILL BROKEN: ' + e2.message.substring(0,100));
    const pos = parseInt(e2.message.match(/position (\d+)/)?.[1] || '0');
    if (pos > 0) {
      console.log('Context: ...' + content.substring(Math.max(0,pos-30), Math.min(content.length, pos+30)) + '...');
    }
  }
}
