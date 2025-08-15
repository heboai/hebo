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
    ignores: ['**/_*/**', '**/dist/**', '**/node_modules/**', "**/.next/**", "**/.react-router/**", "**/.turbo/**"],
  },
  {
    settings: {
      // Tailwind 4 doesn't have a config
      tailwindcss: {
        config: false, 
      },
      // Limit Next.js plugin root to the web app only to avoid monorepo noise
      next: {
        rootDir: ["apps/app/"],
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
      "no-secrets/no-secrets": ["error", { "tolerance": 4.1 }],
      ...unicorn.configs.recommended.rules,
      "unused-imports/no-unused-imports": "error",
      ...promise.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactPerf.configs.flat.recommended.rules,
      ...security.configs.recommended.rules,
      // eslint-disable-next-line import/no-named-as-default-member
      ...sonarjs.configs.recommended.rules,
      ...tailwindcss.configs.recommended.rules,
      // eslint-disable-next-line import/no-named-as-default-member
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
      'sonarjs/no-commented-code': 'off',
      'sonarjs/todo-tag': 'warn',
      'react-perf/jsx-no-new-object-as-prop': 'warn',
      'react-perf/jsx-no-new-function-as-prop': 'warn',
      'tailwindcss/no-custom-classname': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'turbo/no-undeclared-env-vars': 'warn',
      'unicorn/no-abusive-eslint-disable': 'warn'
    },
  },
];

export default eslintConfig;
