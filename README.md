# ez-publish
> Opinionated command line tool for publishing javascript libraries

![ez-publish](http://imgs.xkcd.com/comics/tools.png)

Publishing javascript libraries to bower can be very difficult. Bower expects that distribution files (babelified, uglified, webpackyfied, blubberyfied, ..) are present in the tagged commits. At least our users expect that. Having distribution files in the commit history sucks. This is why some projects (e.g. [quill](https://github.com/quilljs/quill/)) don't even publish distribution files in the tagged commits. This sucks for the user (not everyone wants to use 99 transpilation tools). Other projects (e.g. [ace](https://github.com/ajaxorg/ace-builds)) have a dedicated project for publishing distribution files. This sucks for the developer. I think this approach sucks less.

### What it does

We use a nifty trick to tag distribution files without fucking up our commit history:

* `git checkout --detach` We [detach the head](https://git-scm.com/docs/git-checkout#_detached_head). This means we no longer track any branch
* `git add -f ./dist project-name*` We force to add all distribution files
* `git commit -am 'Publish vX.Y.Z -- with dist files'` Commit dist files
* `git tag vX.Y.Z` Tag release with dist files
* `git push origin vX.Y.Z` Push tag
* `git checkout master` Revert to tracking master branch (dist files are no longer tracked / in the git history)

### What it also does

* Adds that release message to `./CHANGELOG.md`, and to the tag description
* OPTIONAL: You can work on `./.releaseMessage` before you publish using `ez-publish`

### Checklist

This tool is for you if.. (all of the following must be true)

- [x] You have a `package.json`.
- [x] All files you want to distribute are in `./dist` or match `./PROJECTNAME*`.Where `PROJECTNAME` is given by `require(package.json).name`
- [x] You understand [what it does](#what-it-does)
- [x] You work in a unix-ish environment (Linux | Mac (untested) | Windows with Cygwin (untested))

### Tutorial

```
$ npm i -g ez-publish
$ publish
```

It is a good idea to write a `prepublish` script in your `package.json` (overwrites default behavior of `npm publish`)
```
..
  "scripts": {
    ..
    "prepublish": "npm run dist && npm run lint",
    "postpublish": "publish"
  }
```

Then you can just run `npm publish`, and automatically create tags etc..
