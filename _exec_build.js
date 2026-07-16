// Execute build script
const { execSync } = require('child_process');
const p = execSync('node "E:\\pi-st\\campaigns\\world-library\\manual-curation\\phase0-output\\run-build.cjs"', {
  encoding: 'utf-8',
  timeout: 60000,
  cwd: 'E:\\pi-st\\campaigns\\world-library\\manual-curation\\phase0-output',
  shell: 'cmd.exe'
});
console.log(p);
