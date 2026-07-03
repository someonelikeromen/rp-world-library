const { execSync } = require('child_process');
const result = execSync('node "E:/pi-st/tmp/extract-v27v28.js"', { cwd: 'E:/pi-st', encoding: 'utf8' });
console.log(result);
