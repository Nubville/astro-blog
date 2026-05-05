import eslintPluginAstro from 'eslint-plugin-astro';
import pluginLit from 'eslint-plugin-lit';
import litA11y from 'eslint-plugin-lit-a11y';
import pluginWc from 'eslint-plugin-wc';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', '.astro/'] },

  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,

  {
    plugins: {
      wc: pluginWc,
      lit: pluginLit,
      'lit-a11y': litA11y,
    },
    rules: {
      ...pluginWc.configs['flat/recommended'].rules,
      ...pluginLit.configs.recommended.rules,
      ...litA11y.configs.recommended.rules,
    },
  }
);
