const shell = document.querySelector("[data-site-id]");
const siteId = shell?.dataset.siteId ?? "";
const key = location.hash.slice(1);
const loading = document.querySelector("[data-owner-loading]");
const dashboard = document.querySelector("[data-owner-dashboard]");
const errorPanel = document.querySelector("[data-owner-error]");
const snippet = `<script defer src="${location.origin}/beacon.js" data-site="${siteId}"></script>`;
const number = new Intl.NumberFormat("ja-JP");
const dateFormatter = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const sessionKey = "tegotae:session";

const getSessionId = () => {
  const stored = localStorage.getItem(sessionKey);
  if (stored) return stored;
  const created = crypto.randomUUID();
  localStorage.setItem(sessionKey, created);
  return created;
};

const automated =
  navigator.webdriver === true || new URLSearchParams(location.search).get("qa") === "1";

const track = (name) =>
  fetch("/api/events", {
    body: JSON.stringify({
      automated,
      name,
      sessionId: getSessionId(),
      siteId,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  }).catch(() => {});

const setText = (selector, value) => {
  const target = document.querySelector(selector);
  if (target) target.textContent = value;
};

const copy = async (value, button, idleText) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "");
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  button.textContent = "コピーしました";
  window.setTimeout(() => {
    button.textContent = idleText;
  }, 1800);
};

const renderList = (selector, rows) => {
  const list = document.querySelector(selector);
  if (!list) return;
  list.replaceChildren();
  if (rows.length === 0) {
    const item = document.createElement("li");
    item.className = "empty-row";
    item.textContent = "まだデータがありません";
    list.append(item);
    return;
  }
  for (const row of rows) {
    const item = document.createElement("li");
    const name = document.createElement("span");
    const count = document.createElement("strong");
    name.textContent = row.name;
    count.textContent = number.format(row.count);
    item.append(name, count);
    list.append(item);
  }
};

const renderChart = (daily) => {
  const recent = daily.slice(-7);
  const line = document.querySelector("[data-chart-line]");
  const pointsGroup = document.querySelector("[data-chart-points]");
  const labels = document.querySelector("[data-chart-days]");
  if (!line || !pointsGroup || !labels) return;
  const maximum = Math.max(1, ...recent.map((row) => row.count));
  const coordinates = recent.map((row, index) => {
    const x = 10 + index * 100;
    const y = 190 - (row.count / maximum) * 155;
    return { count: row.count, date: row.date, x, y };
  });
  line.setAttribute("points", coordinates.map(({ x, y }) => `${x},${y}`).join(" "));
  pointsGroup.replaceChildren();
  labels.replaceChildren();
  for (const point of coordinates) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    circle.setAttribute("cx", String(point.x));
    circle.setAttribute("cy", String(point.y));
    circle.setAttribute("r", "5");
    title.textContent = `${dateFormatter.format(new Date(`${point.date}T00:00:00+09:00`))}：${number.format(point.count)}ページビュー`;
    circle.append(title);
    pointsGroup.append(circle);
    const label = document.createElement("span");
    label.textContent = dateFormatter.format(new Date(`${point.date}T00:00:00+09:00`));
    labels.append(label);
  }
  if (recent.length > 0) {
    setText(
      "[data-chart-range]",
      `${dateFormatter.format(new Date(`${recent[0].date}T00:00:00+09:00`))} — ${dateFormatter.format(new Date(`${recent.at(-1).date}T00:00:00+09:00`))}`,
    );
  }
};

const showError = () => {
  loading.hidden = true;
  dashboard.hidden = true;
  errorPanel.hidden = false;
};

const load = async () => {
  if (!/^[0-9a-f]{32}$/.test(siteId) || !/^[0-9a-f]{64}$/.test(key)) {
    showError();
    return;
  }
  try {
    const response = await fetch(`/api/sites/${siteId}/dashboard`, {
      headers: { "x-site-key": key },
    });
    if (!response.ok) throw new Error("forbidden");
    const data = await response.json();
    setText("[data-site-name]", data.site.name);
    setText("[data-site-hostname]", data.site.hostname);
    setText("[data-today-views]", number.format(data.summary.todayViews));
    setText("[data-current-views]", number.format(data.summary.currentViews));

    const changeTarget = document.querySelector("[data-change]");
    if (changeTarget) {
      if (data.summary.previousViews === 0) {
        changeTarget.textContent =
          data.summary.currentViews === 0 ? "前週との比較" : "今週から計測";
      } else {
        const change = Math.round(
          ((data.summary.currentViews - data.summary.previousViews) / data.summary.previousViews) *
            100,
        );
        changeTarget.textContent = `前週より ${change >= 0 ? "+" : ""}${change}%`;
        changeTarget.classList.toggle("up", change > 0);
      }
    }

    setText(
      "[data-last-seen]",
      data.site.lastSeenAt
        ? timeFormatter.format(new Date(data.site.lastSeenAt * 1000))
        : "まだ未受信",
    );
    renderChart(data.chart.daily);
    renderList("[data-top-pages]", data.topPages);
    renderList("[data-top-referrers]", data.topReferrers);
    const snippetField = document.querySelector("[data-snippet]");
    if (snippetField) snippetField.value = snippet;
    loading.hidden = true;
    errorPanel.hidden = true;
    dashboard.hidden = false;
    void track("dashboard_opened");
  } catch {
    showError();
  }
};

document.querySelector("[data-refresh]")?.addEventListener("click", load);
document.querySelector("[data-copy-snippet]")?.addEventListener("click", (event) => {
  void copy(snippet, event.currentTarget, "コピー");
  void track("snippet_copied");
});
document.querySelector("[data-delete]")?.addEventListener("click", async () => {
  if (!confirm("サイト設定と365日分の集計を削除します。元に戻せません。")) return;
  const response = await fetch(`/api/sites/${siteId}`, {
    headers: { "x-site-key": key },
    method: "DELETE",
  });
  if (response.ok) location.replace(automated ? "/?qa=1" : "/");
});

void load();
