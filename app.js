async function load() {
  const statusEl = document.getElementById('status');
  const gridEl = document.getElementById('app-grid');
  const searchEl = document.getElementById('search');
  const banner = document.getElementById('setup-banner');

  let config;
  try {
    config = await (await fetch('apps.json', { cache: 'no-store' })).json();
  } catch {
    statusEl.textContent = 'Could not load apps.json';
    return;
  }

  document.getElementById('site-title').textContent = config.siteTitle || 'My Apps';
  document.getElementById('site-subtitle').textContent = config.siteSubtitle || '';
  const owner = config.owner || 'ChrisStathakis';
  const repo = config.defaultRepo || 'christos_page';
  document.getElementById('github-link').href = `https://github.com/${owner}/${repo}`;

  const fmtSize = b => {
    if (b == null) return '—';
    const mb = b / 1024 / 1024;
    return mb >= 100 ? `${mb.toFixed(0)} MB` : `${mb.toFixed(1)} MB`;
  };
  const fmtDate = s => { try { return new Date(s).toLocaleDateString(); } catch { return '—'; } };

  let releases = null;
  try {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=50`);
    if (!r.ok) throw new Error(r.status);
    releases = (await r.json()).filter(x => !x.draft);
  } catch {
    releases = null;
  }

  // Optional curated apps on top of auto-listed releases
  const curated = (config.apps || []).filter(a => a && a.name);

  function card({ icon, title, desc, version, date, total, assetsHtml, mainDl, allUrl }) {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div class="card-top"><div class="card-icon">${icon}</div><h2>${title}</h2></div>
      <p class="card-desc">${desc}</p>
      <div class="meta"><span>Version <strong>${version}</strong></span><span>Updated <strong>${date}</strong></span><span>Total <strong>${total}</strong></span></div>
      ${assetsHtml}
      <div class="card-actions"><a class="btn" href="${mainDl}">Download</a><a class="btn secondary" href="${allUrl}" target="_blank" rel="noopener">Details</a></div>`;
    return el;
  }

  function assetsList(rel) {
    if (!rel.assets || !rel.assets.length) return `<div class="assets"><div class="asset"><span>No files in this release</span></div></div>`;
    const sorted = [...rel.assets].sort((a, b) => {
      const s = n => /\.(exe|msi)$/i.test(n) ? 0 : /\.(zip|apk)$/i.test(n) ? 1 : 2;
      return s(a.name) - s(b.name);
    });
    return '<div class="assets">' + sorted.map(a =>
      `<div class="asset"><span>${a.name} · ${fmtSize(a.size)} · ${a.download_count} downloads</span><a href="${a.browser_download_url}">Download</a></div>`
    ).join('') + '</div>';
  }

  function render(filter = '') {
    gridEl.innerHTML = '';
    const q = filter.toLowerCase();
    let n = 0;

    // 1. curated apps (match by tagPrefix if given)
    for (const app of curated) {
      if (q && !(app.name.toLowerCase().includes(q) || (app.description || '').toLowerCase().includes(q))) continue;
      const rel = app.tagPrefix && releases
        ? releases.find(r => r.tag_name.startsWith(app.tagPrefix))
        : releases && releases[0];
      const total = rel ? fmtSize(rel.assets.reduce((s, a) => s + (a.size || 0), 0)) : '—';
      gridEl.appendChild(card({
        icon: app.icon || '📦', title: app.name, desc: app.description || '',
        version: rel ? rel.tag_name : 'no release yet', date: rel ? fmtDate(rel.published_at) : '—',
        total, assetsHtml: rel ? assetsList(rel) : '<div class="assets"><div class="asset"><span>No files uploaded yet</span></div></div>',
        mainDl: rel && rel.assets.length ? rel.assets[0].browser_download_url : rel ? rel.html_url : '#',
        allUrl: rel ? rel.html_url : `https://github.com/${owner}/${repo}/releases`
      }));
      n++;
    }

    // 2. auto-list every release as its own card (zero config)
    if (releases) {
      for (const rel of releases) {
        // skip if already shown via curated match
        if (curated.some(a => a.tagPrefix && rel.tag_name.startsWith(a.tagPrefix))) continue;
        if (q && !(rel.tag_name.toLowerCase().includes(q) || (rel.name || '').toLowerCase().includes(q))) continue;
        const total = fmtSize(rel.assets.reduce((s, a) => s + (a.size || 0), 0));
        gridEl.appendChild(card({
          icon: '📦', title: rel.name || rel.tag_name, desc: (rel.body || 'No notes.').split('\n')[0].slice(0, 140),
          version: rel.tag_name, date: fmtDate(rel.published_at), total,
          assetsHtml: assetsList(rel),
          mainDl: rel.assets.length ? rel.assets[0].browser_download_url : rel.html_url,
          allUrl: rel.html_url
        }));
        n++;
      }
    }

    if (releases === null) {
      statusEl.textContent = 'Could not reach GitHub Releases API.';
      banner.hidden = false;
      banner.innerHTML = `Repo <b>${owner}/${repo}</b> not found, private, or no releases yet. To add a file: <b>GitHub → Releases → Draft new release → tag v1.0.0 → attach your .exe/.zip (10–200 MB OK) → Publish</b>. It appears here automatically.`;
    } else if (!releases.length && !curated.length) {
      statusEl.textContent = 'No releases yet.';
      banner.hidden = false;
      banner.innerHTML = `No install files yet. Add your first one: <b>GitHub → Releases → Draft new release → tag v1.0.0 → attach your .exe/.zip (10–200 MB OK) → Publish</b>. It appears here automatically — no code changes needed.`;
    } else {
      banner.hidden = true;
      statusEl.textContent = `${n} item${n === 1 ? '' : 's'} — live from GitHub Releases`;
    }
  }

  searchEl.addEventListener('input', e => render(e.target.value));
  render('');
}

load();
