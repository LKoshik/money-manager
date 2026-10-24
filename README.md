# Money Manager

A personal money manager that installs on Android like an app (PWA): works offline, keeps all data on your phone, hosted free on GitHub Pages.

Needs Node 22 (the same version the deploy uses). The only dev tool is esbuild.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Once. Installs esbuild. |
| `npm run dev` | Serves `src/` at http://localhost:8012/ (no build; reload to see changes). |
| `npm test` | Runs all unit tests. |
| `npm run build` | Builds `dist/` (one `index.html` + `manifest.json`, `sw.js`, `icons/`). |
| `npm run preview` | Serves `dist/` at http://localhost:8013/ (the real built app, with offline mode). |
| `npm run icons` | Redraws the PNG icons in `src/pwa/icons/` (only needed if you change the design in `tools/makeIcons.mjs`). |

Use `localhost`, not your computer's network address: the app needs https or localhost.

## Deploy to GitHub Pages (free)

1. Run `npm install` once and keep the new `package-lock.json` (the deploy needs it).
2. On github.com create a **public** repository (free Pages needs a public repo), e.g. `money-manager`.
3. In this folder:
   ```
   git init
   git add .
   git commit -m "Money Manager"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/money-manager.git
   git push -u origin main
   ```
4. In the repository: **Settings > Pages > Source: GitHub Actions**.
5. Open the **Actions** tab. When "Deploy to GitHub Pages" is green, the app is at `https://YOUR-NAME.github.io/money-manager/`.

Every later `git push` to `main` runs the tests, builds and publishes again. If the tests fail, nothing is published.

## Install on Android

1. Open the address above in **Chrome**.
2. Menu (three dots) > **Install app** (or **Add to Home screen**).
3. Start it from the new icon: it opens fullscreen.

## Updates

After you push a change, open the app. Chrome checks for a new version when the app opens and when you come back to it. When one is ready a bar says **A new version is ready**: tap **Reload**. **Later** keeps your current screen (the bar returns the next time you open the app).

## Test offline

Open the app once with internet, then switch on airplane mode and start it again. It must open and show your data.

## Your data (please read)

- Data lives only in this browser, on this address. A different address (or a different browser) starts empty.
- Clearing Chrome's site data, or uninstalling the app on some phones, **deletes the data**.
- Backup: **Settings > Export JSON**, then save the file somewhere safe (Google Drive, e-mail to yourself). Do it at least every two weeks; the app reminds you after 14 days.
- Restore: **Settings > Import JSON** (this replaces everything after you confirm).

## Project layout

```
src/core      pure logic (no screen, no storage), unit-tested
src/data      IndexedDB (only data/db.js talks to it)
src/state     store + actions
src/ui        reusable screen pieces
src/features  one folder per screen (dashboard, transactions, budgets, reports, accounts, settings)
src/styles    global CSS (colors are CSS variables)
src/pwa       manifest.json, sw.js, icons/
tools         dev server, icon maker, build helpers
tests         unit tests
```

To add a feature: create its folder in `src/features/` and add one line to `src/features/index.js`.
