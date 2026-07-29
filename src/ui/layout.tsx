import type { Child } from "hono/jsx";

import { product } from "../config/product";

type LayoutProps = {
  children: Child;
  description?: string;
  noIndex?: boolean;
  scripts?: string[];
  title?: string;
};

export function Layout({
  children,
  description = product.description,
  noIndex = false,
  scripts = [],
  title = product.name,
}: LayoutProps) {
  return (
    <html itemscope itemtype="https://schema.org/WebApplication" lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta content={description} name="description" />
        {noIndex ? <meta content="noindex,nofollow,noarchive" name="robots" /> : null}
        <meta content={product.name} itemProp="name" />
        <meta content={description} itemProp="description" />
        <meta content={product.url} itemProp="url" />
        <meta content={product.applicationCategory} itemProp="applicationCategory" />
        <meta content="Any" itemProp="operatingSystem" />
        <meta content="true" itemProp="isAccessibleForFree" />
        <meta content={description} property="og:description" />
        <meta content="/og.svg" property="og:image" />
        <meta content="ja_JP" property="og:locale" />
        <meta content={title} property="og:title" />
        <meta content="website" property="og:type" />
        <meta content={product.url} property="og:url" />
        <link href={product.url} rel="canonical" />
        <link href="/styles.css" rel="stylesheet" />
        <title>{title}</title>
        {scripts.map((script) => (
          <script defer src={script}></script>
        ))}
      </head>
      <body>
        <a class="skip-link" href="#main">
          本文へ移動
        </a>
        <header class="site-header">
          <a class="brand" href="/">
            <span aria-hidden="true">
              <i></i>
              <i></i>
              <i></i>
            </span>
            {product.name}
          </a>
          <nav aria-label="メイン">
            <a href="/#product">計測を始める</a>
            <a href="/privacy">データの扱い</a>
          </nav>
        </header>
        <main id="main">{children}</main>
        <footer>
          <span>{product.name} · yhay81</span>
          <nav aria-label="フッター">
            <a href="/privacy">プライバシー</a>
            <a href="/healthz">稼働状態</a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
