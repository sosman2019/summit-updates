# Summit Updates

**Live demo:** https://sosman2019.github.io/summit-updates/

A prototype announcement app for Summit Retail Group.

## What this is

Summit Retail's ~200 frontline staff work on the sales floor across 5 stores and don't check email, so managers have no way to tell who has actually seen an important update. I built a simple mobile-friendly web app where managers post announcements, employees read them on their phones, and for **Required** posts, managers can see exactly who has confirmed reading them.

## Who it's for

- **Store managers (Rachel, Store 1):** post updates to their store and see who on their team has confirmed.
- **The Operations manager (Michael):** posts to any or all stores and sees confirmation rates broken down by store.
- **Sales associates (Alex):** see their store's announcements on their phone and tap "Got it" on the ones that matter.

## How to run it

Open `index.html` in a browser. There's nothing to install, no build step and no server.

- Use the **role switcher** at the top to view the app as Michael, Rachel or any employee.
- Data is saved in your browser (`localStorage`). **Reset demo data** in the top bar restores the original mock data (5 stores, a manager per store, 3–4 employees each, and a handful of announcements).

## What it does

- **Post announcements:** title, message, which stores it goes to, and an optional **Required** toggle. Store managers can only post to their own store.
- **Confirm by date (optional):** for Required posts. Anyone who hasn't confirmed by the end of that day is marked **Overdue**.
- **Employee feed:** shows only the employee's own store. Unconfirmed Required posts are pinned at the top with a single **Got it** button and their due date. Once confirmed, they move into the normal feed.
- **Confirmation tracking:** "X of Y confirmed" with a progress bar, who has and hasn't confirmed (with times), and a **Remind** button.
  - Rachel sees her store by person.
  - Michael sees a per-store breakdown, with stores under 80% highlighted, and can open any store to see the people.
- **Team tab:** add a new employee and jump straight to their feed.
- **Delete:** with an "Are you sure?" step inside the page.
- **Polish:** inline validation, friendly empty states, and the employee view shown in a phone frame on desktop for demos.

## Key decisions and assumptions

- **Employees use their own phones**, so this is a mobile-friendly web page, not a native app.
- **Only Required posts ask for confirmation.** Rachel gets proof on what matters, and Alex isn't asked to confirm everything.
- **"Got it" means "I've read it."** One tap, no quiz.
- **New hires must confirm Required posts made before they joined.** "Y" counts everyone currently at the store. But they aren't marked Overdue for deadlines that passed before they started.
- **Managers see their own store; Michael sees all stores**, broken down by store.
- **The app nudges managers not to overuse Required.** When the toggle is on, a hint shows how many Required posts the store has had this week. It's a nudge, not a block.
- **No editing posts in v1.** Delete and repost instead.
- **"Remind" is a demo button.** It records the time, but no real message is sent.

## What I left out on purpose

- Comments and questions on announcements
- Real push or SMS notifications
- Logins (the role switcher stands in for them)
- A backend or database (everything lives in `localStorage`)
- Translations
- Editing posts

## What I'd build next

1. **Real notifications:** SMS or push, so Required posts and reminders reach people who aren't looking at the app.
2. **Q&A on announcements:** so employees can ask questions instead of guessing.
3. **Editing with re-confirmation:** if a Required post changes, everyone confirms again.
4. **Translations** for multilingual teams.
5. **Reporting for Michael over time:** confirmation rates by store and week, not just per post.

## What I checked

**Bugs found and fixed:**

- **Top bar overflowing on small phones.** Below about 345px wide (or with a long employee name), the top bar was wider than the screen, so every page scrolled sideways. The narrow layout kept a wrapping setting that sized the bar to the role dropdown's longest option instead of the screen.
- **"0 of 0 confirmed"** showed for stores with no employees. It now reads "No employees yet," and empty stores aren't counted as 100% or highlighted.
- Smaller fixes from a full review:
  - Text typed in the post form was lost when the page redrew.
  - The employee dropdown went blank after a reset.
  - New hires were marked Overdue for deadlines set before they joined.

**Verified:**

- Posting without a title, message or store is blocked, with an error next to each field.
- Past "Confirm by" dates are blocked.
- Overdue status shows correctly in the manager view.
- The sticky header doesn't cover content.
- New hires see existing Required posts and must confirm them.
- Pages don't scroll sideways at 375px and 320px wide.

## Time spent

About 1 hour of building over two sessions with Claude Code, plus about 30 minutes of planning.

## Files

- `index.html`: page shell, top bar and role switcher
- `styles.css`: all styling, including the phone frame and small-screen layout
- `app.js`: seed data, storage, and all views and actions
