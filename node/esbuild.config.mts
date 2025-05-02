import esbuild from 'esbuild'

const context = await esbuild.context({
  entryPoints: ['src/server/index.ts'],
  bundle: true,
  outfile: './server.js',
  platform: 'node',
  format: 'cjs',
  // target: ['node18'],
  sourcemap: 'inline',
  external: ['max-api', 'esbuild'],
  banner: {
    js: '"use strict";'
  }
})

// In watch mode
await context.watch()
