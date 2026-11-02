# CollabSpace

Find people. Share goals. Build together.

CollabSpace is a client-side campus collaboration prototype for students. Three connected modules share one profile, one storage layer and one notification feed:

- **Collaborate**: publish a goal-based project, define roles, take applications, run a small task board, and close it with an outcome.
- **Learn & Mentor**: mentor offers, learning requests, learning circles with ordered milestones and progress.
- **Communities**: batch, branch, topic and campus spaces with discussions, questions, resources, polls, announcements, reports and moderation.

A community idea can be turned into a project, and the project keeps a link back to the original post.

## Run it

```bash
npm install
npm run dev      # open the address it prints (usually http://localhost:5173)
npm test         # rules, storage and connected-behavior tests (no browser needed)
npm run build    # production build into dist/
```

Needs Node 18 or newer.

## Try the demo

Use the user menu (top right) to switch between sample students. The switcher is a demonstration feature, **not authentication**.

| Demo user | Good for |
| --- | --- |
| Aarav Nair | Owns the robotics project: review the pending application, assign tasks |
| Meera Iyer | A beginner: apply for a role, join the Python circle, post in communities |
| Rohan Desai | Mentor and owner of the bus-timetable project |
| Sana Khan | Applicant, mentor (Verilog), circle member |
| Dev Patil | First-year learner with a pending mentor offer |
| Campus Moderator (Demo Admin) | The only user who can pin announcements and resolve reports |

Suggested 6-minute walkthrough: publish a project and a role, apply as another user, accept, assign a task and complete the project; post a learning request and respond as a mentor, tick milestones in a circle; post in a community, comment, vote in a poll, report a post and resolve it as the moderator; use "Turn into project" on a discussion. "Reset demo data" in the footer restores the sample records.

## Files

| File | Purpose |
| --- | --- |
| `index.html`, `src/main.jsx` | Page and React entry point (the page shows a loading message until the app starts) |
| `src/app.jsx` | App shell: nav, page switching, error boundary, reset dialog, footer, startup expiry sweeps |
| `src/store.js` | The only place that touches `localStorage`: `get`, `save`, `insert`, `update`, `remove`, `resetDemoData`, React hooks, demo-user switching, hash router |
| `src/collab.js` | Project Collaboration rules |
| `src/learning.js` | Profiles, mentor offers and requests, learning circles, milestones, expiry |
| `src/community.js` | Posts, comments, reactions, polls, saving, reporting, moderation |
| `src/notify.js` | Notifications in the shared format; read and unread |
| `src/util.js` | Validation and date helpers |
| `src/data.js` | Fictional demo records used to seed a fresh browser |
| `src/style.css` | All styling (plain CSS, dark theme) |
| `src/components/nav.jsx`, `ui.jsx` | Navigation and shared pieces (modal, confirm, tabs, form helpers, toasts) |
| `src/pages/*.jsx` | One file per screen |
| `tests/*.test.mjs` | Automated tests (`npm test`) |

Design rule: pages never contain business rules. They call a function in `collab.js`, `learning.js` or `community.js`, which validates, checks permissions, saves through `store.js` and sends notifications. Every rule function returns `{ ok: true }` or `{ ok: false, error, errors }`.

## Data contracts

Status values (one vocabulary, used everywhere):

| Entity | Allowed values |
| --- | --- |
| Opportunity | `open`, `forming`, `active`, `completed`, `archived` |
| Application | `pending`, `accepted`, `declined`, `withdrawn` |
| Task | `not_started`, `in_progress`, `submitted`, `completed` |
| Mentor offer, learning request, mentorship message | `open`, `pending`, `accepted`, `declined`, `withdrawn`, `completed`, `expired` |
| Community post / comment | `published`, `reported`, `hidden`, `removed` (pinned is a separate flag) |
| Report | `open`, `reviewed`, `actioned`, `dismissed` |

Opportunity moves only along: open to forming or active or archived; forming to active or archived; active to completed; completed to archived.

Notification: `{ id, recipientId, eventType, message, relatedEntityType, relatedEntityId, createdAt, read }`.

Choices that differ from, or add to, the work plan:

- A mentorship message uses `fromId` / `toId` plus `kind` (`request` or `offer`) instead of `requesterId` / `mentorId`, so one record type covers both directions of "request a mentor" and "offer help".
- Opportunities have a required `nextStep` field (the plan and brief ask every post to state how the group starts) and a `sourcePostId` for the idea bridge.
- Profiles carry a `role` (`student` or `moderator`). Answer to the kickoff question "who may pin announcements and resolve reports": only the demo moderator.
- Every post, comment or project can be reported. Reports are records; nothing is removed automatically. A moderator can mark reviewed, dismiss, or remove (a project is archived instead of deleted).
- Open items expire: a recruiting project whose deadline passed before a team formed is archived, and learning offers, requests and unanswered mentor messages older than 30 days expire. This runs when the app starts.

## Tests

`npm test` runs three suites against the real code, without a browser:

- `storage.test.mjs`: every page renders, seeding, persistence across refresh, damaged or unavailable storage, reset.
- `rules.test.mjs`: validation, permissions, duplicate applications, role capacity, task review flow, lifecycle transitions, circles and milestones, polls, reactions, reporting, expiry.
- `connected.test.mjs`: which notification each event creates and for whom, the idea-to-project bridge, project reports, dashboard content.

Browser checks were also run by hand-scripting real clicks (journeys across all three modules, damaged and blocked storage, hostile input, double clicks, and layout at 360, 768 and 1280 px). Manual checklist for a demo:

1. Fresh load shows Home with no console errors.
2. Blank forms show inline errors and save nothing.
3. Refresh keeps everything you changed.
4. Every destructive action (delete task, leave, archive, remove, reset) asks first.
5. Narrow the window to phone width: no sideways scrolling, menu opens from the Menu button.

## Limitations (please read)

- This is a **client-side prototype**. Data is saved in `localStorage`, so it stays in one browser and **does not sync between devices or users**. A real shared campus version needs a backend, which is future work.
- There is **no server-side validation** and **no real authentication**. The validation in the rule files runs in the browser, and the "demo user" switcher only changes whose view you see. Do not enter real personal information.
- All records are fictional demo data. No real contact details are stored.
- Notifications are an in-app list only (no email, push or real-time delivery).
- Learning circles use a member roster and milestone ticks, not chat.

## Future work

Real backend and sign-in, cross-device sync, real-time notifications, contact sharing after a match, richer search and recommendations, linking a learning role in a project to the mentor directory, and an analytics view of how many opportunities find a team.

## AI usage disclosure

This project was planned and written with Claude (Anthropic) through Claude Code, working from the two project PDFs. AI tools are allowed for the course but must be disclosed and understood: whoever submits this should read through each module, run `npm test`, and be able to explain the data flow (page, rule function, `store.js`, notification) before presenting it.
