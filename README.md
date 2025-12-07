# ai-community-cloudflare

Slack風のAIチャットアプリケーションをCloudflare上にデプロイしたプロジェクトです。

こちらのシステムはローカルでしか使えなかったので、cloudflare上にデプロイして使いやすいようにしたものです。
- 元リポジトリ: https://github.com/naoto714714/ai-community

## 概要

- **Slack風チャットUI**: チャンネル、ダイレクトメッセージ、ユーザー一覧などを備えたモダンなUI
- **AIアシスタント機能**: Google Gemini APIを利用したAIチャット機能
- **Cloudflareインフラ**: Cloudflare Pages + D1データベースによるサーバーレス構成

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | React 19, TypeScript, Vite 7 |
| スタイリング | TailwindCSS 4, shadcn/ui (Radix UI) |
| 状態管理 | Zustand |
| アニメーション | Framer Motion |
| バックエンド | Cloudflare Pages Functions |
| データベース | Cloudflare D1 (SQLite) |
| AI | Google Gemini API |
| パッケージ管理 | pnpm |

## ディレクトリ構成

```
ai-community-cloudflare/
├── client/                  # フロントエンド (React)
│   ├── index.html
│   ├── public/              # 静的ファイル
│   └── src/
│       ├── components/      # UIコンポーネント
│       │   ├── ui/          # shadcn/ui コンポーネント
│       │   ├── ChatLayout.tsx   # メインチャットレイアウト
│       │   ├── ChannelDialog.tsx
│       │   ├── UserListDialog.tsx
│       │   └── ...
│       ├── pages/           # ページコンポーネント
│       │   ├── Home.tsx
│       │   └── NotFound.tsx
│       ├── lib/             # ユーティリティ・ストア
│       │   ├── store.ts     # Zustand ストア
│       │   └── utils.ts
│       ├── hooks/           # カスタムフック
│       ├── contexts/        # React Context
│       ├── App.tsx          # アプリケーションルート
│       └── main.tsx         # エントリーポイント
│
├── server/                  # Expressサーバー (本番環境用)
│   └── index.ts
│
├── functions/               # Cloudflare Pages Functions (API)
│   ├── gemini.ts            # Gemini AI エンドポイント
│   └── messages.ts          # メッセージ CRUD エンドポイント
│
├── shared/                  # クライアント・サーバー共有コード
│   └── const.ts
│
├── migrations/              # D1 データベースマイグレーション
│   └── 0001_init_schema.sql
│
├── docs/                    # ドキュメント
│   └── ideas.md
│
├── wrangler.toml            # Cloudflare設定
├── vite.config.ts           # Vite設定
├── package.json
└── tsconfig.json
```

## セットアップ

### 前提条件

- Node.js >= 24.0.0
- pnpm >= 10.0.0

### 環境変数

`.dev.vars` ファイルを作成し、以下を設定:

```text
GEMINI_API_KEY="your-gemini-api-key"
```

### インストール & 起動

```bash
# 依存関係のインストール
pnpm install

# ローカルD1マイグレーションの適用
pnpm migrate:local

# 開発サーバーの起動
pnpm dev
```

### 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバーを起動 (Cloudflare Pages) |
| `pnpm build` | プロダクションビルド |
| `pnpm start` | 本番サーバーを起動 (Express) |
| `pnpm check` | TypeScript型チェック |
| `pnpm lint` | ESLintによるコードチェック |
| `pnpm lint:fix` | ESLintによる自動修正 |
| `pnpm format` | Prettierによるフォーマット |
| `pnpm migrate:local` | ローカルD1にマイグレーション適用 |
| `pnpm migrate:remote` | リモートD1にマイグレーション適用 |

## API エンドポイント

### `POST /gemini`
Gemini AIにプロンプトを送信し、回答を取得します。

**リクエストボディ:**
```json
{
  "user_prompt": "質問内容"
}
```

### `GET /messages`
全メッセージを取得します。

### `POST /messages`
新しいメッセージを作成します。

**リクエストボディ:**
```json
{
  "channel_id": "チャンネルID",
  "user_id": "ユーザーID",
  "content": "メッセージ内容"
}
```

## ライセンス

MIT
