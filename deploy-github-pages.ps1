param(
  [string]$Branch = "gh-pages"
)

Write-Host "Preparing GitHub Pages deployment to branch '$Branch'..." -ForegroundColor Cyan

if (-not (Test-Path ".git")) {
  Write-Error "This folder is not a git repository. Run 'git init' and add a remote first."
  exit 1
}

$remote = git remote
if (-not $remote) {
  Write-Error "No git remote found. Add one with 'git remote add origin <URL>' and try again."
  exit 1
}

Write-Host "Building static content (no build step, using raw files)..." -ForegroundColor Cyan

git add index.html styles.css js design.txt deploy-github-pages.ps1 README.md 2>$null

git commit -m "Deploy to GitHub Pages" --allow-empty

git push -u origin HEAD:$Branch

Write-Host ""
Write-Host "Deployment pushed to '$Branch'." -ForegroundColor Green
Write-Host "Now in GitHub repository settings, enable GitHub Pages for source '$Branch'." -ForegroundColor Yellow

