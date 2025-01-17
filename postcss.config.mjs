import cssnano from 'cssnano';
import openProps from 'open-props';
import postcssJitProps from 'postcss-jit-props';
import postcssCustomMedia from 'postcss-custom-media';
import postcssGlobalData from '@csstools/postcss-global-data';
import postcssNesting from 'postcss-nesting';
import postcssPresetEnv from 'postcss-preset-env';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    postcssGlobalData({
      files: [
        'node_modules/open-props/media.min.css'
      ]
    }),
    postcssCustomMedia(),
    postcssJitProps(openProps),
    postcssNesting(),
    postcssPresetEnv({stage: 0}),
    cssnano(),
    autoprefixer
  ]
}