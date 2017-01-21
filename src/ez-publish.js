import program from 'commander'
import packageJson from '../package.json'
import { posix as path } from 'path'
import fs from 'fs'
import writeJsonFile from 'write-json-file'
import semver from 'semver'
import loadJsonFile from 'load-json-file'
import { exec, spawn } from 'child_process'
import async from 'ez-async'

process.on('uncaughtException', function (err) {
  console.error('An exception was thrown: ', err)
})

function exit (err) {
  console.error(err)
  process.exit(1)
}

program
  .version(packageJson.version)
  .description(packageJson.description)

program.on('--help', function () {
  console.log(`
  Example:

    $ ez-publish

  `)
})

var getPackageJson = async(function * (getCallback, dir) {
  while (true) {
    var [err] = yield fs.access(dir, fs.F_OK, getCallback())
    if (!err) {
      var pDir = path.join(dir, 'package.json')
      ;[err] = yield fs.access(pDir, fs.F_OK, getCallback())
      if (!err) {
        var p
        ;[err, p] = yield loadJsonFile(pDir)
        if (err) exit(err)
        return [dir, p]
      } else {
        dir = path.join(dir, '..')
      }
    } else exit('You must specify a package.json file!')
  }
})

program
  .arguments('[dir]')
  .description('Publish the project including distribution files:\n  Build > version bump > commit > create git tag > publish to npm')
  .option('-s, --semver <semver>', 'Specify semver type major|minor|patch|premajor|preminor|prepatch|prerelease', /^(major|minor|patch|premajor|preminor|prepatch|prerelease)$/i)
  .option('-x, --use-xdg-open', 'Use the default graphical (X) editor')
  .action(function (dir, command) {
    async(function * (getCallback) {
      var rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      })
      var p, err
      dir = path.join(process.cwd(), dir || '.')
      ;[err, [dir, p]] = yield getPackageJson(dir || './')

      if (err != null) exit('package.json does not exist in this directory!')

      // pull remote updates
      yield exec('git remote update', getCallback())

      var stdout, stderr
      var opts = { cwd: dir }

      // print if remote updates exist
      ;[err, stdout, stderr] = yield exec('git status -uno -s', opts, getCallback())
      console.log(stdout)
      if (err != null || stdout !== '') exit('Commit remaining changes before publishing')

      // ask for version increment type
      var validTypes = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease']
      var type
      if (command.semver == null) {
        ;[type] = yield rl.question(`How do you want to increment the version? [${validTypes.join('|')}]\n=>`, getCallback())
      } else {
        type = command.semver
      }
      var validType = validTypes.some(function (t) { return t === type })

      if (validType) {
        p.version = semver.inc(p.version, type, 'alpha')
        if (p.version == null) exit('Invalid semver version in package.json!')
      } else {
        exit('You must choose one of of these: ' + validTypes.join(' | '))
      }

      if (!fs.existsSync(path.join(dir, '.releaseMessage'))) {
        yield exec('echo "Title\n\nDescription" > .releaseMessage', opts, getCallback())
      }
      if (command.useXdgOpen) {
        ;[err] = yield exec('xdg-open .releaseMessage', opts, getCallback())
      } else {
        rl.pause()
        ;[err] = yield spawn('vim', ['.releaseMessage'], { cwd: dir, stdio: 'inherit' }).on('exit', getCallback())
        rl.resume()
      }

      var releaseMessage
      ;[err, releaseMessage] = yield fs.readFile(path.join(dir, '.releaseMessage'), 'utf8', getCallback())
      releaseMessage = releaseMessage.split('\n').filter(line => line[0] !== '#').join('\n')

      if (releaseMessage.length === 0) {
        exit('You must create a release message!')
      }

      // ask user if sHe really want's to publish
      var [answer] = yield rl.question(`Publishing version ${p.version}. Message:\n${releaseMessage}\n\n Okay? [y|N]\n=>`, getCallback())
      if (['y', 'Y', 'yes'].every(function (a) { return a !== answer })) {
        exit('Interrupt publish')
      }

      // update package.json
      ;[err] = yield writeJsonFile(path.join(dir, 'package.json'), p, { indent: 2 })
      if (err != null) exit(err)

      var changelog = `# ${p.version} ${releaseMessage}\n\n`
      var changelogPath = path.join(dir, 'CHANGELOG.md')
      var err3
      if (fs.existsSync(changelogPath)) {
        var content
        ;[err3, content] = yield fs.readFile(changelogPath, 'utf8', getCallback())
        changelog += content
      }
      ;[err] = yield fs.writeFile(changelogPath, changelog, 'utf8', getCallback())
      var [err2] = yield exec('git add CHANGELOG.md', opts, getCallback())

      if (err || err2 || err3) {
        exit(`Unable to update CHANGELOG.md: ${err || err2 || err3}`)
      } else {
        console.log('✓ Update CHANGELOG.md')
      }

      // commit remaining changes (changes to package.json, CHANGELOG.md)
      ;[err, stdout, stderr] = yield exec(`git commit -am "Publish v${p.version}: ${releaseMessage}"`, opts, getCallback())
      if (err) {
        exit(`Unable to commit version update (commit version property in package.json):\n\n${stdout}\n\n${stderr}`)
      } else {
        console.log('✓ Commit version update')
      }

      // push commit
      ;[err, stdout, stderr] = yield exec('git push', opts, getCallback())
      if (err) {
        exit(`Unable to push changes:\n\n${stdout}\n\n${stderr}`)
      } else {
        console.log('✓ Push changes')
      }

      // detach head
      ;[err, stdout, stderr] = yield exec('git checkout --detach', opts, getCallback())
      if (err) {
        exit(`Unable to detach head:\n\n${stdout}\n\n${stderr}`)
      } else {
        console.log('✓ Detach head')
      }
      var releasefilesAdded = false
      // add dist files
      ;[err, stdout, stderr] = yield exec('git add ./dist/* -f', opts, getCallback())
      if (err) {
        console.log('❌ Failed to add ./dist/* to index')
      } else {
        releasefilesAdded = true
        console.log('✓ Add ./dist/* to index')
      }

      // add module exports (i.e. ./ez-publish*)
      ;[err, stdout, stderr] = yield exec(`git add ./${p.name}* -f`, opts, getCallback())
      if (err) {
        console.log(`❌ Failed to add ./${p.name}* to index`)
      } else {
        releasefilesAdded = true
        console.log(`✓ Add ./${p.name}* to index`)
      }

      if (releasefilesAdded) {
        // commit dist files
        ;[err, stdout, stderr] = yield exec(`git commit -am "Publish v${p.version} -- distribution files"`, opts, getCallback())
        if (err) {
          exit(`Unable to commit dist files:\n\n${stdout}\n\n${stderr}`)
        } else {
          console.log('✓ Commit dist files')
        }
      }

      // tag releasefiles
      ;[err, stdout, stderr] = yield exec(`git tag v${p.version} -m "${releaseMessage}"`, opts, getCallback())
      if (err) {
        exit(`Unable to tag commit:\n\n${stdout}\n\n${stderr}`)
      } else {
        console.log('✓ Tag release')
      }

      // push tag
      ;[err, stdout, stderr] = yield exec(`git push origin v${p.version}`, opts, getCallback())
      if (err) {
        exit(`Unable to tag commit:\n\n${stdout}\n\n${stderr}`)
      } else {
        console.log('✓ Push tag')
      }

      // Publish to npm
      ;[err, stdout, stderr] = yield exec('npm publish', opts, getCallback())
      if (err) {
        console.log('❌ Failed to publish to npm. Please call `npm publish` yourself', err, stderr)
      } else {
        console.log('✓ Publish to npm')
      }

      // check out master
      ;[err, stdout, stderr] = yield exec('git checkout master', opts, getCallback())
      if (err) {
        exit(`Unable to checkout branch 'master':\n\n${stdout}\n\n${stderr}`)
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
