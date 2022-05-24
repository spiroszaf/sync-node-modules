#!/usr/bin/env node

const fs = require('fs');
const { exec } = require('child_process');

let installedModulesLock;
let projectLock;
const problems = [];

function getArgValue(argName) {
  const index = process.argv.indexOf(argName);
  if (index == -1 || index == process.argv.length - 1)
    return null;

  return process.argv[index + 1]

}

const options = {
  debug: process.argv.includes('--debug'),
  checkOnly: process.argv.includes('--check-only'),
  customCommand: getArgValue('--command')
};

function checkModule(pkgPath) {
  const pkg = projectLock.packages[pkgPath];
  const installedModule = installedModulesLock.packages[pkgPath];

  if (!installedModule) {
    if (!pkg.optional) {
      problems.push(`${pkgPath}@${pkg.version}: Not installed`);
    }
  } else {
    const isMatch = installedModule.version == pkg.version;
    if (!isMatch) {
      problems.push(`${pkgPath}: Version mismatch. Installed ${installedModule.version}, expected ${pkg.version}`);
    }

    if (options.debug) { console.debug(`${pkgPath}@${pkg.version}: Check OK`); }
  }
}

function runCommand(cmd) {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(stderr);
      return;
    }
    console.error(stdout);
  });
}

fs.readFile(process.cwd() + '/package-lock.json', (err, projectLockBuf) => {
  if (err) { throw err; }

  projectLock = JSON.parse(projectLockBuf.toString('utf8'));

  fs.readFile(process.cwd() + '/node_modules/.package-lock.json', (err2, modulesLockBuf) => {
    if (err) { throw err2; }

    installedModulesLock = JSON.parse(modulesLockBuf.toString('utf8'));

    const directDeps = { ...projectLock.packages[''].dependencies, ...projectLock.packages[''].devDependencies };

    Object.entries(directDeps).forEach(([pkgPath]) => {
      const installPath = `node_modules/${pkgPath}`;

      checkModule(installPath);

      // Since we already checked this package remove it so it won't be double-checked
      delete projectLock.packages[installPath];
    });

    // delete root module
    delete projectLock.packages[''];

    Object.entries(projectLock.packages).forEach(([pkgPath]) => {
      checkModule(pkgPath);
    });

    console.error('')

    if (problems.length > 0) {

      console.error('Problems found:')
      problems.forEach((problem) => console.error(problem));
      console.error('')

      if (options.checkOnly) {
        console.error('Not all packages are installed, or their versions is a match.\n');
        process.exit(-1);
      } else {
        const command = options.customCommand || 'npm install'
        console.error(`Not all packages are installed, or their versions is a match. Running \'${command}\'...\n`);
        runCommand(command);
      }
    } else {
      console.log('All packages are installed. No need to install anything.\n');
    }
  });
});
