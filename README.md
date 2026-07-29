# 手ごたえ

広告、Cookie、訪問者IDを置かず、ページビュー、読まれたページ、流入元を日本語の一画面で見る軽量アクセス解析です。

本番: <https://tegotae.yhay81.com>

## Product boundary

- 設置タグはページパスと参照元ホストだけを送ります。クエリ、ハッシュ、タイトル、入力内容は送りません。
- 受信時に日付・時間帯・ページ・流入元別の件数へ集計し、IP、User-Agent、個別の閲覧履歴を保存しません。
- 集計は365日保持し、管理リンクを持つ作成者がサイト設定ごと削除できます。
- 所有権はURL fragmentの64桁鍵で確認します。鍵の平文は保存せず、Better Authは導入しません。

## Local development

Node.js 24はfnmで管理し、Vite+によるランタイム管理は無効にします。

```powershell
vp env off
npm ci
npm run db:migrate:local
npm run dev
```

## Quality gate

```powershell
npm run release:check
npm run check
npm test
npm run build
npm audit --omit=dev
```

## Deployment

`tegotae` D1を作成して`wrangler.jsonc`へIDを設定し、migrationと品質ゲートを通します。正規URLは
`https://tegotae.yhay81.com`だけで、`workers.dev`とpreview URLは公開しません。

```powershell
npm run db:migrate:remote
npm run deploy
npm run indexnow
npm run metrics
```

デプロイ後は、実サイトと同じ別originからタグを読み込み、ページビュー受信、集計表示、管理鍵の拒否、削除を確認します。
本番データ、管理鍵、秘密値をGitへ保存しないでください。
