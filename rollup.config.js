import babel from 'rollup-plugin-babel'
import json from 'rollup-plugin-json'

const packageJson = require('./package.json')
const externalDependencies = Object.keys(packageJson.dependencies).concat([
  'fs', 'path', 'child_process'
])

export default {
  entry: 'src/ez-publish.js',
  format: 'cjs',
  dest: 'ez-publish.js',
  plugins: [
    json(),
    babel({
      exclude: 'node_modules/**'
    })
  ],
  sourceMap: 'inline',
  external: externalDependencies,
  banner: '#!/usr/bin/env node'
}
