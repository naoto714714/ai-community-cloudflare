# AI Community Cloudflare

Slack風のAIチャットアプリケーションをCloudflare上にデプロイしたプロジェクトです。

こちらのシステムはローカルでしか使えなかったので、cloudflare上にデプロイして使いやすいようにしたものです。

- 元リポジトリ: https://github.com/naoto714714/ai-community

## 概要

- **Slack風チャットUI**: チャンネル、ダイレクトメッセージ、ユーザー一覧などを備えたモダンなUI
- **Cloudflareインフラ**: Cloudflare Pages + D1データベースによるサーバーレス構成

## ディレクトリ構成

```
ai-community-cloudflare/
├── client/                  # フロントエンド (React)
├── server/                  # Expressサーバー (本番環境用)
├── functions/               # Cloudflare Pages Functions (API)
├── shared/                  # クライアント・サーバー共有コード
├── migrations/              # マイグレーションファイル
└── docs/                    # Markdown形式のdocument
```

## セットアップ

### 環境変数

`.env` ファイルを作成し、以下を設定 (少なくともどちらか片方):

```text
# Gemini を使う場合
GEMINI_API_KEY="your-gemini-api-key"

# GPT を使う場合（存在すればこちらが優先されます）
GPT_API_KEY="your-openai-api-key"
```

### 主要なスクリプト

| コマンド                       | 説明                                         |
| ------------------------------ | -------------------------------------------- |
| `pnpm dev`                     | 開発サーバーを起動 (Cloudflare Pages)        |
| `pnpm build`                   | プロダクションビルド                         |
| `pnpm start`                   | 本番サーバーを起動 (Express)                 |
| `pnpm check`                   | TypeScript型チェック                         |
| `pnpm lint:fix`                | ESLintによる自動修正                         |
| `pnpm format`                  | Prettierによるフォーマット                   |
| `pnpm migrate:create hogehoge` | hogehogeというマイグレーションファイルを作成 |
| `pnpm migrate:local`           | ローカルD1にマイグレーション適用             |
| `pnpm migrate:remote`          | リモートD1にマイグレーション適用             |

## ユーザーの追加方法（Markdown管理）

1. `client/src/users/` に `003_newuser.md` のような連番ファイルを追加する。
2. 先頭に frontmatter を書く:
   ```md
   ---
   name: "newuser"
   personality: "Friendly bot"
   ---
   ```
   本文は任意で空でもOK。
3. 追加・変更後はフロントエンドを再ビルド／リロードすれば反映される（`import.meta.glob` で自動列挙されるため配列追記は不要）。
