import tseslint from 'typescript-eslint'
import nextPlugin from '@next/eslint-plugin-next'

export default tseslint.config(
  { ignores: ['.next/**', 'dist/**', 'node_modules/**'] },
  ...tseslint.configs.recommended,
  {
    plugins: nextPlugin.configs['core-web-vitals'].plugins,
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['commerce-demo', 'marketplace-demo', 'content-platform-demo', 'database-security-demo', 'landingpage-demo'], message: 'demo must not import sibling demo' },
            ],
        },
      ],
    },
  },
)
