# christos_page — app download site

Static GitHub Pages site for `ChrisStathakis`. Installers (10–200 MB) are **not** committed to git — they live in **GitHub Releases**, the page just links to them.

Live URL after setup:
- Project site: `https://chrisstathakis.github.io/christos_page/`
- Or user site if repo is named `ChrisStathakis.github.io`

## 1. Create the repo

1. GitHub → New repository → name `christos_page`, Public, no template.
2. Push this folder:
```powershell
cd C:\projects\christos_page
git init
git add .
git commit -m "download site"
git branch -M main
git remote add origin https://github.com/ChrisStathakis/christos_page.git
git push -u origin main
```

## 2. Enable Pages

Settings → Pages → Deploy from branch → `main` / `/ (root)` → Save. Wait ~1 min.

## 3. Publish an installer (10–200 MB OK)

Do **not** commit `.exe/.msi/.zip` to git. Instead:

1. GitHub repo → Releases → Draft new release
2. Tag: `<app-id>-vX.Y.Z` matching `tagPrefix` in `apps.json` (e.g. `my-cool-app-v1.0.0`)
3. Title: same as tag, add notes/changelog
4. Attach files under “Attach binaries” (up to ~2 GB per file, your 10–200 MB is fine)
5. Publish. The site fetches the Releases API and shows it within ~1 min (cached).

## 4. Add another app

Edit `apps.json`, add:
```json
{ "id": "cool-tool", "name": "Cool Tool", "description": "Does X.", "repo": null, "tagPrefix": "cool-tool-v", "icon": "⚡" }
```
`"repo": null` = use this same repo. Or set `"repo": "some-other-repo"` to pull releases from another repo owned by `ChrisStathakis`.

Then create releases in that repo with tags starting with `cool-tool-v`.

## Notes / limits

- GitHub blocks files >100 MB in git — that’s why releases are used.
- Releases: ~2 GB per file OK. Pages site: 1 GB max, 100 GB bandwidth/mo — fine for a link portal.
- API is unauthenticated (60 req/hr). With few apps this is fine.
- `.gitignore` blocks accidental `*.exe/*.msi/*.zip` commits.
