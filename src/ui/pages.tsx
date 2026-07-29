import { product } from "../config/product";
import { Layout } from "./layout";

const previewDays = [42, 58, 47, 81, 74, 93, 128];

export function HomePage() {
  return (
    <Layout scripts={["/app.js"]}>
      <section class="meter-shell" id="product">
        <header class="meter-strip">
          <div class="signal-title">
            <span class="live-dot" aria-hidden="true"></span>
            <p>
              <strong>手ごたえ</strong>
              <span>軽量アクセス解析</span>
            </p>
          </div>
          <div class="zero-row" aria-label="計測タグの特徴">
            <span>
              <b>0</b> Cookie
            </span>
            <span>
              <b>0</b> 広告
            </span>
            <span>
              <b>0</b> 個人識別
            </span>
          </div>
        </header>

        <div class="meter-workspace">
          <section class="setup-card">
            <div class="setup-intro">
              <span class="step-mark">01</span>
              <div>
                <p class="eyebrow">CONNECT A SITE</p>
                <h1>サイトをつなぐ</h1>
              </div>
            </div>
            <form data-site-form>
              <label class="field">
                <span>表示名</span>
                <input
                  autocomplete="organization"
                  maxlength={50}
                  name="name"
                  placeholder="例：小さな本屋の日記"
                  required
                />
              </label>
              <label class="field">
                <span>サイトURL</span>
                <input
                  autocomplete="url"
                  inputmode="url"
                  name="homepage"
                  placeholder="https://example.com"
                  required
                  type="url"
                />
              </label>
              <label class="honeypot" aria-hidden="true">
                Website
                <input autocomplete="off" name="website" tabindex={-1} />
              </label>
              <div class="collect-grid" aria-label="集計する項目">
                <span>
                  <i class="view-icon" aria-hidden="true"></i>
                  閲覧数
                </span>
                <span>
                  <i class="page-icon" aria-hidden="true"></i>
                  ページ
                </span>
                <span>
                  <i class="route-icon" aria-hidden="true"></i>
                  流入元
                </span>
              </div>
              <p class="form-message" data-form-message role="status"></p>
              <button class="button primary" type="submit">
                <span>計測タグをつくる</span>
                <span aria-hidden="true">→</span>
              </button>
            </form>

            <section class="setup-result" data-setup-result hidden>
              <header>
                <span class="step-mark complete">02</span>
                <div>
                  <p class="eyebrow">PASTE ONE LINE</p>
                  <h2>この1行をサイトへ</h2>
                </div>
              </header>
              <label class="code-field">
                <span>bodyを閉じる直前に貼り付け</span>
                <textarea data-snippet readonly rows={4}></textarea>
              </label>
              <button class="button secondary" data-copy-snippet type="button">
                タグをコピー
              </button>
              <div class="management-ticket">
                <div>
                  <span class="key-shape" aria-hidden="true"></span>
                  <p>
                    <strong>管理リンク</strong>
                    <span>再発行できないため保管してください</span>
                  </p>
                </div>
                <button data-copy-dashboard type="button">
                  コピー
                </button>
              </div>
              <a class="button primary" data-dashboard-link href="#">
                ダッシュボードを開く
              </a>
            </section>
          </section>

          <section class="dashboard-mock" aria-label="アクセス解析ダッシュボードの表示見本">
            <header class="mock-header">
              <div>
                <span class="mock-favicon" aria-hidden="true">
                  本
                </span>
                <p>
                  <strong>小さな本屋の日記</strong>
                  <span>example.com</span>
                </p>
              </div>
              <span class="sample-label">表示見本</span>
            </header>
            <div class="summary-grid">
              <article class="today-card">
                <span>今日</span>
                <strong>128</strong>
                <small>ページビュー</small>
              </article>
              <article>
                <span>7日間</span>
                <strong>523</strong>
                <small class="up">前週より +18%</small>
              </article>
              <article class="pulse-card" aria-hidden="true">
                <span>いまの波</span>
                <div>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                </div>
              </article>
            </div>
            <section class="chart-card">
              <header>
                <div>
                  <p>7日間の閲覧</p>
                  <span>7/24 — 7/30</span>
                </div>
                <span class="chart-total">523 pv</span>
              </header>
              <svg aria-label="7日間の閲覧数が上向いている折れ線グラフ" viewBox="0 0 620 210">
                <defs>
                  <linearGradient id="preview-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#ff805a" stop-opacity=".28"></stop>
                    <stop offset="100%" stop-color="#ff805a" stop-opacity="0"></stop>
                  </linearGradient>
                </defs>
                <g class="grid-lines">
                  <line x1="10" x2="610" y1="40" y2="40"></line>
                  <line x1="10" x2="610" y1="100" y2="100"></line>
                  <line x1="10" x2="610" y1="160" y2="160"></line>
                </g>
                <path
                  d="M10 166 L110 141 L210 154 L310 99 L410 116 L510 74 L610 31 L610 195 L10 195 Z"
                  fill="url(#preview-fill)"
                ></path>
                <polyline
                  class="trend-line"
                  fill="none"
                  points="10,166 110,141 210,154 310,99 410,116 510,74 610,31"
                ></polyline>
                {previewDays.map((count, index) => (
                  <circle
                    class={index === previewDays.length - 1 ? "last-point" : ""}
                    cx={10 + index * 100}
                    cy={[166, 141, 154, 99, 116, 74, 31][index]}
                    r={index === previewDays.length - 1 ? 7 : 4}
                  >
                    <title>{count}ページビュー</title>
                  </circle>
                ))}
              </svg>
              <div class="chart-days" aria-hidden="true">
                <span>木</span>
                <span>金</span>
                <span>土</span>
                <span>日</span>
                <span>月</span>
                <span>火</span>
                <span>水</span>
              </div>
            </section>
            <div class="ranking-grid">
              <section>
                <header>
                  <h2>読まれたページ</h2>
                  <span>7日間</span>
                </header>
                <ol>
                  <li>
                    <span>/diary/summer-books</span>
                    <strong>186</strong>
                  </li>
                  <li>
                    <span>/</span>
                    <strong>142</strong>
                  </li>
                  <li>
                    <span>/about</span>
                    <strong>74</strong>
                  </li>
                </ol>
              </section>
              <section>
                <header>
                  <h2>見つけた場所</h2>
                  <span>7日間</span>
                </header>
                <ol>
                  <li>
                    <span>直接・不明</span>
                    <strong>218</strong>
                  </li>
                  <li>
                    <span>google.com</span>
                    <strong>171</strong>
                  </li>
                  <li>
                    <span>bsky.app</span>
                    <strong>82</strong>
                  </li>
                </ol>
              </section>
            </div>
          </section>
        </div>

        <section class="boundary-row" aria-label="計測範囲">
          <div>
            <span class="boundary-symbol aggregate" aria-hidden="true"></span>
            <p>
              <strong>最初から集計</strong>
              1件ずつの行動履歴を残さない
            </p>
          </div>
          <div>
            <span class="boundary-symbol cookie" aria-hidden="true"></span>
            <p>
              <strong>訪問者に状態を置かない</strong>
              Cookie・localStorage・指紋なし
            </p>
          </div>
          <div>
            <span class="boundary-symbol calendar" aria-hidden="true"></span>
            <p>
              <strong>365日を見渡す</strong>
              集計データは自分で削除できる
            </p>
          </div>
        </section>
      </section>
    </Layout>
  );
}

