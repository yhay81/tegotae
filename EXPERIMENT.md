# Experiment

## User and job

- Target user: GA4を開かなくなった個人ブログ、同人・趣味サイト、小規模店舗サイトの日本語運営者。
- Job to be done: タグを1行設置し、今日と7日間の閲覧数、読まれたページ、流入元をスマートフォンでも一画面で確認する。
- Current workaround: 忍者アクセス解析の広告や4か月保存を受け入れる、CloudflareやGA4の管理画面を開く、または計測しない。

## Hypothesis

広告、Cookie、訪問者追跡がなく、作成から設置確認まで5分以内なら、小規模サイト運営者は実サイトへタグを置き、週に複数回ダッシュボードを確認する。

## Method

- Recruitment channel: Tool Shelf、検索流入、自然な共有。個別勧誘や外部SNS投稿は行わない。
- Participants: 自動QAを除く匿名の作成者と、実際にタグを設置したサイト。
- Duration: 2026-07-30から30日間。
- Comparison: 訪問→設定作成→タグコピー→実データ受信→別日の受信・ダッシュボード確認。

## Decision

- Success signal: 30日以内に実作成者10人以上、実データ受信5サイト以上、うち3サイト以上で2日以上の受信、2人以上が忍者/GA4の代わりに継続利用すると直接確認できる。
- Failure signal: 実データ受信が2サイト未満、または複数日受信が0、または主な離脱理由が「Cloudflare Web Analyticsやアクセス解析研究所で十分」に集中する。
- Deadline: 2026-08-29。
- Maximum build time: 2日。
- Maximum monthly infrastructure cost: 5 USD。

## Guardrails

- IP、User-Agent、訪問者ID、個別の行動履歴を保存しない。
- Cookie、localStorage、端末指紋を設置先の訪問者へ使わない。
- 設置者が集計と設定を直ちに削除できる。
- 自動QA、開発者のスモーク、検索インデックス確認を実利用へ含めない。
- 成功条件を途中で都合よく変更しない。
