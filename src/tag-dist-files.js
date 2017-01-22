import program from 'commander'
import packageJson from '../package.json'
import { posix as path } from 'path'
import fs from 'fs'
import loadJsonFile from 'load-json-file'
import { exec } from 'child_process'
import async from 'ez-async'

process.on('uncaughtException', function (err) {
  console.error('An exception was thrown: ', err)
})

program
  .version(packageJson.version)
  .description(packageJson.description)

program.on('--help', function () {
  console.log(`
  Example:

    $ tag-dist-files

  `)
})

program
  .arguments('[dir]')
  .description('Publish the project including distribution files:\n  Build > version bump > commit > create git tag > publish to npm')
  .option('-f, --overwrite-existing-tag', 'Overwrite the existing tag')
  .action(function (dir, command) {
    // Specify options for calling process
    var opts = { cwd: dir }

    async(function * (getCallback) {
      function * exit (err) {
        console.error(err)
        console.log('Reverting to master branch')
        yield exec('git checkout master', opts, getCallback())
        process.exit(1)
      }

      var getPackageJson = async(function * (getCallback, dir) {
        while (true) {
          var [err] = yield fs.access(dir, fs.F_OK, getCallback())
          if (!err) {
            var pDir = path.join(dir, 'package.json')
            ;[err] = yield fs.access(pDir, fs.F_OK, getCallback())
            if (!err) {
              var p
              ;[err, p] = yield loadJsonFile(pDir)
              if (err) yield * exit(err)
              return [dir, p]
            } else {
              dir = path.join(dir, '..')
            }
          } else yield * exit('You must specify a package.json file!')
        }
      })

      var p, err, stdout, stderr

      // check for existing package.json
      ;[err, [dir, p]] = yield getPackageJson(dir || './')
      if (err != null) {
        console.error('package.json does not exist in this directory!')
        process.exit(1)
      }

      // Is there a release message?
      if (!fs.existsSync(path.join(dir, '.releaseMessage'))) {
        yield exec('echo "Title\n\nDescription" > .releaseMessage', opts, getCallback())
      }
      // open it before publishing?
      ;[err] = yield exec('xdg-open .releaseMessage', opts, getCallback())

      // read releaseMessage
      var releaseMessage
      ;[err, releaseMessage] = yield fs.readFile(path.join(dir, '.releaseMessage'), 'utf8', getCallback())
      releaseMessage = releaseMessage.split('\n').filter(line => line[0] !== '#').join('\n')

      // detach head
      ;[err, stdout, stderr] = yield exec('git checkout --detach', opts, getCallback())
      if (err) {
        yield * exit(`Unable to detach head:\n\n${stdout}\n\n${stderr}`)
      } else {
        console.log('✓ Detach head')
      }
      var releasefilesAdded = false
      var files = p.files || []

      // add dist files
      for (var i = 0; i < files.length; i++) {
        ;[err, stdout, stderr] = yield exec(`git add ${files[i]} -f`, opts, getCallback())
        if (err) {
          console.warn(`❌ Failed to add ${files[i]} to index`)
        } else {
          releasefilesAdded = true
          console.log(`✓ Add ${files[i]} to index`)
        }
      }

      if (releasefilesAdded) {
        // commit dist files
        ;[err, stdout, stderr] = yield exec(`git commit -am "v${p.version} -- distribution files"`, opts, getCallback())
        if (err) {
          yield * exit(`Unable to commit dist files:\n\n${stdout}\n\n${stderr}`)
        } else {
          console.log('✓ Commit dist files')
        }
      }

      // remove existing tags (e.g. created by np)
      if (command.overwriteExistingTag) {
        yield exec(`git tag -d v${p.version}`, opts, getCallback())
        yield exec(`git push origin :refs/tags/v${p.version}`, opts, getCallback())
      }

      // tag releasefiles

      // escape " characters in releaseMessage
      releaseMessage = releaseMessage.split('"').join('\\"')
      ;[err, stdout, stderr] = yield exec(`git tag v${p.version} -m "${releaseMessage}"`, opts, getCallback())
      if (err) {
        yield * exit(`Unable to tag commit:\n\n${stdout}\n\n${stderr}`)
      } else {
        console.log('✓ Tag release')
      }

      // push tag
      ;[err, stdout, stderr] = yield exec(`git push origin v${p.version}`, opts, getCallback())
      if (err) {
        yield * exit(`Unable to tag commit:\n\n${stdout}\n\n${stderr}`)
      } else {
        console.log('✓ Push tag')
      }

      // check out master
      ;[err, stdout, stderr] = yield exec('git checkout master', opts, getCallback())
      if (err) {
        yield * exit(`Unable to checkout branch 'master':\n\n${stdout}\n\n${stderr}`)
      } else {
        console.log('✓ Checkout master branch')
        yield exec('rm .releaseMessage', opts, getCallback())
        process.exit(0)
      }
    })()
  })

var args = process.argv
if (args.every((arg, i) => i < 2 || arg[0] === '-')) {
  args.push('.')
}

program
  .parse(process.argv)

if (!program.args.length) program.help()
