// Go streak widget for Scriptable (https://scriptable.app)
// Shows your current streaks from the private streak-data repo.
const REPO = "karanpathakkp/streak-data";
const TOKEN_KEY = "go-streak-token";

async function getToken() {
  if (Keychain.contains(TOKEN_KEY) && !(config.runsInApp && args.queryParameters && args.queryParameters.reset)) return Keychain.get(TOKEN_KEY);
  if (!config.runsInApp) return null;
  const a = new Alert(); a.title = "GitHub token"; a.message = "Paste the fine-grained token that can read " + REPO;
  a.addSecureTextField("github_pat_…"); a.addAction("Save"); a.addCancelAction("Cancel");
  if ((await a.present()) < 0) return null;
  const t = a.textFieldValue(0).trim(); if (t) Keychain.set(TOKEN_KEY, t); return t;
}

async function loadState(token) {
  const req = new Request(`https://api.github.com/repos/${REPO}/contents/streak.json`);
  req.headers = { Authorization: "Bearer " + token, Accept: "application/vnd.github+json" };
  const j = await req.loadJSON();
  if (!j.content) throw new Error(j.message || "No data");
  return JSON.parse(Data.fromBase64String(j.content.replace(/\n/g, "")).toRawString());
}

const pad = n => String(n).padStart(2, "0");
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function streak(days) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  let d = days[keyOf(t)] ? t : new Date(t.getTime() - 864e5), n = 0;
  while (days[keyOf(d)]) { n++; d = new Date(d.getTime() - 864e5); }
  return n;
}

function build(state, error) {
  const w = new ListWidget();
  const g = new LinearGradient(); g.colors = [new Color("#1A8F66"), new Color("#0F1E38")]; g.locations = [0, 1]; w.backgroundGradient = g;
  w.setPadding(14, 16, 14, 16);
  w.url = "https://karanpathakkp.github.io/streak/";
  const title = w.addText("Go"); title.font = Font.boldSystemFont(13); title.textColor = new Color("#C9D3E6");
  w.addSpacer(6);
  if (error) { const e = w.addText(error); e.font = Font.systemFont(12); e.textColor = Color.white(); return w; }
  const today = keyOf(new Date());
  const habits = state.habits || [];
  const small = config.widgetFamily === "small" || !config.widgetFamily && false;
  const list = small ? habits.slice(0, 1) : habits.slice(0, 4);
  for (const h of list) {
    const rec = h.days[today];
    const short = h.mode === "timer" && rec && (rec.mins || 0) < 60;
    const row = w.addStack(); row.centerAlignContent();
    const num = row.addText(String(streak(h.days))); num.font = Font.boldSystemFont(small ? 44 : 26); num.textColor = Color.white();
    row.addSpacer(6);
    const flame = row.addText(rec ? (short ? "🔵" : "🔥") : "⚪"); flame.font = Font.systemFont(small ? 22 : 16);
    row.addSpacer();
    const name = row.addText(h.name); name.font = Font.mediumSystemFont(small ? 13 : 15); name.textColor = new Color("#EEF2F7"); name.lineLimit = 1;
    if (!small) { const sub = w.addText(rec ? (rec.mins ? `done · ${rec.mins} min` : "done today") : "not yet today"); sub.font = Font.systemFont(11); sub.textColor = new Color("#9AA8C2"); }
    w.addSpacer(small ? 2 : 6);
  }
  if (!list.length) { const e = w.addText("No habits yet"); e.textColor = Color.white(); }
  w.refreshAfterDate = new Date(Date.now() + 20 * 60 * 1000);
  return w;
}

let widget;
try {
  const token = await getToken();
  if (!token) widget = build(null, "Open this script in Scriptable once to paste your GitHub token.");
  else widget = build(await loadState(token));
} catch (e) { widget = build(null, "Could not load: " + e.message); }
if (config.runsInWidget) Script.setWidget(widget); else await widget.presentMedium();
Script.complete();
