module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    // React 相關規則
    'react/react-in-jsx-scope': 'off', // React 17+ 不需要
    'react/prop-types': 'warn', // 建議使用 PropTypes
    'react/jsx-no-target-blank': 'error',
    'react/jsx-key': 'error',
    'react/no-unused-state': 'warn',
    'react/no-direct-mutation-state': 'error',
    
    // React Hooks 規則
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // JavaScript 基礎規則
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'no-console': ['warn', { 
      allow: ['warn', 'error', 'info'] 
    }],
    'no-debugger': 'error',
    'no-alert': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'warn',
    'arrow-spacing': 'error',
    
    // 代碼質量規則
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'comma-dangle': ['error', 'always-multiline'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { 
      avoidEscape: true,
      allowTemplateLiterals: true 
    }],
    
    // 命名約定
    'camelcase': ['warn', { 
      properties: 'never',
      ignoreDestructuring: true 
    }],
    
    // 複雜度控制
    'complexity': ['warn', 10],
    'max-lines-per-function': ['warn', 100],
    'max-depth': ['warn', 4],
    
    // 性能相關
    'react/jsx-no-bind': ['warn', {
      allowArrowFunctions: true,
      allowBind: false,
      ignoreRefs: true,
    }],
  },
  overrides: [
    {
      files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*', '**/setupTests.js'],
      env: {
        jest: true,
        node: true,
      },
      globals: {
        global: 'readonly',
        process: 'readonly',
      },
      rules: {
        'no-console': 'off', // 測試中允許 console
      },
    },
  ],
};