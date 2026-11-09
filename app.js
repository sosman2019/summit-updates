/* Summit Updates — prototype
 * Plain JS, data persisted in localStorage.
 */
(function () {
  "use strict";

  // Bump when the seed changes so browsers pick up the new demo data (older saved data is replaced).
  // v3: optional dueAt on required announcements. v4: Store 1 overdue demo.
  const STORAGE_KEY = "summit-updates:data:v4";
  const SESSION_KEY = "summit-updates:session:v1";

  // Stores below this confirmation rate are highlighted for the Ops Manager.
  const TARGET_RATE = 0.8;

  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;

  /* "Confirm by" dates are whole days: due at the end of that day, local time. */
  function endOfDay(ts) {
    const d = new Date(ts);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }

  /* ---------------- Seed data ---------------- */

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
        // Due 2 days ago → Store 1's Alex and Sam show as Overdue.
        dueAt: endOfDay(now - 2 * DAY),
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
        dueAt: endOfDay(now + 2 * DAY),
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
    // a1 by store: S1 1/4 (25%), S2 3/3 (100%), S3 4/4 (100%), S4 1/3 (33%), S5 2/4 (50%)
    const confirmations = {
      a1: {
        "u-jordan": now - 2 * DAY + 2 * HOUR,
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

  function isValidData(d) {
    return (
      d && Array.isArray(d.stores) && d.stores.length &&
      Array.isArray(d.users) && Array.isArray(d.announcements) &&
      d.users.some((u) => u.id === "u-michael") && d.users.some((u) => u.id === "u-rachel")
    );
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (isValidData(d)) {
          d.confirmations = d.confirmations || {};
          d.reminders = d.reminders || {};
          return d;
        }
      }
    } catch (e) {
      /* corrupt or unavailable storage: fall through to seed */
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

  const ROLES = ["ops", "store", "employee"];
  const TABS = ["post", "tracking", "team"];

  function loadSession() {
    const s = { role: "ops", employeeId: "u-alex", managerTab: "post" };
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) Object.assign(s, JSON.parse(raw));
    } catch (e) {}
    if (!ROLES.includes(s.role)) s.role = "ops";
    if (!TABS.includes(s.managerTab)) s.managerTab = "post";
    return s;
  }

  function saveSession() {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {}
  }

  let data = loadData();
  let session = loadSession();

  /* In-memory UI state (not persisted). */
  const ui = {
    openStores: new Set(), // Ops store rows expanded, keyed "annId:storeId"
    pendingDeleteId: null, // announcement showing the in-page "Are you sure?" bar
    lastAddedId: null, // employee just added (shows the success banner on the Team tab)
    drafts: {}, // unsent post-form contents per manager, so re-renders don't wipe typing
  };

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
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

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

  function formatDay(ts) {
    return new Date(ts).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  /* yyyy-mm-dd for <input type="date">, in local time. */
  function dateInputValue(ts) {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function parseDateInput(value) {
    const [y, m, d] = String(value).split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  }

  function confirmedAt(annId, userId) {
    return (data.confirmations[annId] && data.confirmations[annId][userId]) || null;
  }

  function remindedAt(annId, userId) {
    return (data.reminders[annId] && data.reminders[annId][userId]) || null;
  }

  const isPastDue = (ann) => Boolean(ann.dueAt) && Date.now() > ann.dueAt;
  const joinedAfterDue = (ann, u) => Boolean(ann.dueAt && u.joinedAt && u.joinedAt > ann.dueAt);
  // Someone who joined after the deadline can't have missed it: they still need to confirm, but aren't "Overdue".
  const isOverdue = (ann, u) => isPastDue(ann) && !confirmedAt(ann.id, u.id) && !joinedAfterDue(ann, u);

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  /* Who is the current viewer? */
  function currentUser() {
    if (session.role === "ops") return userById("u-michael");
    if (session.role === "store") return userById("u-rachel");
    return userById(session.employeeId) || userById("u-alex");
  }

  const canDelete = (ann, user) => user.role === "ops" || ann.authorId === user.id;

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
    const rate = total ? confirmed.length / total : 0;
    const overdue = pending.filter((u) => isOverdue(ann, u)).length;
    return { total, confirmed, pending, rate, overdue };
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

  /* Required posts sent to a store in the last 7 days (for the "don't overuse Required" nudge). */
  function recentRequiredCount(storeId) {
    const since = Date.now() - 7 * DAY;
    return data.announcements.filter(
      (a) => a.required && a.createdAt >= since && a.storeIds.includes(storeId)
    ).length;
  }

  function nudgeCountHtml(storeIds) {
    const stores = storeIds.map(storeById).filter(Boolean).sort((a, b) => a.number - b.number);
    if (!stores.length) return "";
    if (stores.length === 1) {
      const n = recentRequiredCount(stores[0].id);
      return n
        ? `Store ${stores[0].number} has had <strong>${plural(n, "Required post")}</strong> this week.`
        : `Store ${stores[0].number} hasn't had any Required posts this week.`;
    }
    const parts = stores.map((s) => `Store ${s.number}: <strong>${recentRequiredCount(s.id)}</strong>`);
    return `Required posts in the last 7 days — ${parts.join(", ")}.`;
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

  /* ---------------- Inline field errors ---------------- */

  function showFieldErrors(form, errors) {
    form.querySelectorAll("[data-error-for]").forEach((el) => {
      const key = el.getAttribute("data-error-for");
      const msg = errors[key];
      el.textContent = msg || "";
      el.hidden = !msg;
      const control = form.querySelector(`[data-field="${key}"]`);
      if (control) {
        control.classList.toggle("invalid", Boolean(msg));
        if (msg) control.setAttribute("aria-invalid", "true");
        else control.removeAttribute("aria-invalid");
      }
    });
    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      const control = form.querySelector(`[data-field="${firstKey}"]`);
      const focusable = control && (control.matches("input, textarea, select") ? control : control.querySelector("input:not(:disabled)"));
      if (focusable) focusable.focus();
    }
  }

  function clearFieldError(form, key) {
    const el = form.querySelector(`[data-error-for="${key}"]`);
    const control = form.querySelector(`[data-field="${key}"]`);
    if (el) { el.hidden = true; el.textContent = ""; }
    if (control) { control.classList.remove("invalid"); control.removeAttribute("aria-invalid"); }
  }

  const errorSlot = (key) => `<div class="field-error" id="err-${key}" data-error-for="${key}" role="alert" hidden></div>`;

  /* ---------------- Role switcher + reset ---------------- */

  const roleSelect = $("#role-select");
  const employeeSelect = $("#employee-select");

  function renderEmployeeOptions() {
    employeeSelect.innerHTML = sortedStores()
      .map((s) => {
        const opts = employeesAt(s.id)
          .sort(byName)
          .map((u) => `<option value="${esc(u.id)}">${esc(u.name)}</option>`)
          .join("");
        return opts ? `<optgroup label="${esc(storeLabel(s))}">${opts}</optgroup>` : "";
      })
      .join("");
  }

  function syncSwitcher() {
    // A saved employee may no longer exist (e.g. an added employee after a reset).
    const emp = userById(session.employeeId);
    if (!emp || emp.role !== "employee") {
      session.employeeId = "u-alex";
      saveSession();
    }
    roleSelect.value = session.role;
    employeeSelect.hidden = session.role !== "employee";
    employeeSelect.value = session.employeeId;
  }

  function resetTransientUI() {
    ui.pendingDeleteId = null;
    ui.lastAddedId = null;
  }

  roleSelect.addEventListener("change", () => {
    session.role = roleSelect.value;
    saveSession();
    resetTransientUI();
    syncSwitcher();
    render({ scrollTop: true });
  });

  employeeSelect.addEventListener("change", () => {
    session.employeeId = employeeSelect.value;
    saveSession();
    render({ scrollTop: true });
  });

  // Reset uses an in-page confirm rather than a browser popup.
  const resetBtn = $("#reset-btn");
  const resetConfirm = $("#reset-confirm");
  function showResetConfirm(show) {
    resetBtn.hidden = show;
    resetConfirm.hidden = !show;
    if (show) $("#reset-no").focus();
  }
  resetBtn.addEventListener("click", () => showResetConfirm(true));
  $("#reset-no").addEventListener("click", () => {
    showResetConfirm(false);
    resetBtn.focus();
  });
  $("#reset-yes").addEventListener("click", () => {
    data = buildSeed();
    saveData(data);
    ui.openStores.clear();
    ui.drafts = {};
    resetTransientUI();
    renderEmployeeOptions();
    syncSwitcher();
    showResetConfirm(false);
    render({ scrollTop: true });
    toast("Demo data reset");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!resetConfirm.hidden) showResetConfirm(false);
    if (ui.pendingDeleteId) {
      ui.pendingDeleteId = null;
      render();
    }
  });

  /* ---------------- Manager view ---------------- */

  function renderManager(user) {
    const isOps = user.role === "ops";
    const myStore = isOps ? null : storeById(user.storeId);
    const tab = session.managerTab;

    const openCount = requiredForManager(user).filter((a) => {
      const s = statsFor(a, trackedStoreIds(a, user));
      return s.total && s.rate < 1;
    }).length;

    const tabBtn = (id, label, extra = "") => `
      <button type="button" role="tab" class="tab" data-action="tab" data-tab="${id}"
        aria-selected="${tab === id}">${label}${extra}</button>`;

    let body;
    if (tab === "tracking") body = renderTrackingTab(user);
    else if (tab === "team") body = renderTeamTab(user);
    else body = renderPostTab(user);

    return `
      <div class="page-head">
        <h1>Announcements</h1>
        <p>${esc(firstName(user))} · ${isOps ? "Operations Manager · All stores" : `Store Manager · ${esc(storeLabel(myStore))}`}</p>
      </div>
      <nav class="tabs" role="tablist">
        ${tabBtn("post", "Post")}
        ${tabBtn("tracking", "Confirmations", openCount ? ` <span class="tab-count">${openCount}</span>` : "")}
        ${tabBtn("team", "Team")}
      </nav>
      ${body}`;
  }

  function deleteButton(ann, user) {
    if (!canDelete(ann, user) || ui.pendingDeleteId === ann.id) return "";
    return `<button type="button" class="btn-text danger" data-action="ask-delete" data-ann="${esc(ann.id)}"
      aria-label="Delete “${esc(ann.title)}”">Delete</button>`;
  }

  function confirmDeleteBar(ann) {
    if (ui.pendingDeleteId !== ann.id) return "";
    const confirmations = Object.keys(data.confirmations[ann.id] || {}).length;
    const loses = ann.required && confirmations
      ? ` and its confirmation history (${plural(confirmations, "confirmation")}) will be lost`
      : "";
    return `
      <div class="confirm-bar" role="alertdialog" aria-label="Confirm delete">
        <p><strong>Delete this announcement?</strong> It will disappear from employees' feeds${loses}. This can't be undone.</p>
        <div class="confirm-actions">
          <button type="button" class="btn-secondary btn-sm" data-action="cancel-delete" data-autofocus>Cancel</button>
          <button type="button" class="btn-danger btn-sm" data-action="do-delete" data-ann="${esc(ann.id)}">Yes, delete</button>
        </div>
      </div>`;
  }

  /* ----- Post tab ----- */

  function getDraft(user) {
    if (!ui.drafts[user.id]) {
      ui.drafts[user.id] = { title: "", body: "", stores: [], required: false, due: "" };
    }
    return ui.drafts[user.id];
  }

  function renderPostTab(user) {
    const isOps = user.role === "ops";
    const myStore = isOps ? null : storeById(user.storeId);
    const d = getDraft(user);
    const allChecked = isOps && data.stores.every((s) => d.stores.includes(s.id));

    let storePicker;
    if (isOps) {
      storePicker = `
        <div class="store-picks" data-field="stores" aria-describedby="err-stores">
          <label class="chip all"><input type="checkbox" id="pick-all"${allChecked ? " checked" : ""}> All stores</label>
          ${sortedStores()
            .map(
              (s) => `<label class="chip"><input type="checkbox" name="store" value="${esc(s.id)}"${
                d.stores.includes(s.id) ? " checked" : ""
              }> ${esc(storeLabel(s))}</label>`
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

    const selectedIds = isOps ? d.stores : [user.storeId];

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
              progress = s.total
                ? ` · <button type="button" class="link-btn" data-action="tab" data-tab="tracking">${s.confirmed.length} of ${s.total} confirmed</button>`
                : " · No employees yet";
            }
            return `<li>
              <div class="posted-row">
                <div class="posted-main">
                  <div class="posted-title">${esc(a.title)}${a.required ? '<span class="badge badge-required">Required</span>' : ""}</div>
                  <div class="meta">${esc(audienceLabel(a.storeIds))} · ${esc(author ? firstName(author) : "Unknown")} · ${esc(timeAgo(a.createdAt))}${progress}</div>
                </div>
                ${deleteButton(a, user)}
              </div>
              ${confirmDeleteBar(a)}
            </li>`;
          })
          .join("")}</ul>`
      : `<div class="empty-state">
           <div class="empty-icon" aria-hidden="true">📣</div>
           <p><strong>No announcements yet</strong></p>
           <p>Your first post will show up here.</p>
         </div>`;

    return `
      <div class="manager-grid">
        <section class="card">
          <h2>New announcement</h2>
          <form id="post-form" novalidate>
            <div class="field">
              <label for="f-title">Title</label>
              <input type="text" id="f-title" data-field="title" maxlength="120" value="${esc(d.title)}"
                placeholder="e.g. Store opens late Sunday" autocomplete="off" aria-describedby="err-title">
              ${errorSlot("title")}
            </div>
            <div class="field">
              <label for="f-body">Message</label>
              <textarea id="f-body" data-field="body" maxlength="2000" aria-describedby="err-body"
                placeholder="Keep it short — staff will read this on their phone.">${esc(d.body)}</textarea>
              ${errorSlot("body")}
            </div>
            <div class="field">
              <span class="label">Send to</span>
              ${storePicker}
              ${errorSlot("stores")}
            </div>
            <div class="field">
              <label class="toggle-row" for="f-required">
                <span class="switch">
                  <input type="checkbox" id="f-required"${d.required ? " checked" : ""}>
                  <span class="track"></span>
                </span>
                <span class="toggle-text">
                  <strong>Required — employees must confirm</strong>
                  <span class="toggle-sub">Pinned to the top of their feed with a "Got it" button until they confirm.</span>
                </span>
              </label>
              <div class="nudge" id="required-nudge"${d.required ? "" : " hidden"}>
                <p><span class="nudge-label"><span aria-hidden="true">💡</span> Hint:</span> Use Required for safety and policy updates only, so your team doesn't tune them out.</p>
                <p id="nudge-count">${d.required ? nudgeCountHtml(selectedIds) : ""}</p>
              </div>
            </div>
            <div class="field" id="due-field"${d.required ? "" : " hidden"}>
              <label for="f-due">Confirm by <span class="optional">(optional)</span></label>
              <input type="date" id="f-due" data-field="due" value="${esc(d.due)}"
                min="${dateInputValue(Date.now())}" aria-describedby="err-due">
              ${errorSlot("due")}
              <div class="hint">Anyone who hasn't confirmed by the end of this day is marked Overdue.</div>
            </div>
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

  function bindPostForm(user) {
    const form = $("#post-form");
    if (!form) return;
    const isOps = user.role === "ops";
    const d = getDraft(user);
    const requiredBox = $("#f-required");

    // Never trust the form for store scope: enforce by role.
    const selectedStoreIds = () =>
      isOps
        ? [...form.querySelectorAll('input[name="store"]:checked')].map((b) => b.value)
        : [user.storeId];

    function syncDraft() {
      d.title = $("#f-title").value;
      d.body = $("#f-body").value;
      d.required = requiredBox.checked;
      d.due = $("#f-due").value;
      if (isOps) d.stores = selectedStoreIds();
    }

    function updateRequiredUI() {
      const on = requiredBox.checked;
      $("#required-nudge").hidden = !on;
      $("#due-field").hidden = !on;
      if (on) $("#nudge-count").innerHTML = nudgeCountHtml(selectedStoreIds());
      if (!on) clearFieldError(form, "due");
    }

    form.addEventListener("input", (e) => {
      const key = e.target.getAttribute("data-field");
      if (key) clearFieldError(form, key);
      syncDraft();
    });
    requiredBox.addEventListener("change", () => {
      updateRequiredUI();
      syncDraft();
    });

    if (isOps) {
      const allBox = $("#pick-all");
      const storeBoxes = [...form.querySelectorAll('input[name="store"]')];
      const onStoresChanged = () => {
        clearFieldError(form, "stores");
        updateRequiredUI();
        syncDraft();
      };
      allBox.addEventListener("change", () => {
        storeBoxes.forEach((b) => (b.checked = allBox.checked));
        onStoresChanged();
      });
      storeBoxes.forEach((b) =>
        b.addEventListener("change", () => {
          allBox.checked = storeBoxes.every((x) => x.checked);
          onStoresChanged();
        })
      );
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = $("#f-title").value.trim();
      const body = $("#f-body").value.trim();
      const required = requiredBox.checked;
      const dueValue = $("#f-due").value;
      const dueAt = required && dueValue ? parseDateInput(dueValue) : null;
      const storeIds = selectedStoreIds();

      const errors = {};
      if (!title) errors.title = "Add a title so people know what this is about.";
      if (!body) errors.body = "Add a message.";
      if (!storeIds.length) errors.stores = "Pick at least one store.";
      if (required && dueValue && (!dueAt || dueAt < Date.now())) {
        errors.due = "Pick today or a later date.";
      }
      if (Object.keys(errors).length) {
        showFieldErrors(form, errors);
        return;
      }

      const ann = {
        id: "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title,
        body,
        storeIds,
        required,
        authorId: user.id,
        createdAt: Date.now(),
      };
      if (dueAt) ann.dueAt = dueAt;
      data.announcements.push(ann);
      saveData(data);
      delete ui.drafts[user.id];
      render();
      toast(
        `Posted to ${audienceLabel(storeIds)}` +
          (required ? ` · confirmation required${dueAt ? ` by ${formatDay(dueAt)}` : ""}` : "")
      );
    });
  }

  /* ----- Tracking tab ----- */

  function renderTrackingTab(user) {
    const anns = requiredForManager(user);
    if (!anns.length) {
      return `<div class="card empty-state">
          <div class="empty-icon" aria-hidden="true">✅</div>
          <p><strong>No Required announcements yet</strong></p>
          <p>Turn on "Required" when posting to track who has confirmed.</p>
        </div>`;
    }
    return `<div class="tracking-list">${anns.map((a) => trackingCard(a, user)).join("")}</div>`;
  }

  function trackingCard(ann, user) {
    const isOps = user.role === "ops";
    const storeIds = trackedStoreIds(ann, user);
    const s = statsFor(ann, storeIds);
    const author = userById(ann.authorId);

    let due = "";
    if (ann.dueAt) {
      due = isPastDue(ann)
        ? `<div class="due-line is-overdue">Was due ${esc(formatDay(ann.dueAt))}</div>`
        : `<div class="due-line">Confirm by ${esc(formatDay(ann.dueAt))}</div>`;
    }

    const summary = s.total
      ? `<strong>${s.confirmed.length} of ${s.total}</strong> confirmed
         ${s.overdue ? `<div class="overdue-count">${s.overdue} overdue</div>` : ""}`
      : `<strong class="muted">No employees yet</strong>`;

    let body;
    if (isOps) {
      const allDone = s.total > 0 && s.pending.length === 0;
      body = (allDone ? `<div class="all-confirmed">Everyone's confirmed 🎉</div>` : "") + storeBreakdown(ann, storeIds);
    } else {
      body = peopleLists(ann, s, user);
    }

    return `
      <section class="card track-card">
        <div class="track-head">
          <div class="track-title">
            <h2>${esc(ann.title)}</h2>
            <div class="meta">${esc(audienceLabel(ann.storeIds))} · Posted by ${esc(author ? firstName(author) : "Unknown")} · ${esc(formatDateTime(ann.createdAt))}</div>
            ${due}
          </div>
          <div class="track-summary ${s.total ? rateClass(s.rate) : ""}">${summary}</div>
        </div>
        ${s.total ? progressBar(s.rate) : ""}
        ${body}
        <div class="card-foot">${deleteButton(ann, user)}</div>
        ${confirmDeleteBar(ann)}
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
        const open = ui.openStores.has(key);
        const low = s.total > 0 && s.rate < TARGET_RATE;
        return `
          <li class="store-item${low ? " is-low" : ""}">
            <button type="button" class="store-row" data-action="toggle-store" data-key="${esc(key)}"
              aria-expanded="${open}">
              <span class="store-name"><span class="store-name-text">${esc(storeLabel(store))}</span>${
                s.overdue ? `<span class="overdue-pill">${s.overdue} overdue</span>` : ""
              }</span>
              <span class="store-bar">${s.total ? progressBar(s.rate, "progress-sm") : '<span class="muted small">No employees</span>'}</span>
              <span class="store-count">${s.total ? `${s.confirmed.length}/${s.total}` : "—"}</span>
              <span class="store-pct">${s.total ? pct(s.rate) : "—"}</span>
              <span class="chev" aria-hidden="true"></span>
            </button>
            ${open ? `<div class="store-people">${peopleLists(ann, s, null)}</div>` : ""}
          </li>`;
      })
      .join("");

    return `
      <div class="breakdown-label">By store <span class="hint-inline">· under ${pct(TARGET_RATE)} highlighted · tap a store to see people</span></div>
      <ul class="store-list">${rows}</ul>`;
  }

  function peopleLists(ann, s, user) {
    if (!s.total) {
      return `<p class="empty-inline">No employees at this store yet. Add one from the <button type="button" class="link-btn" data-action="tab" data-tab="team">Team</button> tab.</p>`;
    }

    const confirmedHtml = s.confirmed.length
      ? s.confirmed
          .map(
            (u) => `
              <li class="person">
                <div class="person-main"><span class="person-name">${esc(u.name)}</span></div>
                <span class="person-time">✓ ${esc(formatDateTime(confirmedAt(ann.id, u.id)))}</span>
              </li>`
          )
          .join("")
      : `<li class="person empty">No one yet.</li>`;

    const confirmedCol = `
      <div>
        <div class="people-label done">Confirmed (${s.confirmed.length})</div>
        <ul class="people">${confirmedHtml}</ul>
      </div>`;

    // Everyone's confirmed: celebrate, and just show the confirmed list.
    if (!s.pending.length) {
      return `${user ? `<div class="all-confirmed">Everyone's confirmed 🎉</div>` : `<div class="all-confirmed sm">Everyone at this store has confirmed 🎉</div>`}
        <div class="people-cols single">${confirmedCol}</div>`;
    }

    const pendingHtml = s.pending
      .map((u) => {
        const reminded = remindedAt(ann.id, u.id);
        const isNew = u.joinedAt && u.joinedAt > ann.createdAt;
        return `
          <li class="person">
            <div class="person-main">
              <span class="person-name">${esc(u.name)}</span>
              ${isOverdue(ann, u) ? '<span class="tag tag-overdue">Overdue</span>' : ""}
              ${isNew ? '<span class="tag">Joined after this was posted</span>' : ""}
              ${reminded ? `<div class="person-sub reminded">Reminder sent · ${esc(formatDateTime(reminded))}</div>` : ""}
            </div>
            <button type="button" class="btn-remind" data-action="remind"
              data-ann="${esc(ann.id)}" data-user="${esc(u.id)}">${reminded ? "Remind again" : "Remind"}</button>
          </li>`;
      })
      .join("");

    return `
      <div class="people-cols">
        <div>
          <div class="people-label pending">Not confirmed (${s.pending.length})</div>
          <ul class="people">${pendingHtml}</ul>
        </div>
        ${confirmedCol}
      </div>`;
  }

  /* ----- Team tab (add employee) ----- */

  function renderTeamTab(user) {
    const isOps = user.role === "ops";
    const myStore = isOps ? null : storeById(user.storeId);
    const stores = isOps ? sortedStores() : [myStore];

    const storeField = isOps
      ? `<select id="e-store" data-field="store" aria-describedby="err-store">
           <option value="">Choose a store…</option>
           ${stores.map((s) => `<option value="${esc(s.id)}">${esc(storeLabel(s))}</option>`).join("")}
         </select>`
      : `<div class="static-value">${esc(storeLabel(myStore))}</div>`;

    let banner = "";
    const added = ui.lastAddedId && userById(ui.lastAddedId);
    if (added) {
      const n = data.announcements.filter((a) => a.required && a.storeIds.includes(added.storeId)).length;
      banner = `
        <div class="success-bar" role="status">
          <p><strong>${esc(added.name)}</strong> was added to ${esc(storeLabel(storeById(added.storeId)))}.
          ${n
            ? `They have <strong>${plural(n, "Required announcement")}</strong> to confirm.`
            : "There are no Required announcements for their store right now."}</p>
          <button type="button" class="btn-secondary btn-sm" data-action="view-as" data-user="${esc(added.id)}">View ${esc(firstName(added))}'s phone →</button>
        </div>`;
    }

    const roster = stores
      .map((s) => {
        const people = employeesAt(s.id).sort(byName);
        const list = people.length
          ? `<ul class="roster">${people
              .map((u) => {
                const isNew = u.joinedAt && Date.now() - u.joinedAt < 14 * DAY;
                return `<li>
                  <span class="roster-name">${esc(u.name)}${isNew ? ' <span class="tag">New</span>' : ""}</span>
                  <button type="button" class="btn-text" data-action="view-as" data-user="${esc(u.id)}">View feed</button>
                </li>`;
              })
              .join("")}</ul>`
          : `<p class="empty-inline">No employees yet.</p>`;
        return `<div class="roster-store">
            <h3>${esc(storeLabel(s))} <span class="count">${people.length}</span></h3>
            ${list}
          </div>`;
      })
      .join("");

    return `
      <div class="manager-grid">
        <section class="card">
          <h2>Add employee</h2>
          <form id="add-employee-form" novalidate>
            <div class="field">
              <label for="e-name">Full name</label>
              <input type="text" id="e-name" data-field="name" maxlength="60" autocomplete="off"
                placeholder="e.g. Jamie Rivera" aria-describedby="err-name">
              ${errorSlot("name")}
            </div>
            <div class="field">
              <label${isOps ? ' for="e-store"' : ""}>Store</label>
              ${storeField}
              ${errorSlot("store")}
            </div>
            <p class="hint">New hires see every Required announcement for their store and must confirm them.</p>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Add employee</button>
            </div>
          </form>
          ${banner}
        </section>
        <section class="card">
          <h2>${isOps ? "Team by store" : "Your team"}</h2>
          ${roster}
        </section>
      </div>`;
  }

  function bindAddEmployeeForm(user) {
    const form = $("#add-employee-form");
    if (!form) return;
    const isOps = user.role === "ops";

    form.addEventListener("input", (e) => {
      const key = e.target.getAttribute("data-field");
      if (key) clearFieldError(form, key);
    });
    form.addEventListener("change", (e) => {
      const key = e.target.getAttribute("data-field");
      if (key) clearFieldError(form, key);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#e-name").value.trim().replace(/\s+/g, " ");
      const storeId = isOps ? $("#e-store").value : user.storeId; // store managers: own store only

      const errors = {};
      if (!name) errors.name = "Enter the employee's name.";
      if (!storeId || !storeById(storeId)) errors.store = "Pick a store.";
      if (
        name && storeId &&
        employeesAt(storeId).some((u) => u.name.toLowerCase() === name.toLowerCase())
      ) {
        errors.name = `${name} already works at Store ${storeById(storeId).number}.`;
      }
      if (Object.keys(errors).length) {
        showFieldErrors(form, errors);
        return;
      }

      const newUser = {
        id: "u-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name,
        role: "employee",
        storeId,
        joinedAt: Date.now(),
      };
      data.users.push(newUser);
      saveData(data);
      ui.lastAddedId = newUser.id;
      renderEmployeeOptions();
      syncSwitcher();
      render();
      toast(`Added ${name}`);
    });
  }

  /* ---------------- Employee view (in a phone frame on desktop) ---------------- */

  function postCard(a, user, { pinned, confirmedTs }) {
    const author = userById(a.authorId);
    const authorLine = author
      ? `${firstName(author)} · ${author.role === "ops" ? "Operations" : "Store Manager"}`
      : "Management";

    let due = "";
    if (pinned && a.dueAt) {
      if (!isPastDue(a)) due = `<div class="due-pill">Confirm by ${esc(formatDay(a.dueAt))}</div>`;
      else if (joinedAfterDue(a, user)) due = `<div class="due-pill">Please confirm — you're new since this went out</div>`;
      else due = `<div class="due-pill is-overdue">Overdue · was due ${esc(formatDay(a.dueAt))}</div>`;
    }

    return `
      <article class="post${pinned ? " pinned" : ""}">
        <h3>${esc(a.title)}${confirmedTs ? '<span class="badge badge-ok">✓ Confirmed</span>' : ""}</h3>
        <div class="meta">${esc(authorLine)} · ${esc(timeAgo(a.createdAt))}</div>
        ${due}
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

    let content;
    if (!mine.length) {
      content = `
        <div class="empty-state">
          <div class="empty-icon" aria-hidden="true">📭</div>
          <p><strong>No announcements yet</strong></p>
          <p>Updates from your managers will show up here.</p>
        </div>`;
    } else {
      const pendingHtml = pending.length
        ? `<div class="section-label required">Needs your confirmation (${pending.length})</div>
           ${pending.map((a) => postCard(a, user, { pinned: true })).join("")}`
        : `<div class="all-clear">✓ You're all caught up on required announcements.</div>`;
      const restHtml = rest.length
        ? `<div class="section-label">Announcements</div>
           ${rest
             .map((a) => postCard(a, user, { pinned: false, confirmedTs: a.required ? confirmedAt(a.id, user.id) : null }))
             .join("")}`
        : "";
      content = pendingHtml + restHtml;
    }

    return `
      <div class="phone-wrap">
        <div class="phone">
          <div class="phone-screen" id="phone-screen">
            <div class="phone-top" aria-hidden="true">
              <div class="phone-status">
                <span>9:41</span>
                <span class="phone-island"></span>
                <span class="phone-icons"><i></i><i></i><i></i><b></b></span>
              </div>
              <div class="phone-appbar"><span class="brand-mark sm">S</span> Summit Updates</div>
            </div>
            <div class="feed">
              <div class="feed-greeting">
                <h1>Hi, ${esc(firstName(user))}</h1>
                <p>${esc(storeLabel(store))}</p>
              </div>
              ${content}
            </div>
          </div>
        </div>
        <p class="phone-caption">Employee view · ${esc(user.name)}'s phone</p>
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
      if (!ann || !ann.required || !ann.storeIds.includes(user.storeId)) return;
      data.confirmations[id] = data.confirmations[id] || {};
      data.confirmations[id][user.id] = Date.now();
      saveData(data);
      render();
      toast("Thanks — confirmed");
      return;
    }

    if (user.role === "employee") return; // everything below is manager-only

    switch (action) {
      case "tab": {
        const tab = el.getAttribute("data-tab");
        if (!TABS.includes(tab)) return;
        session.managerTab = tab;
        saveSession();
        resetTransientUI();
        render({ scrollTop: true });
        return;
      }

      case "toggle-store": {
        const key = el.getAttribute("data-key");
        ui.openStores.has(key) ? ui.openStores.delete(key) : ui.openStores.add(key);
        render();
        return;
      }

      case "remind": {
        const ann = data.announcements.find((a) => a.id === el.getAttribute("data-ann"));
        const target = userById(el.getAttribute("data-user"));
        if (!ann || !target || confirmedAt(ann.id, target.id)) return;
        // Managers can only remind people at stores they're allowed to track.
        if (!trackedStoreIds(ann, user).includes(target.storeId)) return;
        data.reminders[ann.id] = data.reminders[ann.id] || {};
        const ts = Date.now();
        data.reminders[ann.id][target.id] = ts;
        saveData(data);
        render();
        toast(`Reminder sent to ${firstName(target)} · ${formatDateTime(ts)} (demo — no message sent)`);
        return;
      }

      case "ask-delete": {
        const ann = data.announcements.find((a) => a.id === el.getAttribute("data-ann"));
        if (!ann || !canDelete(ann, user)) return;
        ui.pendingDeleteId = ann.id;
        render();
        return;
      }

      case "cancel-delete":
        ui.pendingDeleteId = null;
        render();
        return;

      case "do-delete": {
        const id = el.getAttribute("data-ann");
        const ann = data.announcements.find((a) => a.id === id);
        if (!ann || !canDelete(ann, user)) return;
        data.announcements = data.announcements.filter((a) => a.id !== id);
        delete data.confirmations[id];
        delete data.reminders[id];
        [...ui.openStores].forEach((k) => k.startsWith(id + ":") && ui.openStores.delete(k));
        ui.pendingDeleteId = null;
        saveData(data);
        render();
        toast("Announcement deleted");
        return;
      }

      case "view-as": {
        const target = userById(el.getAttribute("data-user"));
        if (!target || target.role !== "employee") return;
        session.role = "employee";
        session.employeeId = target.id;
        saveSession();
        resetTransientUI();
        syncSwitcher();
        render({ scrollTop: true });
        return;
      }
    }
  });

  /* ---------------- Render ---------------- */

  function render({ scrollTop = false } = {}) {
    const app = $("#app");
    const user = currentUser();
    // Re-rendering replaces the phone screen, so keep its scroll position unless we're changing view.
    const phone = $("#phone-screen");
    const phoneScroll = !scrollTop && phone ? phone.scrollTop : 0;

    if (user.role === "employee") {
      app.innerHTML = renderEmployee(user);
      const ps = $("#phone-screen");
      if (ps) ps.scrollTop = phoneScroll;
    } else {
      app.innerHTML = renderManager(user);
      bindPostForm(user);
      bindAddEmployeeForm(user);
    }

    const autofocus = app.querySelector("[data-autofocus]");
    if (autofocus) autofocus.focus({ preventScroll: true });
    if (scrollTop) window.scrollTo(0, 0);
  }

  renderEmployeeOptions();
  syncSwitcher();
  render();
})();
