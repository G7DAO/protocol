const { execSync } = require('child_process');
const path = require('path');

// Get the root directory where the install command was executed
const initCwd = process.env.INIT_CWD || process.cwd();

// Ensure we use a relative path for --patch-dir
const patchDirRelativePath = path.relative(initCwd, path.join(initCwd, 'node_modules/game7-bridge-sdk/patches'));

// Run patch-package using the local node_modules
execSync(`npx patch-package --patch-dir ${patchDirRelativePath}`, {
  stdio: 'inherit',
  cwd: initCwd,
});
