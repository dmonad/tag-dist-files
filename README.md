# tag-dist-files
> Tag distribution files without messing up your git history - sort of fixes bower - awesome for publishing js libraries

Publishing javascript libraries to bower can be very difficult. Bower expects that distribution files (babelified, uglified, webpackyfied, blubberyfied, ..) are present in the tagged commits. At least our users expect that. Having distribution files in the commit history sucks. This is why some projects (e.g. [quill](https://github.com/quilljs/quill/)) don't even publish distribution files in the tagged commits. This sucks for the user (not everyone wants to use 99 transpilation tools). Other projects (e.g. [ace](https://github.com/ajaxorg/ace-builds)) have a dedicated project for publishing distribution files. This sucks for the developer. I think this approach sucks less.

### What it does

We use a nifty trick to tag distribution files without messing up our commit history:

* `git checkout --detach` We [detach the head](https://git-scm.com/docs/git-checkout#_detached_head). This means we no longer track any branch
* `git add -f files` We force to add all distribution files specified in package.json's `files` attribute
* `git commit -am 'Publish vX.Y.Z -- with dist files'` Commit dist files. `vX.Y.Z` is given by package.json's version attribute
* `git tag vX.Y.Z` Tag release with dist files
* `git push origin vX.Y.Z` Push tag
* `git checkout master` Revert to tracking master branch (dist files are no longer tracked / in the git history)

### Checklist

This tool is for you if.. (all of the following must be true)

- [x] You have a `package.json`.
- [x] You understand [what it does](#what-it-does)
- [x] You work in a unix-ish environment (Linux | Mac (untested) | Windows with Cygwin (untested))

### Tutorial

```
$ npm i -g tag-dist-files
$ tag-dist-files
```

This tool works really well with `npm publish` (or even better: [np](https://github.com/sindresorhus/np)).

```
..
  "scripts": {
    ..
    "postversion": "npm run dist",
    "postpublish": "tag-dist-files --overwrite-existing-tag"
  }
```

Then you can just run `np`. The difference is that all files specified in package.json's `files` attribute are added to your tagged commit. Therefore, 'bower i your-package' installs distribution files too!
