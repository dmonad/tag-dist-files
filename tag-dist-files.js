#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

require('regenerator-runtime/runtime');
var program = _interopDefault(require('commander'));
var path = require('path');
var fs = _interopDefault(require('fs'));
var loadJsonFile = _interopDefault(require('load-json-file'));
var child_process = require('child_process');
var async = _interopDefault(require('ez-async'));

var name = "tag-dist-files";
var version = "0.1.6";
var description = "Command line tool for publishing js libraries";
var bin = { "tag-dist-files": "./tag-dist-files.js" };
var files = ["tag-dist-files.*"];
var scripts = { "dist": "rollup -c", "watch": "rollup -cw", "lint": "standard", "debug": "npm run dist && cd _debugging && node --inspect --debug-brk ../tag-dist-files.js", "postversion": "npm run lint && npm run dist", "postpublish": "node ./tag-dist-files.js --overwrite-existing-tag", "_test": "npm run dist && rm -rf _debugging; git clone git@github.com:ez-tools/_debugging.git && cd _debugging && npm publish" };
var keywords = ["publish", "release"];
var author = "Kevin Jahns <kevin.jahns@rwth-aachen.de>";
var license = "MIT";
var devDependencies = { "babel-plugin-external-helpers": "^6.22.0", "babel-preset-es2015": "^6.22.0", "rollup": "^0.41.4", "rollup-plugin-babel": "^2.7.1", "rollup-plugin-json": "^2.1.0", "rollup-watch": "^3.2.2", "standard": "^8.6.0" };
var dependencies = { "commander": "^2.9.0", "ez-async": "^1.0.0-alpha.1", "load-json-file": "^2.0.0", "regenerator-runtime": "^0.10.1" };
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

var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

process.on('uncaughtException', function (err) {
  console.error('An exception was thrown: ', err);
});

program.version(packageJson.version).description(packageJson.description);

program.on('--help', function () {
  console.log('\n  Example:\n\n    $ tag-dist-files\n\n  ');
});

