#!/usr/bin/env node
const { spawn } = require('child_process');
const p = spawn('node', ['E:/pi-st/tmp/extract-v27v28.js'], { cwd: 'E:/pi-st', stdio: 'inherit' });
p.on('exit', (code) => process.exit(code));
