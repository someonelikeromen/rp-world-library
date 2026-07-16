const fs = require('fs');

function fixJSON(str) {
  // Find strings containing unescaped inner double quotes
  // Replace Chinese inner quotes  "..."  with  \u201C...\u201D
  return str.replace(/: "((?:[^"]|"[^,\]}])*)"/g, (match) => {
    let content = match.substring(3, match.length - 1);
    content = content.replace(/"/g, '\u201D');
    return ': "' + content.replace(/\u201D/g, function(m, i) {
      // alternate opening and closing
      return '\u201C';
    }) + '"';
  });
}

const dir = 'campaigns/world-library/manual-curation/hidan-p6-output/';
const files = ['location-graph.json', 'plot-graph.json'];

for (const file of files) {
  const path = dir + file;
  let content = fs.readFileSync(path, 'utf8');
  
  try {
    JSON.parse(content);
    console.log(file + ': already valid');
    continue;
  } catch(e) {
    console.log(file + ': fixing...');
  }
  
  // Fix specific known issues
  content = content.replace(/："/g, '：\u201C');
  content = content.replace(/。"(?=[,\s\n\]\}])/g, '。\u201D');
  content = content.replace(/）/g, '\u201D');
  content = content.replace(/\)[\s\n]*"/g, ')\u201D');
  
  // Fix trailing comma in arrays/objects
  content = content.replace(/,\s*\]/g, ']');
  content = content.replace(/,\s*\}/g, '}');
  
  // Remove BOM and control chars
  content = content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  
  try {
    const data = JSON.parse(content);
    if (data.nodes) {
      console.log(file + ': ' + data.nodes.length + ' nodes, ' + (data.edges?.length||0) + ' edges');
    } else {
      console.log(file + ': ' + Object.keys(data).join(', '));
    }
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  } catch(e2) {
    console.log(file + ' STILL BROKEN: ' + e2.message.substring(0,100));
    // Show context around error
    const pos = parseInt(e2.message.match(/position (\d+)/)?.[1] || '0');
    if (pos > 0) {
      console.log('Context: ' + content.substring(Math.max(0,pos-20), Math.min(content.length, pos+50)));
    }
  }
}
