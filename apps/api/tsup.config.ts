import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/worker.ts'],
  format: ['esm', 'cjs'],
  noExternal: [/@conversation-platform\//],
  clean: true,
  sourcemap: false,
  minify: false,
  dts: false,
  splitting: false,
})
