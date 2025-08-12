import { FlatCompat } from "@eslint/eslintrc"
import importPlugin from "eslint-plugin-import"
import jsxA11y from "eslint-plugin-jsx-a11y"
import noSecrets from "eslint-plugin-no-secrets"
import promise from "eslint-plugin-promise"
import react from "eslint-plugin-react"
import reactPerf from "eslint-plugin-react-perf"
import security from "eslint-plugin-security"
import sonarjs from 'eslint-plugin-sonarjs'
import tailwindcss from "eslint-plugin-tailwindcss";
import turbo from "eslint-plugin-turbo"
import unicorn from "eslint-plugin-unicorn"
import unusedImports from "eslint-plugin-unused-imports"


const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  {
    ignores: ['**/_*/**', "**/.next/**"],
  },
  {
    settings: {
      // Tailwind 4 doesn't have a config
      tailwindcss: {
        config: false, 
      },
      // Point to the correct tsconfig
      'import/resolver': {
        typescript: {
          project: ['**/tsconfig.json'], 
          noWarnOnMultipleProjects: true,
        },
      },
    },
  },
  ...compat.extends(
    "next/core-web-vitals", 
    "next/typescript",
    "plugin:react-hooks/recommended-legacy",
  ),
  {
    plugins: {
      "import": importPlugin,
      "jsx-a11y": jsxA11y,
      "no-secrets": noSecrets,
      promise,
      react,
      "react-perf": reactPerf,
      security,
      sonarjs,
      "tailwindcss": tailwindcss,
      turbo,
      unicorn,
      "unused-imports": unusedImports,
    },
    rules: {
      ...importPlugin.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "no-secrets/no-secrets": "error",
      ...unicorn.configs.recommended.rules,
      "unused-imports/no-unused-imports": "error",
      'unused-imports/no-unused-vars': "error",
      ...promise.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactPerf.configs.flat.recommended.rules,
      ...security.configs.recommended.rules,
      // eslint-disable-next-line import/no-named-as-default-member
      ...sonarjs.configs.recommended.rules,
      ...tailwindcss.configs.recommended.rules,
      ...turbo.configs.recommended.rules,
      "unicorn/filename-case": "off",
      "unicorn/prevent-abbreviations": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          "allowShortCircuit": true,
          "allowTernary": true,
          "allowTaggedTemplates": true
        }
      ],
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'function-declaration',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react/react-in-jsx-scope': 'off',
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',     // JS runtime built-ins (fs, path)
            'external',    // NPM packages
            'internal',    // Aliased paths (e.g. @/ or ~/)
            ['parent', 'sibling', 'index'], // Relative imports
            'object',      // Imports like `import * as foo from 'bar'`
            'type',        // Type imports
          ],
          pathGroups: [
            {
              pattern: '@hebo/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '~/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
        },
      ],
      // TODO: Remove these (turning them to errors), once fixed 
      'import/default': 'warn',
      'import/named': 'warn',
      'react-perf/jsx-no-new-function-as-prop': 'warn',
      'sonarjs/no-all-duplicated-branches': 'warn',
      'sonarjs/prefer-single-boolean-return': 'warn',
      'sonarjs/todo-tag': 'warn',
      'turbo/no-undeclared-env-vars': 'warn',
      'unicorn/catch-error-name': 'warn',
      'unicorn/no-null': 'warn',
      'unicorn/no-useless-undefined': 'warn',
      'unicorn/prefer-export-from': 'warn',
      'unicorn/prefer-global-this': 'warn',
      'unicorn/prefer-node-protocol': 'warn',
      'unicorn/prefer-number-properties': 'warn',
      "unicorn/no-document-cookie": "warn",
      "sonarjs/pseudo-random": "warn",
      "tailwindcss/no-custom-classname": "warn",
      "tailwindcss/no-contradicting-classname": "warn",
    },
  },
];

export default eslintConfig;
