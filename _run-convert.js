// Execute conversion script
const { execSync } = require('child_process');
try {
  const stdout = execSync('node "E:\\pi-st\\tmp\\convert-and-extract.js"', {
    cwd: 'E:\\pi-st',
    timeout: 120000,
    shell: 'cmd.exe',
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 100
  });
  console.log(stdout);
} catch(e) {
  console.error('Error:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout);
  if (e.stderr) console.log('stderr:', e.stderr);
}
