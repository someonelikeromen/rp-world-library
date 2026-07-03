// Root file that requires the runner from within the agent context
const { execSync } = require("child_process");
try {
  const stdout = execSync('node "' + __dirname.replace(/\\/g,'\\\\') + '\\\\phase0-output\\\\build.cjs"', {
    cwd: __dirname + '/campaigns/world-library/manual-curation/phase0-output',
    timeout: 60000,
    shell: true,
    encoding: 'utf-8',
  });
  console.log(stdout);
} catch(e) {
  console.error('Error:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout);
  if (e.stderr) console.log('stderr:', e.stderr);
}
