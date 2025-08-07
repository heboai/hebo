import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  {
    ignores: ['**/_*/**', "**/.next/**"],
  },
  ...compat.extends(
    "next/core-web-vitals", 
    "next/typescript",
    "plugin:react/recommended"
  ),
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
    }
  }
];

export default eslintConfig;
