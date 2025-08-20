import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: false,
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
        'warn', // Warn instead of error to avoid build failures
        {
          semi: true,
          trailingComma: 'es5',
          singleQuote: true,
          printWidth: 120,
          tabWidth: 2,
          useTabs: false,
          bracketSpacing: true,
          arrowParens: 'avoid',
          endOfLine: 'auto',
        },
      ],
      
      // Relaxed whitespace and formatting rules
      'no-multiple-empty-lines': ['warn', { max: 3, maxEOF: 2, maxBOF: 1 }],
      'no-trailing-spaces': 'warn',
      'eol-last': 'warn',
      // Disable indent rule to avoid conflict with prettier
      'indent': 'off',
      'quotes': ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'semi': ['warn', 'always'],

      // ==========================================
      // TYPESCRIPT RULES (AI-Agent friendly but strict on quality)
      // ==========================================
      '@typescript-eslint/no-explicit-any': 'off', // Allow any for AI convenience
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      
      // Relaxed coding style for artistic project
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/member-ordering': 'off',

      // Variable and parameter rules (very relaxed)
      '@typescript-eslint/no-unused-vars': 'off',

      // No naming conventions - allow any style
      '@typescript-eslint/naming-convention': 'off',

      // ==========================================
      // BASIC PRACTICES (AI-Agent friendly)
      // ==========================================
      'no-console': 'off', // Allow console for debugging in artistic project
      'no-debugger': 'off',
      'no-alert': 'off',
      'no-eval': 'error',
      'no-var': 'error', // Force modern JS - important for AI agents
      'prefer-const': 'error', // Force const when possible - good practice
      'prefer-template': 'off',
      'no-param-reassign': 'off',
      'no-nested-ternary': 'off',
      'no-mixed-operators': 'off',
      'no-useless-escape': 'off',
      
      // Code quality rules important for AI-generated code
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'no-unused-expressions': 'warn',
      'no-useless-return': 'warn',
      'no-useless-concat': 'warn',
      'consistent-return': 'off',

      // ==========================================
      // COMPLEXITY CONTROL (Very Relaxed)
      // ==========================================
      'complexity': 'off',
      'max-depth': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-nested-callbacks': 'off',
      'max-params': 'off',
      'max-statements': 'off',

      // ==========================================
      // SECURITY & PERFORMANCE (AI-Agent focused)
      // ==========================================
      'no-await-in-loop': 'off',
      'require-atomic-updates': 'off',

      // AI-Agent specific rules - prevent common mistakes
      'no-implicit-globals': 'error',
      'no-lone-blocks': 'error',
      'no-empty': 'off',
      'no-empty-function': 'off',
      'no-new-wrappers': 'error',
      'radix': 'error', // Prevent parseInt() mistakes
      'prefer-arrow-callback': 'off',
      
      // TypeScript specific for AI agents
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off', // Too many false positives with strict:false
      '@typescript-eslint/prefer-includes': 'off',
      '@typescript-eslint/prefer-string-starts-ends-with': 'off',

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
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
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
