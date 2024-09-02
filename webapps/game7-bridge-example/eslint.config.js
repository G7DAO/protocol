import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import { configs as tsConfigs } from '@typescript-eslint/eslint-plugin'
import { configs as tsParserConfigs } from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier' // Import Prettier config
import prettierPlugin from 'eslint-plugin-prettier' // Import Prettier plugin

export default {
  ignores: ['dist'],
  settings: { react: { version: '18.3' } },
  extends: [
    js.configs.recommended,
    tsConfigs.strictTypeChecked,
    tsConfigs.stylisticTypeChecked,
    'plugin:prettier/recommended' // Add Prettier to recommended plugins
  ],
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: process.cwd() // Changed from import.meta.dirname
    }
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
    react,
    prettier: prettierPlugin
  },
  rules: {
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
    ...reactHooks.configs.recommended.rules,
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'prettier/prettier': 'warn'
  }
}
