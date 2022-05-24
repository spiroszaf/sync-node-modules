# sync-node-modules

Cross-checks your `package-lock.json` with your `node_modules` folder for inconsistencies and runs `npm install` if it finds any

The checking is between the project's `package-lock.json` and the `.package-lock.json` in `node_modules`. This is really efficient since we don't traverse the file system and load/parse every `package.json` in `node_modules`. But we assume that these 2 files are not corrupted in anyway. 

## Command-line usage

Install it globally
`npm install sync-node-modules -g`

Then on a git hook or an npm script or even manually run
 `sync-node-modules`

### Command-line arguments

`--command <custom command>` runs the specified command instead of `npm install`

`--debug` will list all packages that are being cross-checked

`--check-only` will run only the checks and exit with error code `-1` if it finds any problems. It won't run `npm install` automatically. Then it's up to you how to handle things.



