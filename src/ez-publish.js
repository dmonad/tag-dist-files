import program from 'commander'
import packageJson from '../package.json'
import { posix as path } from 'path'
import fs from 'fs'
import writeJsonFile from 'write-json-file'
import semver from 'semver'
import loadJsonFile from 'load-json-file'
import { exec } from 'child_process'
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
    } else exit('You need to specify a package.json file!')
  }
})

program
  .command('publish [dir]')
  .description('Publish the project including distribution files:\n               Build > version bump > commit > create git tag > publish to npm ')
  .action(function (dir) {
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

      // print if remote updates exist
      ;[err, stdout, stderr] = yield exec('git status -uno -s', getCallback())
      console.log(stdout)
      if (err != null || stdout !== '') exit('Commit remaining changes before publishing')

      // ask for version increment type
      var validTypes = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease']
      var [type] = yield rl.question(`How do you want to increment the version? [${validTypes.join('|')}]\n=>`, getCallback())

      var validType = validTypes.some(function (t) { return t === type })

      if (validType) {
        p.version = semver.inc(p.version, type, 'alpha')
        if (p.version == null) exit('Invalid semver version in package.json!')
      } else {
        exit('You must choose one of of these: ' + validTypes.join(' | '))
      }

      var [message] = yield rl.question(`Insert the release message (press double enter to continue)\n=>`, getCallback())
      var input = message
      while (input !== '') {
        ;[input] = yield rl.question('..', getCallback())
        message = message + '\n' + input
      }

      // ask user if sHe really want's to publish
      var [answer] = yield rl.question(`Publishing version ${p.version}. Message: ${message}. Okay? [y|N]\n=>`, getCallback())
      if (['y', 'Y', 'yes'].every(function (a) { return a !== answer })) {
        exit('Interrupt publish')
      }

      // update package.json
      ;[err] = yield writeJsonFile(path.join(dir, 'package.json'), p, { indent: 2 })
      if (err != null) exit(err)

      var opts = { cwd: dir }

      // commit remaining changes (changes to package.json)
      ;[err, stdout, stderr] = yield exec(`git commit -am "Published v${p.version}\n\n${message}"`, opts, getCallback())
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

      var commitDistFiles = false

      // add dist files
      ;[err, stdout, stderr] = yield exec('git add ./dist/* -f', opts, getCallback())
      if (err) {
        console.log('❌ Failed to add ./dist/* to index')
      } else {
        commitDistFiles = true
        console.log('✓ Add ./dist/* to index')
      }

      // add module exports (i.e. ./ez-publish.*)
      ;[err, stdout, stderr] = yield exec(`git add ./${p.name}.* -f`, opts, getCallback())
      if (err) {
        console.log(`❌ Failed to add ./${p.name}.* to index`)
      } else {
        commitDistFiles = true
        console.log(`✓ Add ./${p.name}.* to index`)
      }

      if (commitDistFiles) {
        // commit dist files
        ;[err, stdout, stderr] = yield exec(`git commit -am "Publish v${p.version} -- added dist files"`, opts, getCallback())
        if (err) {
          exit(`Unable to commit dist files:\n\n${stdout}\n\n${stderr}`)
        } else {
          console.log('✓ Commit dist files')
        }
      }

      // tag releasefiles
      ;[err, stdout, stderr] = yield exec(`git tag v${p.version} -m "${message}"`, opts, getCallback())
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
        console.log('❌ Failed to publish to npm. Please call `npm publish` yourself')
      } else {
        console.log('✓ Publish to npm')
      }

      // check out master
      ;[err, stdout, stderr] = yield exec('git checkout master', opts, getCallback())
      if (err) {
        exit(`Unable to checkout branch 'master':\n\n${stdout}\n\n${stderr}`)
      } else {
        console.log('✓ Checkout master branch')
        process.exit(0)
      }
    })()
  })

program
  .command('*')
  .action(function (env) {
    program.help()
  })

program
  .parse(process.argv)
