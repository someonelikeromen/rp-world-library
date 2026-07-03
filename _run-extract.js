// Run the extract script
const { execSync } = require('child_process');
try {
  const stdout = execSync('node "E:\\pi-st\\tmp\\convert-and-extract.js"', {
    cwd: 'E:\\pi-st',
    timeout: 120000,
    shell: 'cmd.exe',
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 100
  });
  process.stdout.write(stdout);
} catch(e) {
  process.stderr.write('Error: ' + e.message + '\n');
  if (e.stdout) process.stderr.write('stdout: ' + e.stdout + '\n');
  if (e.stderr) process.stderr.write('stderr: ' + e.stderr + '\n');
}
