import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  {
    ignores: ['**/_*/**'],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          "allowShortCircuit": true,
          "allowTernary": true,
          "allowTaggedTemplates": true
        }
      ]
    }
  }
];

export default eslintConfig;