program.arguments('[dir]').description('Publish the project including distribution files:\n  Build > version bump > commit > create git tag > publish to npm').option('-f, --overwrite-existing-tag', 'Overwrite the existing tag').action(function (dir, command) {
  // Specify options for calling process
  var opts = { cwd: dir };

  async(regeneratorRuntime.mark(function _callee2(getCallback) {
    var _marked, exit, getPackageJson, p, err, stdout, stderr, _ref7, _ref8, _ref8$, _ref9, _ref10, releaseMessage, _ref11, _ref12, _ref13, _ref14, releasefilesAdded, files$$1, i, _ref15, _ref16, _ref17, _ref18, _ref19, _ref20, _ref21, _ref22, _ref23, _ref24;

    return regeneratorRuntime.wrap(function _callee2$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            exit = function exit(err) {
              return regeneratorRuntime.wrap(function exit$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      console.error(err);
                      // move back from backup
                      i = 0;

                    case 2:
                      if (!(i < files$$1.length)) {
                        _context.next = 8;
                        break;
                      }

                      _context.next = 5;
                      return child_process.exec('rm -rf ' + files$$1[i] + ' && cp -rf .tag-dist-files-backup/' + files$$1[i] + ' .', opts, getCallback());

                    case 5:
                      i++;
                      _context.next = 2;
                      break;

                    case 8:
                      _context.next = 10;
                      return child_process.exec('rm -rf .tag-dist-files-backup', opts, getCallback());

                    case 10:

                      console.log('Reverting to master branch');
                      _context.next = 13;
                      return child_process.exec('git checkout master', opts, getCallback());

                    case 13:
                      process.exit(1);

                    case 14:
                    case 'end':
                      return _context.stop();
                  }
                }
              }, _marked[0], this);
            };

            _marked = [exit].map(regeneratorRuntime.mark);
            getPackageJson = async(regeneratorRuntime.mark(function _callee(getCallback, dir) {
              var _ref, _ref2, err, pDir, _ref3, _ref4, p, _ref5, _ref6;

              return regeneratorRuntime.wrap(function _callee$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      

                      _context2.next = 3;
                      return fs.access(dir, fs.F_OK, getCallback());

                    case 3:
                      _ref = _context2.sent;
                      _ref2 = slicedToArray(_ref, 1);
                      err = _ref2[0];

                      if (err) {
                        _context2.next = 28;
                        break;
                      }

                      pDir = path.posix.join(dir, 'package.json');
                      _context2.next = 10;
                      return fs.access(pDir, fs.F_OK, getCallback());

                    case 10:
                      _ref3 = _context2.sent;
                      _ref4 = slicedToArray(_ref3, 1);
                      err = _ref4[0];

                      if (err) {
                        _context2.next = 25;
                        break;
                      }

                      _context2.next = 16;
                      return loadJsonFile(pDir);

                    case 16:
                      _ref5 = _context2.sent;
                      _ref6 = slicedToArray(_ref5, 2);
                      err = _ref6[0];
                      p = _ref6[1];

                      if (!err) {
                        _context2.next = 22;
                        break;
                      }

                      return _context2.delegateYield(exit(err), 't0', 22);

                    case 22:
                      return _context2.abrupt('return', [dir, p]);

                    case 25:
                      dir = path.posix.join(dir, '..');

                    case 26:
                      _context2.next = 29;
                      break;

                    case 28:
                      return _context2.delegateYield(exit('You must specify a package.json file!'), 't1', 29);

                    case 29:
                      _context2.next = 0;
                      break;

                    case 31:
                    case 'end':
                      return _context2.stop();
                  }
                }
              }, _callee, this);
            }));
            _context3.next = 5;
            return getPackageJson(dir || './');

          case 5:
            _ref7 = _context3.sent;
            _ref8 = slicedToArray(_ref7, 2);
            err = _ref8[0];
            _ref8$ = slicedToArray(_ref8[1], 2);
            dir = _ref8$[0];
            p = _ref8$[1];

            if (err != null) {
              console.error('package.json does not exist in this directory!');
              process.exit(1);
            }

            // Is there a release message?

            if (fs.existsSync(path.posix.join(dir, '.releaseMessage'))) {
              _context3.next = 15;
              break;
            }

            _context3.next = 15;
            return child_process.exec('echo "Title\n\nDescription" > .releaseMessage', opts, getCallback());

          case 15:
            // open it before publishing?
            ;_context3.next = 18;
            return child_process.exec('xdg-open .releaseMessage', opts, getCallback());

          case 18:
            _ref9 = _context3.sent;
            _ref10 = slicedToArray(_ref9, 1);
            err = _ref10[0];

            // read releaseMessage

            _context3.next = 23;
            return fs.readFile(path.posix.join(dir, '.releaseMessage'), 'utf8', getCallback());

          case 23:
            _ref11 = _context3.sent;
            _ref12 = slicedToArray(_ref11, 2);
            err = _ref12[0];
            releaseMessage = _ref12[1];

            releaseMessage = releaseMessage.split('\n').filter(function (line) {
              return line[0] !== '#';
            }).join('\n')

            // detach head
            ;_context3.next = 30;
            return child_process.exec('git checkout --detach', opts, getCallback());

          case 30:
            _ref13 = _context3.sent;
            _ref14 = slicedToArray(_ref13, 3);
            err = _ref14[0];
            stdout = _ref14[1];
            stderr = _ref14[2];

            if (!err) {
              _context3.next = 39;
              break;
            }

            return _context3.delegateYield(exit('Unable to detach head:\n\n' + stdout + '\n\n' + stderr), 't0', 37);

          case 37:
            _context3.next = 40;
            break;

          case 39:
            console.log('✓ Detach head');

          case 40:
            releasefilesAdded = false;
            files$$1 = p.files || [];
            _context3.next = 44;
            return child_process.exec('mkdir -p .tag-dist-files-backup', opts, getCallback());

          case 44:
            i = 0;

          case 45:
            if (!(i < files$$1.length)) {
              _context3.next = 59;
              break;
            }

            _context3.next = 48;
            return child_process.exec('cp ' + files$$1[i] + ' -rf .tag-dist-files-backup', opts, getCallback());

          case 48:
            _context3.next = 50;
            return child_process.exec('git add ' + files$$1[i] + ' -f', opts, getCallback());

          case 50:
            _ref15 = _context3.sent;
            _ref16 = slicedToArray(_ref15, 3);
            err = _ref16[0];
            stdout = _ref16[1];
            stderr = _ref16[2];

            if (err) {
              console.warn('\u274C Failed to add ' + files$$1[i] + ' to index');
            } else {
              releasefilesAdded = true;
              console.log('\u2713 Add ' + files$$1[i] + ' to index');
            }

          case 56:
            i++;
            _context3.next = 45;
            break;

          case 59:
            if (!releasefilesAdded) {
              _context3.next = 73;
              break;
            }

            // commit dist files
            ;_context3.next = 63;
            return child_process.exec('git commit -am "v' + p.version + ' -- distribution files"', opts, getCallback());

          case 63:
            _ref17 = _context3.sent;
            _ref18 = slicedToArray(_ref17, 3);
            err = _ref18[0];
            stdout = _ref18[1];
            stderr = _ref18[2];

            if (!err) {
              _context3.next = 72;
              break;
            }

            return _context3.delegateYield(exit('Unable to commit dist files:\n\n' + stdout + '\n\n' + stderr), 't1', 70);

          case 70:
            _context3.next = 73;
            break;

          case 72:
            console.log('✓ Commit dist files');

          case 73:
            if (!command.overwriteExistingTag) {
              _context3.next = 78;
              break;
            }

            _context3.next = 76;
            return child_process.exec('git tag -d v' + p.version, opts, getCallback());

          case 76:
            _context3.next = 78;
            return child_process.exec('git push origin :refs/tags/v' + p.version, opts, getCallback());

          case 78:

            // tag releasefiles

            // escape " characters in releaseMessage
            releaseMessage = releaseMessage.split('"').join('\\"');_context3.next = 81;
            return child_process.exec('git tag v' + p.version + ' -m "' + releaseMessage + '"', opts, getCallback());

          case 81:
            _ref19 = _context3.sent;
            _ref20 = slicedToArray(_ref19, 3);
            err = _ref20[0];
            stdout = _ref20[1];
            stderr = _ref20[2];

            if (!err) {
              _context3.next = 90;
              break;
            }

            return _context3.delegateYield(exit('Unable to tag commit:\n\n' + stdout + '\n\n' + stderr), 't2', 88);

          case 88:
            _context3.next = 91;
            break;

          case 90:
            console.log('✓ Tag release');

          case 91:

            // push tag
            ;_context3.next = 94;
            return child_process.exec('git push origin v' + p.version, opts, getCallback());

          case 94:
            _ref21 = _context3.sent;
            _ref22 = slicedToArray(_ref21, 3);
            err = _ref22[0];
            stdout = _ref22[1];
            stderr = _ref22[2];

            if (!err) {
              _context3.next = 103;
              break;
            }

            return _context3.delegateYield(exit('Unable to tag commit:\n\n' + stdout + '\n\n' + stderr), 't3', 101);

          case 101:
            _context3.next = 104;
            break;

          case 103:
            console.log('✓ Push tag');

          case 104:

            // check out master
            ;_context3.next = 107;
            return child_process.exec('git checkout master', opts, getCallback());

          case 107:
            _ref23 = _context3.sent;
            _ref24 = slicedToArray(_ref23, 3);
            err = _ref24[0];
            stdout = _ref24[1];
            stderr = _ref24[2];

            if (!err) {
              _context3.next = 116;
              break;
            }

            return _context3.delegateYield(exit('Unable to checkout branch \'master\':\n\n' + stdout + '\n\n' + stderr), 't4', 114);

          case 114:
            _context3.next = 129;
            break;

          case 116:
            console.log('✓ Checkout master branch');
            // move back from backup
            i = 0;

          case 118:
            if (!(i < files$$1.length)) {
              _context3.next = 124;
              break;
            }

            _context3.next = 121;
            return child_process.exec('rm -rf ' + files$$1[i] + ' && cp -rf .tag-dist-files-backup/' + files$$1[i] + ' .', opts, getCallback());

          case 121:
            i++;
            _context3.next = 118;
            break;

          case 124:
            _context3.next = 126;
            return child_process.exec('rm -rf .tag-dist-files-backup', opts, getCallback());

          case 126:
            _context3.next = 128;
            return child_process.exec('rm .releaseMessage', opts, getCallback());

          case 128:
            process.exit(0);

          case 129:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee2, this);
  }))();
});

var args = process.argv;
if (args.every(function (arg, i) {
  return i < 2 || arg[0] === '-';
})) {
  args.push('.');
}

program.parse(process.argv);

if (!program.args.length) program.help();
//# sourceMappingURL=tag-dist-files.js.map
