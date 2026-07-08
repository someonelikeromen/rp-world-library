const { execSync } = require('child_process');
const out = execSync('node E:/pi-st/tmp/do-read.js', { encoding: 'utf8', maxBuffer: 1000 * 1024 });
console.log(out);