export function DashboardPage({ siteId }: { siteId: string }) {
  return (
    <Layout noIndex scripts={["/dashboard.js"]} title={`ダッシュボード | ${product.name}`}>
      <section class="owner-shell" data-site-id={siteId}>
        <div class="owner-loading" data-owner-loading>
          <div class="loading-pulse" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </div>
          <p>集計をひらいています。</p>
        </div>

        <div class="owner-dashboard" data-owner-dashboard hidden>
          <header class="owner-header">
            <div>
              <p class="eyebrow">SITE SIGNAL</p>
              <h1 data-site-name></h1>
              <p data-site-hostname></p>
            </div>
            <button class="button secondary" data-refresh type="button">
              更新する
            </button>
          </header>

          <section class="owner-summary" aria-label="閲覧数のまとめ">
            <article>
              <span>今日</span>
              <strong data-today-views>0</strong>
              <small>ページビュー</small>
            </article>
            <article>
              <span>7日間</span>
              <strong data-current-views>0</strong>
              <small data-change>前週との比較</small>
            </article>
            <article>
              <span>最後の受信</span>
              <strong class="received-state" data-last-seen>
                未受信
              </strong>
              <small>タグからの信号</small>
            </article>
          </section>

          <section class="owner-chart">
            <header>
              <div>
                <p class="eyebrow">LAST 7 DAYS</p>
                <h2>日ごとの閲覧</h2>
              </div>
              <span data-chart-range></span>
            </header>
            <svg aria-label="7日間の閲覧数" data-chart role="img" viewBox="0 0 620 210">
              <g class="grid-lines">
                <line x1="10" x2="610" y1="40" y2="40"></line>
                <line x1="10" x2="610" y1="100" y2="100"></line>
                <line x1="10" x2="610" y1="160" y2="160"></line>
              </g>
              <polyline class="trend-line" data-chart-line fill="none"></polyline>
              <g data-chart-points></g>
            </svg>
            <div class="owner-chart-days" data-chart-days></div>
          </section>

          <div class="owner-rankings">
            <section>
              <header>
                <div>
                  <p class="eyebrow">PAGES</p>
                  <h2>読まれたページ</h2>
                </div>
                <span>7日間</span>
              </header>
              <ol data-top-pages></ol>
            </section>
            <section>
              <header>
                <div>
                  <p class="eyebrow">REFERRERS</p>
                  <h2>見つけた場所</h2>
                </div>
                <span>7日間</span>
              </header>
              <ol data-top-referrers></ol>
            </section>
          </div>

          <section class="install-panel">
            <header>
              <div>
                <p class="eyebrow">MEASUREMENT TAG</p>
                <h2>計測タグ</h2>
                <p>SPAの画面遷移にも追従します。サイトURLのクエリや訪問者IDは送りません。</p>
              </div>
              <button class="button secondary" data-copy-snippet type="button">
                コピー
              </button>
            </header>
            <textarea data-snippet readonly rows={3}></textarea>
          </section>

          <section class="owner-settings">
            <div>
              <p class="eyebrow">DATA CONTROL</p>
              <h2>計測と集計を削除</h2>
              <p>
                タグを外すと新しい計測は止まります。削除すると、この管理リンクからも戻せません。
              </p>
            </div>
            <button class="danger-button" data-delete type="button">
              サイトと集計を削除
            </button>
          </section>
        </div>

        <section class="owner-error" data-owner-error hidden>
          <div class="broken-signal" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </div>
          <p class="eyebrow">MANAGEMENT LINK</p>
          <h1>管理リンクを確認できません。</h1>
          <p>URLの「#」より後ろまで含めて開いてください。管理キーは再発行できません。</p>
          <a class="button secondary" href="/">
            新しい計測をつくる
          </a>
        </section>
      </section>
    </Layout>
  );
}

