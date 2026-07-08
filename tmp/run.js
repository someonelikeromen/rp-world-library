const { execSync } = require('child_process');
const result = execSync('node E:/pi-st/tmp/readall.js', { encoding: 'utf8', maxBuffer: 500 * 1024 });
console.log(result);
