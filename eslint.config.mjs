import eslint from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals'; // Thêm package này

const esLintConfig = [
  // Cấu hình cơ bản từ @eslint/js
  eslint.configs.recommended,

  // Cấu hình cho Next.js
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  // Cấu hình TypeScript
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'warn',
      quotes: ['error', 'single'],
      'jsx-quotes': ['error', 'prefer-single'],
    },
  },

  // Cấu hình Prettier
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          jsxSingleQuote: true,
          semi: true,
          tabWidth: 2,
          trailingComma: 'es5',
          printWidth: 100,
          endOfLine: 'auto',
        },
      ],
    },
  },

  // Cấu hình global variables thay cho env
  {
    languageOptions: {
      globals: {
        ...globals.browser, // Global variables của browser (bao gồm console)
        ...globals.node, // Global variables của Node.js
        // Có thể thêm các globals khác nếu cần
        NodeJS: 'readonly',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },

  // Cấu hình bỏ qua file
  {
    ignores: ['.next/', 'node_modules/', 'dist/', 'build/', '*.config.js', '*.config.mjs'],
  },
];

export default esLintConfig;
