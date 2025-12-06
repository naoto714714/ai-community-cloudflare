import js from "@eslint/js";
import pluginImport from "eslint-plugin-import";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // 除外ファイル
  {
    ignores: ["dist/**", "node_modules/**", "*.min.js"],
  },

  // 基本設定
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 全体共通: import整理ルール
  {
    plugins: {
      import: pluginImport,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      // import文のソート
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },

  // React (client) 設定
  {
    files: ["client/**/*.{ts,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React: recommended ルールを展開
      ...pluginReact.configs.recommended.rules,

      // React 17+ の JSX transform では不要
      "react/react-in-jsx-scope": "off",

      // TypeScript で型チェックしているため不要
      "react/prop-types": "off",

      // 日本語コンテンツで引用符のエスケープ強制は過剰
      "react/no-unescaped-entities": "off",

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Server 設定
  {
    files: ["server/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Shared 設定
  {
    files: ["shared/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
);