export function PrivacyPage() {
  return (
    <Layout title={`プライバシー | ${product.name}`}>
      <article class="prose">
        <p class="eyebrow">DATA, NOT PEOPLE</p>
        <h1>人ではなく、サイトの反応を数えます。</h1>
        <section>
          <h2>計測タグが送るもの</h2>
          <p>
            設置サイトのページパスと、直前に閲覧していたサイトのホスト名だけを送ります。URLのクエリ、
            ハッシュ、ページタイトル、入力内容は送りません。Cookie、localStorage、広告ID、端末指紋は
            計測タグで使用しません。
          </p>
        </section>
        <section>
          <h2>個別のアクセスログを作りません</h2>
          <p>
            受信時に日付・時間帯・ページ・流入元ごとの件数へ加算し、1件ずつの閲覧履歴、IPアドレス、
            User-Agent、訪問者IDはデータベースへ保存しません。そのため、個人別の行動追跡や
            ユニーク訪問者数の表示はできません。
          </p>
        </section>
        <section>
          <h2>保持と削除</h2>
          <p>
            集計データは最大365日保持します。管理リンクを持つ作成者は、サイト設定と集計をいつでもまとめて
            削除できます。計測を一度も受信しない設定は35日後に削除します。
          </p>
        </section>
        <section>
          <h2>管理リンク</h2>
          <p>
            管理キーはURLの「#」より後ろに置くため、通常のHTTPリクエストやサーバーログには送られません。
            管理キーのハッシュだけを保存し、再発行はしません。リンクを知る人は集計の閲覧・削除ができるため、
            作成者だけで保管してください。
          </p>
        </section>
        <section>
          <h2>設置サイトでの案内</h2>
          <p>
            設置者は、自分のサイトのプライバシー案内や外部送信に関する表示へ、手ごたえの利用、送信項目、
            送信先、利用目的を必要に応じて記載してください。
          </p>
        </section>
        <section>
          <h2>手ごたえ本体の品質計測</h2>
          <p>
            作成・管理画面では、不正利用防止と利用状況の集計にブラウザ内のランダムな匿名IDを使います。
            設置先の訪問者へ配信する計測タグには、このIDや保存機能は含まれません。品質計測イベントは
            35日以内に削除します。
          </p>
        </section>
      </article>
    </Layout>
  );
}

export function NotFoundPage() {
  return (
    <Layout noIndex title={`ページが見つかりません | ${product.name}`}>
      <section class="not-found">
        <div class="broken-signal" aria-hidden="true">
          <i></i>
          <i></i>
          <i></i>
        </div>
        <p class="eyebrow">NO SIGNAL</p>
        <h1>ページが見つかりません。</h1>
        <p>URLが違うか、集計が削除された可能性があります。</p>
        <a class="button secondary" href="/">
          手ごたえへ戻る
        </a>
      </section>
    </Layout>
  );
}
