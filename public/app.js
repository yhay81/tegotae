const form = document.querySelector("[data-site-form]");
const result = document.querySelector("[data-setup-result]");
const message = document.querySelector("[data-form-message]");
const snippetField = document.querySelector("[data-snippet]");
const dashboardLink = document.querySelector("[data-dashboard-link]");
const copySnippetButton = document.querySelector("[data-copy-snippet]");
const copyDashboardButton = document.querySelector("[data-copy-dashboard]");
const sessionKey = "tegotae:session";

const getSessionId = () => {
  const stored = localStorage.getItem(sessionKey);
  if (stored) return stored;
  const created = crypto.randomUUID();
  localStorage.setItem(sessionKey, created);
  return created;
};

const sessionId = getSessionId();
const automated =
  navigator.webdriver === true || new URLSearchParams(location.search).get("qa") === "1";

const track = (name, siteId = "") =>
  fetch("/api/events", {
    body: JSON.stringify({ automated, name, sessionId, siteId }),
    headers: { "content-type": "application/json" },
    method: "POST",
  }).catch(() => {});

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

void track(localStorage.getItem("tegotae:seen") ? "returned" : "visited");
localStorage.setItem("tegotae:seen", "1");

let createdSiteId = "";
let createdDashboardUrl = "";

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  message.textContent = "計測タグを準備しています…";
  const data = new FormData(form);

  try {
    const response = await fetch("/api/sites", {
      body: JSON.stringify({
        automated,
        homepage: data.get("homepage"),
        name: data.get("name"),
        sessionId,
        website: data.get("website"),
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const body = await response.json();
    if (!response.ok) {
      if (response.status === 429) throw new Error("今日は3サイトまで作成できます。");
      throw new Error("サイト名とURLを確認してください。");
    }

    createdSiteId = body.id;
    const managementUrl = new URL(body.dashboardUrl, location.origin);
    if (automated) managementUrl.searchParams.set("qa", "1");
    createdDashboardUrl = managementUrl.href;
    snippetField.value = `<script defer src="${location.origin}/beacon.js" data-site="${body.id}"></script>`;
    dashboardLink.href = `${managementUrl.pathname}${managementUrl.search}${managementUrl.hash}`;
    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    message.textContent =
      error instanceof Error ? error.message : "いまは作成できません。少し待ってお試しください。";
    submit.disabled = false;
  }
});

copySnippetButton?.addEventListener("click", () => {
  if (!snippetField.value) return;
  void copy(snippetField.value, copySnippetButton, "タグをコピー");
  void track("snippet_copied", createdSiteId);
});

copyDashboardButton?.addEventListener("click", () => {
  if (!createdDashboardUrl) return;
  void copy(createdDashboardUrl, copyDashboardButton, "コピー");
  void track("dashboard_link_copied", createdSiteId);
});
