import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
    // Base JavaScript config
    js.configs.recommended,

    // TypeScript files
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                extraFileExtensions: ['.svelte']
            },
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },
        plugins: {
            '@typescript-eslint': ts
        },
        rules: {
            ...ts.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off'
        }
    },

    // Svelte files
    {
        files: ['**/*.svelte'],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: tsParser,
                project: './tsconfig.json',
                extraFileExtensions: ['.svelte']
            },
            globals: {
                ...globals.browser
            }
        },
        plugins: {
            svelte,
            '@typescript-eslint': ts
        },
        rules: {
            ...svelte.configs.recommended.rules,
            ...ts.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            'svelte/no-at-html-tags': 'warn',
            'svelte/valid-compile': 'error',
            'no-undef': 'off' // Svelte has its own scoping
        }
    },

    // Ignore patterns
    {
        ignores: [
            '**/.svelte-kit/**',
            '**/node_modules/**',
            '**/build/**',
            '**/.git/**',
            '**/dist/**',
            '**/*.config.js',
            '**/*.config.ts',
            'ios/**',
            'android/**'
        ]
    },

    // Prettier - disable conflicting rules
    prettier
];
