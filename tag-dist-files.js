#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var program = _interopDefault(require('commander'));
var path = require('path');
var fs = _interopDefault(require('fs'));
var loadJsonFile = _interopDefault(require('load-json-file'));
var child_process = require('child_process');
var async = _interopDefault(require('ez-async'));

var name = "tag-dist-files";
var version = "0.1.2";
var description = "Command line tool for publishing js libraries";
var bin = { "tag-dist-files": "./tag-dist-files.js" };
var files = ["tag-dist-files.*"];
var scripts = { "dist": "rollup -c", "watch": "rollup -cw", "lint": "standard", "debug": "npm run dist && cd _debugging && node --inspect --debug-brk ../tag-dist-files.js", "postversion": "npm run lint && npm run dist", "postpublish": "node ./tag-dist-files.js --overwrite-existing-tag", "_test": "npm run dist && rm -rf _debugging; git clone git@github.com:ez-tools/_debugging.git && cd _debugging && npm publish" };
var keywords = ["publish", "release"];
var author = "Kevin Jahns <kevin.jahns@rwth-aachen.de>";
var license = "MIT";
var devDependencies = { "rollup": "^0.41.4", "rollup-plugin-babel": "^2.7.1", "rollup-plugin-json": "^2.1.0", "rollup-watch": "^3.2.2", "standard": "^8.6.0" };
var dependencies = { "commander": "^2.9.0", "ez-async": "^1.0.0-alpha.1", "load-json-file": "^2.0.0" };
var packageJson = {
	name: name,
	version: version,
	description: description,
	bin: bin,
	files: files,
	scripts: scripts,
	keywords: keywords,
	author: author,
	license: license,
	devDependencies: devDependencies,
	dependencies: dependencies
};

process.on('uncaughtException', function (err) {
  console.error('An exception was thrown: ', err);
});

function exit(err) {
  console.error(err);
  process.exit(1);
}

program.version(packageJson.version).description(packageJson.description);

program.on('--help', function () {
  console.log(`
  Example:

    $ tag-dist-files

  `);
});

var getPackageJson = async(function* (getCallback, dir) {
  while (true) {
    var [err] = yield fs.access(dir, fs.F_OK, getCallback());
    if (!err) {
      var pDir = path.posix.join(dir, 'package.json');[err] = yield fs.access(pDir, fs.F_OK, getCallback());
      if (!err) {
        var p;[err, p] = yield loadJsonFile(pDir);
        if (err) exit(err);
        return [dir, p];
      } else {
        dir = path.posix.join(dir, '..');
      }
    } else exit('You must specify a package.json file!');
  }
});

program.arguments('[dir]').description('Publish the project including distribution files:\n  Build > version bump > commit > create git tag > publish to npm').option('-f, --overwrite-existing-tag', 'Overwrite the existing tag').action(function (dir, command) {
  async(function* (getCallback) {
    var p, err, stdout, stderr;[err, [dir, p]] = yield getPackageJson(dir || './');
    if (err != null) exit('package.json does not exist in this directory!');

    // Specify options for calling process
    var opts = { cwd: dir };

    // Is there a release message?
    if (!fs.existsSync(path.posix.join(dir, '.releaseMessage'))) {
      yield child_process.exec('echo "Title\n\nDescription" > .releaseMessage', opts, getCallback());
    }
    // open it before publishing?
    [err] = yield child_process.exec('xdg-open .releaseMessage', opts, getCallback());

    // read releaseMessage
    var releaseMessage;[err, releaseMessage] = yield fs.readFile(path.posix.join(dir, '.releaseMessage'), 'utf8', getCallback());
    releaseMessage = releaseMessage.split('\n').filter(line => line[0] !== '#').join('\n')

    // detach head
    ;[err, stdout, stderr] = yield child_process.exec('git checkout --detach', opts, getCallback());
    if (err) {
      exit(`Unable to detach head:\n\n${stdout}\n\n${stderr}`);
    } else {
      console.log('✓ Detach head');
    }
    var releasefilesAdded = false;
    var files$$1 = p.files || [];

    // add dist files
    for (var i = 0; i < files$$1.length; i++) {
      [err, stdout, stderr] = yield child_process.exec(`git add ${files$$1[i]} -f`, opts, getCallback());
      if (err) {
        console.warn(`❌ Failed to add ${files$$1[i]} to index`);
      } else {
        releasefilesAdded = true;
        console.log(`✓ Add ${files$$1[i]} to index`);
      }
    }

    if (releasefilesAdded) {
      // commit dist files
      [err, stdout, stderr] = yield child_process.exec(`git commit -am "v${p.version} -- distribution files"`, opts, getCallback());
      if (err) {
        exit(`Unable to commit dist files:\n\n${stdout}\n\n${stderr}`);
      } else {
        console.log('✓ Commit dist files');
      }
    }

    // remove existing tags (e.g. created by np)
    if (command.overwriteExistingTag) {
      yield child_process.exec(`git tag -d v${p.version}`, opts, getCallback());
      yield child_process.exec(`git push origin :refs/tags/v${p.version}`, opts, getCallback());
    }

    // tag releasefiles

    // escape " characters in releaseMessage
    releaseMessage = releaseMessage.split('"').join('\\"');[err, stdout, stderr] = yield child_process.exec(`git tag v${p.version} -m "${releaseMessage}"`, opts, getCallback());
    if (err) {
      exit(`Unable to tag commit:\n\n${stdout}\n\n${stderr}`);
    } else {
      console.log('✓ Tag release');
    }

    // push tag
    [err, stdout, stderr] = yield child_process.exec(`git push origin v${p.version}`, opts, getCallback());
    if (err) {
      exit(`Unable to tag commit:\n\n${stdout}\n\n${stderr}`);
    } else {
      console.log('✓ Push tag');
    }

    // check out master
    [err, stdout, stderr] = yield child_process.exec('git checkout master', opts, getCallback());
    if (err) {
      exit(`Unable to checkout branch 'master':\n\n${stdout}\n\n${stderr}`);
    } else {
      console.log('✓ Checkout master branch');
      yield child_process.exec('rm .releaseMessage', opts, getCallback());
      process.exit(0);
    }
  })();
});

var args = process.argv;
if (args.every((arg, i) => i < 2 || arg[0] === '-')) {
  args.push('.');
}

program.parse(process.argv);

if (!program.args.length) program.help();
//# sourceMappingURL=tag-dist-files.js.map
