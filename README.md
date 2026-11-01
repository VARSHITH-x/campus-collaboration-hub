# CollabSpace

Find people. Share goals. Build together.

A student platform with three connected modules: Project Collaboration, Learning & Mentorship, and Campus Communities.

**Status:** Phase 1 of 5 (foundation and app shell). The module pages are labelled placeholders until Phase 2.

## Run it

```bash
npm install
npm run dev      # open the address it prints (usually http://localhost:5173)
npm run build    # production build into dist/
```

## Files

| File | Purpose |
| --- | --- |
| `index.html`, `src/main.jsx` | Page and React entry point |
| `src/app.jsx` | App shell: nav, page switching, reset-demo-data dialog, footer |
| `src/store.js` | Shared storage API (`get`, `save`, `insert`, `update`, `remove`, `resetDemoData`), React hooks, demo-user switching, and the hash router |
| `src/data.js` | Fictional demo users and communities used to seed a fresh browser |
| `src/style.css` | All styling (plain CSS, dark theme) |
| `src/components/nav.jsx` | Top navigation and demo-user dropdown |
| `src/components/ui.jsx` | Shared Modal, Badge, Empty, PageHeader, Planned and Toasts |
| `src/pages/*.jsx` | One file per page |

## Limitations (please read)

- This is a **client-side prototype**. Data is saved in `localStorage`, so it stays in one browser and **does not sync between devices or users**.
- There is **no server-side validation** and **no real authentication**. The "demo user" switcher only changes which sample student you are viewing as.
- All records are fictional demo data.
