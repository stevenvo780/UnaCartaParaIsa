import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      prettier,
    },
    rules: {
      // ==========================================
      // PRETTIER INTEGRATION (AI-Agent strict formatting)
      // ==========================================
      'prettier/prettier': [
        'error', // Make formatting errors fail - important for AI agents
        {
          semi: true,
          trailingComma: 'es5',
          singleQuote: true,
          printWidth: 100,
          tabWidth: 2,
          useTabs: false,
          bracketSpacing: true,
          arrowParens: 'avoid',
          endOfLine: 'auto',
        },
      ],
      
      // Additional whitespace and formatting rules for AI agents
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 0 }],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      // Disable indent rule to avoid conflict with prettier
      'indent': 'off',
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],

      // ==========================================
      // TYPESCRIPT RULES (AI-Agent friendly but strict on quality)
      // ==========================================
      '@typescript-eslint/no-explicit-any': 'warn', // Discourage anys but don't fail build
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/require-await': 'off',
      
      // Relaxed coding style for artistic project
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/member-ordering': 'off',

      // Variable and parameter rules (relaxed)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // Relaxed naming conventions for creative project
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'default',
          format: ['camelCase', 'snake_case', 'PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'snake_case'],
        },
        {
          selector: 'parameter',
          format: ['camelCase', 'snake_case'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'property',
          format: ['camelCase', 'snake_case', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'objectLiteralProperty',
          format: null, // Allow any format for object properties
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE', 'PascalCase'],
        },
      ],

      // ==========================================
      // BASIC PRACTICES (AI-Agent friendly)
      // ==========================================
      'no-console': 'off', // Allow console for debugging in artistic project
      'no-debugger': 'warn',
      'no-alert': 'warn',
      'no-eval': 'error',
      'no-var': 'error', // Force modern JS - important for AI agents
      'prefer-const': 'error', // Force const when possible - good practice
      'prefer-template': 'warn',
      'no-param-reassign': 'off',
      'no-nested-ternary': 'warn',
      'no-mixed-operators': 'off',
      'no-useless-escape': 'warn',
      
      // Code quality rules important for AI-generated code
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'no-unused-expressions': 'error',
      'no-useless-return': 'error',
      'no-useless-concat': 'error',
      'consistent-return': 'warn',

      // ==========================================
      // COMPLEXITY CONTROL (Very Relaxed)
      // ==========================================
      'complexity': ['warn', 25],
      'max-depth': ['warn', 6],
      'max-lines': ['warn', 1000],
      'max-lines-per-function': ['warn', 200],
      'max-nested-callbacks': ['warn', 5],
      'max-params': ['warn', 8],
      'max-statements': ['warn', 50],

      // ==========================================
      // SECURITY & PERFORMANCE (AI-Agent focused)
      // ==========================================
      'no-await-in-loop': 'warn',
      'require-atomic-updates': 'off',

      // AI-Agent specific rules - prevent common mistakes
      'no-implicit-globals': 'error',
      'no-lone-blocks': 'error',
      'no-empty': 'warn',
      'no-empty-function': 'warn',
      'no-new-wrappers': 'error',
      'radix': 'error', // Prevent parseInt() mistakes
      'prefer-arrow-callback': 'warn',
      
      // TypeScript specific for AI agents
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'off', // Too many false positives with strict:false
      '@typescript-eslint/prefer-includes': 'warn',
      '@typescript-eslint/prefer-string-starts-ends-with': 'warn',

      // Keep these disabled but add safer alternatives
      'no-unused-vars': 'off', // Let TypeScript handle this
      'no-shadow': 'off',
      'no-undef': 'off', // TypeScript handles this
      'no-use-before-define': 'off',
      'no-redeclare': 'off',
      'no-dupe-class-members': 'off',
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
    },
  },

  // JavaScript and config files (very permissive)
  {
    files: ['**/*.{js,jsx,mjs,cjs}', '*.config.{js,mjs,ts}', 'vite.config.ts', 'eslint.config.mjs'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Scripts directory (permissive for utilities)
  {
    files: ['scripts/**/*.{ts,js}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn', // Still discourage any in scripts
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      'complexity': 'off',
      'no-await-in-loop': 'off', // Allow in utility scripts
      'prettier/prettier': 'warn', // Still enforce formatting but not critical
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.min.js',
      'coverage/**',
      '.vscode/**',
      '.git/**',
      '**/*.d.ts',
      'public/**',
      '.next/**',
      '.nuxt/**',
      '.output/**',
    ],
  },
);
