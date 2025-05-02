import esbuild from 'esbuild'

const context = await esbuild.context({
  entryPoints: ['src/server/index.ts'],
  bundle: false,
  outfile: './server.js',
  platform: 'node',
  format: 'cjs',
  // target: ['node18'],
  sourcemap: 'inline',
  banner: {
    js: '"use strict";'
  },
  loader: {
    '.node': 'file'
  }
})

// In watch mode
await context.watch()
