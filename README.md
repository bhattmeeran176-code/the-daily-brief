# The Daily Brief — first version

A responsive editorial/news homepage built with React + Vite. This is a frontend starter with sample editorial content; it does not yet have a real CMS, database, login, or working newsletter delivery.

## Run locally
1. Install Node.js (LTS).
2. In this folder run `npm install`.
3. Run `npm run dev`.
4. Open the local URL printed by Vite.

## Deploy to Render (Static Site)
1. Create a GitHub account/repository and upload this project.
2. In Render, choose **New + → Static Site**.
3. Connect the GitHub repository.
4. Set **Build Command** to `npm install && npm run build`.
5. Set **Publish Directory** to `dist`.
6. Click **Create Static Site**. Render will build and publish the site.

## Before public launch
- Replace sample stories and dates with verified, current reporting.
- The article body and newsletter are demo-only at this stage.
- Add a CMS/admin dashboard and database before publishing regularly.
- Add a custom domain and verify SEO, privacy, accessibility and legal pages.
- Never put passwords, API keys or private credentials in frontend files.

## Project structure
- `src/main.jsx` — page, sample stories, category filtering, search and article view.
- `src/styles.css` — responsive visual design.
- `index.html` — title, description and font loading.
