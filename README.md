# Hebrew Calendar (Gregorian ↔ Hebrew, 5786-focused)

Static HTML/CSS/JS app that shows Gregorian and Hebrew month views side by side and exposes a few Hebrew calendar statistics.

## Running locally

- Open `index.html` directly in your browser (no server required).

You should see:
- A month/year selector at the top.
- Left panel: Gregorian month.
- Right panel: Hebrew dates and holiday labels for each day.

## Tests

If you have Node.js installed:

```bash
cd cursor_app
node tests/run-hebrew-core-tests.js
```

This runs a basic unit test suite for the Hebrew calendar core.

## Deploying to GitHub Pages

1. Create a **new GitHub repository** and point this folder at it:

   ```bash
   git init
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. From PowerShell in the project folder, run:

   ```powershell
   ./deploy-github-pages.ps1
   ```

   This pushes the current contents to the `gh-pages` branch.

3. In GitHub:
   - Go to **Settings → Pages**.
   - Set **Source** to the `gh-pages` branch.
   - Save. After a short delay, GitHub will give you the public URL of your calendar.

