/* Summit Updates — prototype
 * Plain JS, data persisted in localStorage.
 */
(function () {
  "use strict";

  // v2: adds reminders + employee joinedAt. Older saved data is replaced by the new seed.
  const STORAGE_KEY = "summit-updates:data:v2";
  const SESSION_KEY = "summit-updates:session:v1";

  // Stores below this confirmation rate are highlighted for the Ops Manager.
  const TARGET_RATE = 0.8;

  /* ---------------- Seed data ---------------- */

  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  function buildSeed() {
    const now = Date.now();

    const stores = [
      { id: "s1", number: 1, name: "Downtown" },
      { id: "s2", number: 2, name: "Westfield Mall" },
      { id: "s3", number: 3, name: "Riverside" },
      { id: "s4", number: 4, name: "Northgate" },
      { id: "s5", number: 5, name: "Lakeview" },
    ];

    const users = [
      { id: "u-michael", name: "Michael Torres", role: "ops", storeId: null },

      { id: "u-rachel", name: "Rachel Adams", role: "store_manager", storeId: "s1" },
      { id: "u-daniel", name: "Daniel Kim", role: "store_manager", storeId: "s2" },
      { id: "u-priya", name: "Priya Shah", role: "store_manager", storeId: "s3" },
      { id: "u-marcus", name: "Marcus Bell", role: "store_manager", storeId: "s4" },
      { id: "u-elena", name: "Elena Ruiz", role: "store_manager", storeId: "s5" },

      { id: "u-alex", name: "Alex Chen", role: "employee", storeId: "s1" },
      { id: "u-jordan", name: "Jordan Lee", role: "employee", storeId: "s1" },
      { id: "u-sam", name: "Sam Patel", role: "employee", storeId: "s1" },
      // New hire: joined after the refund-policy announcement, but still has to confirm it.
      { id: "u-taylor", name: "Taylor Brooks", role: "employee", storeId: "s1", joinedAt: now - 1 * DAY },

      { id: "u-maria", name: "Maria Gonzalez", role: "employee", storeId: "s2" },
      { id: "u-chris", name: "Chris Walker", role: "employee", storeId: "s2" },
      { id: "u-aisha", name: "Aisha Mohammed", role: "employee", storeId: "s2" },

      { id: "u-ben", name: "Ben Carter", role: "employee", storeId: "s3" },
      { id: "u-olivia", name: "Olivia Nguyen", role: "employee", storeId: "s3" },
      { id: "u-luis", name: "Luis Herrera", role: "employee", storeId: "s3" },
      { id: "u-hannah", name: "Hannah Scott", role: "employee", storeId: "s3" },

      { id: "u-jamal", name: "Jamal Wright", role: "employee", storeId: "s4" },
      { id: "u-emily", name: "Emily Turner", role: "employee", storeId: "s4" },
      { id: "u-noah", name: "Noah Fischer", role: "employee", storeId: "s4" },

      { id: "u-grace", name: "Grace Liu", role: "employee", storeId: "s5" },
      { id: "u-kevin", name: "Kevin O'Brien", role: "employee", storeId: "s5" },
      { id: "u-sofia", name: "Sofia Rossi", role: "employee", storeId: "s5" },
      { id: "u-tyler", name: "Tyler Reed", role: "employee", storeId: "s5" },
    ];

    const ALL = stores.map((s) => s.id);

    const announcements = [
      {
        id: "a1",
        title: "New refund policy starts Monday",
        body:
          "Starting Monday, refunds over $100 need a manager override at the register. " +
          "Receipts are still required for all refunds. Ask your store manager if you're unsure how the override works.",
        storeIds: ALL,
        required: true,
        authorId: "u-michael",
        createdAt: now - 2 * DAY,
      },
      {
        id: "a2",
        title: "Fire inspection Thursday — keep the back hallway clear",
        body:
          "The fire marshal visits Thursday morning. Nothing can be stored in the back hallway or in front of the emergency exits. " +
          "Please move any boxes to the stockroom before end of shift Wednesday.",
        storeIds: ["s1"],
        required: true,
        authorId: "u-rachel",
        createdAt: now - 5 * HOUR,
      },
      {
        id: "a3",
        title: "Holiday shift requests due Nov 15",
        body: "Submit your availability for Thanksgiving week and December weekends by Nov 15. Requests are first-come, first-served.",
        storeIds: ALL,
        required: false,
        authorId: "u-michael",
        createdAt: now - 1 * DAY - 3 * HOUR,
      },
      {
        id: "a4",
        title: "Great weekend, team!",
        body: "Saturday was our best day since August. Thank you all for staying on top of the fitting rooms and the line. Pizza in the break room Friday.",
        storeIds: ["s1"],
        required: false,
        authorId: "u-rachel",
        createdAt: now - 3 * DAY,
      },
      {
        id: "a5",
        title: "Winter displays arrive Tuesday",
        body: "Truck is scheduled for 7am Tuesday. Openers, plan to help unload and set up the front tables before doors open.",
        storeIds: ["s2", "s3"],
        required: false,
        authorId: "u-michael",
        createdAt: now - 20 * HOUR,
      },
      {
        id: "a6",
        title: "Updated closing checklist",
        body: "The closing checklist now includes locking the side receiving door and logging the safe count in the binder. Please follow it starting tonight.",
        storeIds: ["s4", "s5"],
        required: true,
        authorId: "u-michael",
        createdAt: now - 1 * DAY,
      },
    ];

    // confirmations[announcementId][userId] = timestamp
    // a1 by store: S1 2/4 (50%), S2 3/3 (100%), S3 4/4 (100%), S4 1/3 (33%), S5 2/4 (50%)
    const confirmations = {
      a1: {
        "u-jordan": now - 2 * DAY + 2 * HOUR,
        "u-sam": now - 1 * DAY,
        "u-maria": now - 2 * DAY + 4 * HOUR,
        "u-chris": now - 1 * DAY - 6 * HOUR,
        "u-aisha": now - 1 * DAY - 2 * HOUR,
        "u-ben": now - 2 * DAY + 1 * HOUR,
        "u-olivia": now - 2 * DAY + 3 * HOUR,
        "u-luis": now - 1 * DAY - 4 * HOUR,
        "u-hannah": now - 1 * DAY,
        "u-jamal": now - 1 * DAY - 2 * HOUR,
        "u-grace": now - 2 * DAY + 5 * HOUR,
        "u-sofia": now - 1 * DAY - 1 * HOUR,
      },
      a2: {
        "u-jordan": now - 3 * HOUR,
      },
      a6: {
        "u-emily": now - 18 * HOUR,
        "u-noah": now - 15 * HOUR,
        "u-grace": now - 20 * HOUR,
        "u-kevin": now - 10 * HOUR,
      },
    };

    // reminders[announcementId][userId] = timestamp of last (demo) reminder
    const reminders = {
      a1: { "u-alex": now - 1 * DAY + 2 * HOUR },
    };

    return { stores, users, announcements, confirmations, reminders };
  }

  /* ---------------- Storage ---------------- */

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        d.confirmations = d.confirmations || {};
        d.reminders = d.reminders || {};
        return d;
      }
    } catch (e) {
      /* fall through to seed */
    }
    const seed = buildSeed();
    saveData(seed);
    return seed;
  }

  function saveData(d) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  }

  function loadSession() {
    const fallback = { role: "ops", employeeId: "u-alex", managerTab: "post" };
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) return Object.assign(fallback, JSON.parse(raw));
    } catch (e) {}
    return fallback;
  }

  function saveSession() {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {}
  }

  let data = loadData();
  let session = loadSession();

  // In-memory UI state (not persisted): which Ops store rows are expanded, keyed "annId:storeId".
  const openStores = new Set();

  /* ---------------- Helpers ---------------- */

  const $ = (sel, root = document) => root.querySelector(sel);

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const userById = (id) => data.users.find((u) => u.id === id);
  const storeById = (id) => data.stores.find((s) => s.id === id);
  const storeLabel = (s) => `Store ${s.number} · ${s.name}`;
  const firstName = (u) => u.name.split(" ")[0];
  const sortedStores = () => data.stores.slice().sort((a, b) => a.number - b.number);
  const byName = (a, b) => a.name.localeCompare(b.name);

  function audienceLabel(storeIds) {
    if (storeIds.length === data.stores.length) return "All stores";
    return storeIds
      .map((id) => storeById(id))
      .filter(Boolean)
      .sort((a, b) => a.number - b.number)
      .map((s) => `Store ${s.number}`)
      .join(", ");
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const min = Math.round(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min} min ago`;
    const hrs = Math.round(min / 60);
    if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
    const days = Math.round(hrs / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function formatDateTime(ts) {
    const d = new Date(ts);
    const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const today = new Date();
    const yesterday = new Date(Date.now() - DAY);
    if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
    return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${time}`;
  }

  function confirmedAt(annId, userId) {
    return (data.confirmations[annId] && data.confirmations[annId][userId]) || null;
  }

  function remindedAt(annId, userId) {
    return (data.reminders[annId] && data.reminders[annId][userId]) || null;
  }

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  /* Who is the current viewer? */
  function currentUser() {
    if (session.role === "ops") return userById("u-michael");
    if (session.role === "store") return userById("u-rachel");
    return userById(session.employeeId) || userById("u-alex");
  }

  /* ---------------- Confirmation stats ----------------
   * Y (the denominator) is everyone *currently* employed at the store, regardless of when
   * they joined. Required updates (e.g. safety rules) apply to new hires too.
   */

  function employeesAt(storeId) {
    return data.users.filter((u) => u.role === "employee" && u.storeId === storeId);
  }

  function statsFor(ann, storeIds) {
    const people = storeIds.flatMap(employeesAt);
    const confirmed = people
      .filter((u) => confirmedAt(ann.id, u.id))
      .sort((a, b) => confirmedAt(ann.id, b.id) - confirmedAt(ann.id, a.id));
    const pending = people.filter((u) => !confirmedAt(ann.id, u.id)).sort(byName);
    const total = people.length;
    const rate = total ? confirmed.length / total : 1;
    return { total, confirmed, pending, rate };
  }

  /* Store IDs of an announcement that this manager is allowed to track. */
  function trackedStoreIds(ann, user) {
    if (user.role === "ops") return ann.storeIds.slice();
    return ann.storeIds.filter((id) => id === user.storeId);
  }

  function requiredForManager(user) {
    return data.announcements
      .filter((a) => a.required && trackedStoreIds(a, user).length)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  const pct = (rate) => `${Math.round(rate * 100)}%`;

  function rateClass(rate) {
    if (rate >= 1) return "is-done";
    if (rate < TARGET_RATE) return "is-low";
    return "";
  }

  function progressBar(rate, extraClass = "") {
    return `<div class="progress ${rateClass(rate)} ${extraClass}" role="progressbar"
      aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(rate * 100)}">
      <span style="width:${(rate * 100).toFixed(1)}%"></span></div>`;
  }

  /* ---------------- Role switcher ---------------- */

  const roleSelect = $("#role-select");
  const employeeSelect = $("#employee-select");

  function renderEmployeeOptions() {
    employeeSelect.innerHTML = sortedStores()
      .map((s) => {
        const opts = employeesAt(s.id)
          .map((u) => `<option value="${esc(u.id)}">${esc(u.name)}</option>`)
          .join("");
        return `<optgroup label="${esc(storeLabel(s))}">${opts}</optgroup>`;
      })
      .join("");
  }

  function syncSwitcher() {
    roleSelect.value = session.role;
    employeeSelect.hidden = session.role !== "employee";
    employeeSelect.value = session.employeeId;
  }

  roleSelect.addEventListener("change", () => {
    session.role = roleSelect.value;
    saveSession();
    syncSwitcher();
    render({ scrollTop: true });
  });

  employeeSelect.addEventListener("change", () => {
    session.employeeId = employeeSelect.value;
    saveSession();
    render({ scrollTop: true });
  });

  $("#reset-btn").addEventListener("click", () => {
    if (!confirm("Reset all announcements, confirmations and reminders to the original demo data?")) return;
    data = buildSeed();
    saveData(data);
    openStores.clear();
    renderEmployeeOptions();
    syncSwitcher();
    render({ scrollTop: true });
    toast("Demo data reset");
  });

  /* ---------------- Manager view ---------------- */

  function renderManager(user) {
    const isOps = user.role === "ops";
    const myStore = isOps ? null : storeById(user.storeId);
    const tab = session.managerTab === "tracking" ? "tracking" : "post";

    const openCount = requiredForManager(user).filter(
      (a) => statsFor(a, trackedStoreIds(a, user)).rate < 1
    ).length;

    return `
      <div class="page-head">
        <h1>Announcements</h1>
        <p>${esc(firstName(user))} · ${isOps ? "Operations Manager · All stores" : `Store Manager · ${esc(storeLabel(myStore))}`}</p>
      </div>
      <nav class="tabs" role="tablist">
        <button type="button" role="tab" class="tab" data-action="tab" data-tab="post"
          aria-selected="${tab === "post"}">Post</button>
        <button type="button" role="tab" class="tab" data-action="tab" data-tab="tracking"
          aria-selected="${tab === "tracking"}">Confirmations${
            openCount ? ` <span class="tab-count">${openCount}</span>` : ""
          }</button>
      </nav>
      ${tab === "post" ? renderPostTab(user) : renderTrackingTab(user)}`;
  }

  function renderPostTab(user) {
    const isOps = user.role === "ops";
    const myStore = isOps ? null : storeById(user.storeId);

    let storePicker;
    if (isOps) {
      storePicker = `
        <div class="store-picks" id="store-picks">
          <label class="chip all"><input type="checkbox" id="pick-all"> All stores</label>
          ${sortedStores()
            .map(
              (s) => `<label class="chip"><input type="checkbox" name="store" value="${esc(s.id)}"> ${esc(storeLabel(s))}</label>`
            )
            .join("")}
        </div>`;
    } else {
      storePicker = `
        <div class="store-picks">
          <label class="chip"><input type="checkbox" name="store" value="${esc(myStore.id)}" checked disabled> ${esc(storeLabel(myStore))}</label>
        </div>
        <div class="hint">Store managers can post to their own store only.</div>`;
    }

    const visible = data.announcements
      .filter((a) => isOps || a.storeIds.includes(user.storeId))
      .sort((a, b) => b.createdAt - a.createdAt);

    const postedHtml = visible.length
      ? `<ul class="posted-list">${visible
          .map((a) => {
            const author = userById(a.authorId);
            let progress = "";
            if (a.required) {
              const s = statsFor(a, trackedStoreIds(a, user));
              progress = ` · <button type="button" class="link-btn" data-action="tab" data-tab="tracking">${s.confirmed.length} of ${s.total} confirmed</button>`;
            }
            return `<li>
              <div class="posted-title">${esc(a.title)}${a.required ? '<span class="badge badge-required">Required</span>' : ""}</div>
              <div class="meta">${esc(audienceLabel(a.storeIds))} · ${esc(author ? firstName(author) : "Unknown")} · ${esc(timeAgo(a.createdAt))}${progress}</div>
            </li>`;
          })
          .join("")}</ul>`
      : `<p class="empty">No announcements yet.</p>`;

    return `
      <div class="manager-grid">
        <section class="card">
          <h2>New announcement</h2>
          <form id="post-form" novalidate>
            <div class="field">
              <label for="f-title">Title</label>
              <input type="text" id="f-title" maxlength="120" placeholder="e.g. Store opens late Sunday" autocomplete="off">
            </div>
            <div class="field">
              <label for="f-body">Message</label>
              <textarea id="f-body" maxlength="2000" placeholder="Keep it short — staff will read this on their phone."></textarea>
            </div>
            <div class="field">
              <span class="label">Send to</span>
              ${storePicker}
            </div>
            <div class="field">
              <label class="toggle-row" for="f-required">
                <span class="switch">
                  <input type="checkbox" id="f-required">
                  <span class="track"></span>
                </span>
                <span>
                  <strong>Required — employees must confirm</strong>
                  <span>Pinned to the top of their feed with a "Got it" button until they confirm.</span>
                </span>
              </label>
            </div>
            <p class="form-error" id="form-error" hidden></p>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Post announcement</button>
            </div>
          </form>
        </section>
        <section class="card">
          <h2>${isOps ? "Recent announcements" : "Recent announcements at your store"}</h2>
          ${postedHtml}
        </section>
      </div>`;
  }

  /* ----- Tracking tab ----- */

  function renderTrackingTab(user) {
    const anns = requiredForManager(user);
    if (!anns.length) {
      return `<div class="card"><p class="empty">No required announcements yet. Turn on "Required" when posting to track who has confirmed.</p></div>`;
    }
    return `<div class="tracking-list">${anns.map((a) => trackingCard(a, user)).join("")}</div>`;
  }

  function trackingCard(ann, user) {
    const isOps = user.role === "ops";
    const storeIds = trackedStoreIds(ann, user);
    const s = statsFor(ann, storeIds);
    const author = userById(ann.authorId);

    const body = isOps ? storeBreakdown(ann, storeIds) : peopleLists(ann, s);

    return `
      <section class="card track-card">
        <div class="track-head">
          <div>
            <h2>${esc(ann.title)}</h2>
            <div class="meta">${esc(audienceLabel(ann.storeIds))} · Posted by ${esc(author ? firstName(author) : "Unknown")} · ${esc(formatDateTime(ann.createdAt))}</div>
          </div>
          <div class="track-summary ${rateClass(s.rate)}">
            <strong>${s.confirmed.length} of ${s.total}</strong> confirmed
          </div>
        </div>
        ${progressBar(s.rate)}
        ${body}
      </section>`;
  }

  function storeBreakdown(ann, storeIds) {
    const rows = storeIds
      .map(storeById)
      .filter(Boolean)
      .sort((a, b) => a.number - b.number)
      .map((store) => {
        const s = statsFor(ann, [store.id]);
        const key = `${ann.id}:${store.id}`;
        const open = openStores.has(key);
        const low = s.total > 0 && s.rate < TARGET_RATE;
        return `
          <li class="store-item${low ? " is-low" : ""}">
            <button type="button" class="store-row" data-action="toggle-store" data-key="${esc(key)}"
              aria-expanded="${open}">
              <span class="store-name">${esc(storeLabel(store))}</span>
              <span class="store-bar">${s.total ? progressBar(s.rate, "progress-sm") : ""}</span>
              <span class="store-count">${s.confirmed.length}/${s.total}</span>
              <span class="store-pct">${s.total ? pct(s.rate) : "—"}</span>
              <span class="chev" aria-hidden="true"></span>
            </button>
            ${open ? `<div class="store-people">${peopleLists(ann, s)}</div>` : ""}
          </li>`;
      })
      .join("");

    return `
      <div class="breakdown-label">By store <span class="hint-inline">· under ${pct(TARGET_RATE)} highlighted · tap a store to see people</span></div>
      <ul class="store-list">${rows}</ul>`;
  }

  function peopleLists(ann, s) {
    if (!s.total) return `<p class="empty">No employees at this store.</p>`;

    const pendingHtml = s.pending.length
      ? s.pending
          .map((u) => {
            const reminded = remindedAt(ann.id, u.id);
            const isNew = u.joinedAt && u.joinedAt > ann.createdAt;
            return `
              <li class="person">
                <div class="person-main">
                  <span class="person-name">${esc(u.name)}</span>
                  ${isNew ? '<span class="tag">Joined after this was posted</span>' : ""}
                  ${reminded ? `<div class="person-sub reminded">Reminder sent · ${esc(formatDateTime(reminded))}</div>` : ""}
                </div>
                <button type="button" class="btn-remind" data-action="remind"
                  data-ann="${esc(ann.id)}" data-user="${esc(u.id)}">${reminded ? "Remind again" : "Remind"}</button>
              </li>`;
          })
          .join("")
      : `<li class="person empty">Everyone has confirmed. 🎉</li>`;

    const confirmedHtml = s.confirmed.length
      ? s.confirmed
          .map(
            (u) => `
              <li class="person">
                <div class="person-main">
                  <span class="person-name">${esc(u.name)}</span>
                </div>
                <span class="person-time">✓ ${esc(formatDateTime(confirmedAt(ann.id, u.id)))}</span>
              </li>`
          )
          .join("")
      : `<li class="person empty">No one yet.</li>`;

    return `
      <div class="people-cols">
        <div>
          <div class="people-label pending">Not confirmed (${s.pending.length})</div>
          <ul class="people">${pendingHtml}</ul>
        </div>
        <div>
          <div class="people-label done">Confirmed (${s.confirmed.length})</div>
          <ul class="people">${confirmedHtml}</ul>
        </div>
      </div>`;
  }

  function bindManagerForm(user) {
    const form = $("#post-form");
    if (!form) return;
    const isOps = user.role === "ops";
    const errorEl = $("#form-error");

    if (isOps) {
      const allBox = $("#pick-all");
      const storeBoxes = [...form.querySelectorAll('input[name="store"]')];
      allBox.addEventListener("change", () => {
        storeBoxes.forEach((b) => (b.checked = allBox.checked));
      });
      storeBoxes.forEach((b) =>
        b.addEventListener("change", () => {
          allBox.checked = storeBoxes.every((x) => x.checked);
        })
      );
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = $("#f-title").value.trim();
      const body = $("#f-body").value.trim();
      const required = $("#f-required").checked;

      // Never trust the form for store scope: enforce by role.
      const storeIds = isOps
        ? [...form.querySelectorAll('input[name="store"]:checked')].map((b) => b.value)
        : [user.storeId];

      const problems = [];
      if (!title) problems.push("a title");
      if (!body) problems.push("a message");
      if (!storeIds.length) problems.push("at least one store");
      if (problems.length) {
        errorEl.textContent = `Please add ${problems.join(", ")}.`;
        errorEl.hidden = false;
        return;
      }

      data.announcements.push({
        id: "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title,
        body,
        storeIds,
        required,
        authorId: user.id,
        createdAt: Date.now(),
      });
      saveData(data);
      render();
      toast(`Posted to ${audienceLabel(storeIds)}${required ? " · confirmation required" : ""}`);
    });
  }

  /* ---------------- Employee view ---------------- */

  function postCard(a, { pinned, confirmedTs }) {
    const author = userById(a.authorId);
    const authorLine = author
      ? `${firstName(author)} · ${author.role === "ops" ? "Operations" : "Store Manager"}`
      : "Management";
    return `
      <article class="post${pinned ? " pinned" : ""}">
        <h3>${esc(a.title)}${confirmedTs ? '<span class="badge badge-ok">✓ Confirmed</span>' : ""}</h3>
        <div class="meta">${esc(authorLine)} · ${esc(timeAgo(a.createdAt))}</div>
        <p>${esc(a.body)}</p>
        ${pinned ? `<button type="button" class="got-it" data-action="confirm" data-ann="${esc(a.id)}">Got it</button>` : ""}
        ${confirmedTs ? `<div class="confirmed-note">You confirmed ${esc(timeAgo(confirmedTs))}</div>` : ""}
      </article>`;
  }

  function renderEmployee(user) {
    const store = storeById(user.storeId);
    const mine = data.announcements
      .filter((a) => a.storeIds.includes(user.storeId))
      .sort((a, b) => b.createdAt - a.createdAt);

    const needsConfirm = (a) => a.required && !confirmedAt(a.id, user.id);
    const pending = mine.filter(needsConfirm);
    const rest = mine.filter((a) => !needsConfirm(a));

    const pendingHtml = pending.length
      ? `<div class="section-label required">Needs your confirmation (${pending.length})</div>
         ${pending.map((a) => postCard(a, { pinned: true })).join("")}`
      : `<div class="all-clear">✓ You're all caught up on required announcements.</div>`;

    const restHtml = rest.length
      ? rest
          .map((a) =>
            postCard(a, { pinned: false, confirmedTs: a.required ? confirmedAt(a.id, user.id) : null })
          )
          .join("")
      : `<p class="empty">No other announcements yet.</p>`;

    return `
      <div class="feed">
        <div class="feed-greeting">
          <h1>Hi, ${esc(firstName(user))}</h1>
          <p>${esc(storeLabel(store))}</p>
        </div>
        ${pendingHtml}
        <div class="section-label">Announcements</div>
        ${restHtml}
      </div>`;
  }

  /* ---------------- Actions (one delegated listener) ---------------- */

  $("#app").addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const user = currentUser();
    const action = el.getAttribute("data-action");

    if (action === "confirm" && user.role === "employee") {
      const id = el.getAttribute("data-ann");
      const ann = data.announcements.find((a) => a.id === id);
      if (!ann || !ann.storeIds.includes(user.storeId)) return;
      data.confirmations[id] = data.confirmations[id] || {};
      data.confirmations[id][user.id] = Date.now();
      saveData(data);
      render();
      toast("Thanks — confirmed");
      return;
    }

    if (user.role === "employee") return; // everything below is manager-only

    if (action === "tab") {
      session.managerTab = el.getAttribute("data-tab");
      saveSession();
      render({ scrollTop: true });
      return;
    }

    if (action === "toggle-store") {
      const key = el.getAttribute("data-key");
      openStores.has(key) ? openStores.delete(key) : openStores.add(key);
      render();
      return;
    }

    if (action === "remind") {
      const ann = data.announcements.find((a) => a.id === el.getAttribute("data-ann"));
      const target = userById(el.getAttribute("data-user"));
      if (!ann || !target) return;
      // Managers can only remind people at stores they're allowed to track.
      if (!trackedStoreIds(ann, user).includes(target.storeId)) return;
      data.reminders[ann.id] = data.reminders[ann.id] || {};
      const ts = Date.now();
      data.reminders[ann.id][target.id] = ts;
      saveData(data);
      render();
      toast(`Reminder sent to ${firstName(target)} · ${formatDateTime(ts)} (demo — no message sent)`);
    }
  });

  /* ---------------- Render ---------------- */

  function render({ scrollTop = false } = {}) {
    const app = $("#app");
    const user = currentUser();
    if (user.role === "employee") {
      app.innerHTML = renderEmployee(user);
    } else {
      app.innerHTML = renderManager(user);
      bindManagerForm(user);
    }
    if (scrollTop) window.scrollTo(0, 0);
  }

  renderEmployeeOptions();
  syncSwitcher();
  render();
})();
