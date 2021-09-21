const sveltePreprocess = require('svelte-preprocess')
const nested = require('postcss-nested')

module.exports = {
  preprocess: sveltePreprocess({
    postcss: {
      plugins: [nested],
    },
  }),
}
