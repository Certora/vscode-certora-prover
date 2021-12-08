import svelte from 'rollup-plugin-svelte'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import sveltePreprocess from 'svelte-preprocess'
import typescript from '@rollup/plugin-typescript'
import css from 'rollup-plugin-css-only'
import json from '@rollup/plugin-json'

const production = !process.env.ROLLUP_WATCH

function buildConfig({ input, jsOutput, tsconfig }) {
  return {
    input,
    output: {
      sourcemap: true,
      format: 'iife',
      name: 'app',
      file: jsOutput,
    },
    plugins: [
      svelte({
        preprocess: sveltePreprocess({
          sourceMap: !production,
          postcss: {
            plugins: [require('postcss-nested')],
          },
        }),
        compilerOptions: {
          dev: !production,
        },
        onwarn: (warning, handler) => {
          if (
            warning.code === 'a11y-missing-attribute' ||
            warning.code === 'a11y-missing-content'
          )
            return

          handler(warning)
        },
      }),
      css({ output: 'bundle.css' }),
      json(),
      resolve({
        browser: true,
        dedupe: ['svelte'],
      }),
      commonjs(),
      typescript({
        tsconfig,
        sourceMap: !production,
        inlineSources: !production,
      }),
      production && terser(),
    ],
    watch: {
      clearScreen: false,
    },
  }
}

const resultsConfig = buildConfig({
  input: 'src/results/main.ts',
  jsOutput: 'out/results/bundle.js',
  tsconfig: './src/results/tsconfig.json',
})
const settingsConfig = buildConfig({
  input: 'src/settings/main.ts',
  jsOutput: 'out/settings/bundle.js',
  tsconfig: './src/settings/tsconfig.json',
})

export default [resultsConfig, settingsConfig]
