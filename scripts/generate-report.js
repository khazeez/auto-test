#!/usr/bin/env node
// Pemakaian: node scripts/generate-report.js <folder-report> [--env Dev]
// Membaca newman-summary.json, k6-summary.json dan file JSON tiap scenario, lalu menulis index.html.
import fs from 'fs';
import path from 'path';

const dir = path.resolve(process.argv[2] || '.');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const envName = arg('env', '-');
const read = (f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return null; } };
const has = (f) => fs.existsSync(path.join(dir, f));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ms = (v) => (v == null || isNaN(v) ? '-' : v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)} s` : `${Math.round(v)} ms`);
const dur = (v) => { if (v == null || isNaN(v)) return '-'; const s = Math.round(v / 1000), m = Math.floor(s / 60); return m ? `${m}m ${s % 60}s` : `${s}s`; };
const n = (v) => (v == null || isNaN(v) ? '-' : Number(v).toLocaleString('id-ID'));
const badge = (ok, t1 = 'Passed', t0 = 'Failed') => `<span class="pill ${ok ? 'ok' : 'bad'}">${ok ? t1 : t0}</span>`;
const stat = (label, val) => `<div class="stat"><span>${esc(label)}</span><b>${esc(val)}</b></div>`;
const link = (f, text) => (has(f) ? `<a class="btn" href="${esc(f)}" target="_blank">${text}</a>` : '');

function newmanCard(r) {
  const j = read(`newman-${r.slug}.json`);
  const ok = r.code === 0 && r.setupOk !== false;
  const a = j?.run?.stats?.assertions ?? {};
  const total = a.total ?? r.total ?? 0, failed = a.failed ?? r.failed ?? 0;
  const t = j?.run?.timings;
  const execs = j?.run?.executions ?? [];
  const fails = execs.flatMap((e) => (e.assertions || []).filter((x) => x.error).map((x) => ({ req: e.item?.name, name: x.assertion, msg: x.error.message })));
  const pct = total ? Math.round(((total - failed) / total) * 100) : 0;
  const rows = execs.map((e) => {
    const as = e.assertions || [], bad = as.filter((x) => x.error).length;
    return `<tr><td>${esc(e.item?.name)}</td><td>${esc(e.response?.code ?? '-')}</td><td>${ms(e.response?.responseTime)}</td><td class="${bad ? 'tb' : 'to'}">${as.length - bad}/${as.length}</td></tr>`;
  }).join('');
  return `<article class="card" id="newman-${esc(r.slug)}">
  <header><h3>${esc(r.name)}</h3>${badge(ok)}</header>
  ${r.setupOk === false ? '<p class="note bad">Setup gagal, test tidak dijalankan.</p>' : ''}
  <div class="bar" title="${pct}% assertion lolos"><i style="width:${pct}%"></i></div>
  <div class="stats">${stat('Assertion', `${total - failed}/${total}`)}${stat('Request', n(j?.run?.stats?.requests?.total))}${stat('Durasi', t ? dur(t.completed - t.started) : '-')}${stat('Gagal', n(failed))}</div>
  ${fails.length ? `<details open><summary>Assertion gagal (${fails.length})</summary><ul class="fails">${fails.map((f) => `<li><b>${esc(f.req)}</b><br>${esc(f.name)}<small>${esc(f.msg)}</small></li>`).join('')}</ul></details>` : ''}
  ${rows ? `<details><summary>Semua request (${execs.length})</summary><div class="scroll"><table><thead><tr><th>Request</th><th>Status</th><th>Waktu</th><th>Assertion</th></tr></thead><tbody>${rows}</tbody></table></div></details>` : ''}
  <footer>${link(`newman-${r.slug}.html`, 'Detail lengkap')}</footer></article>`;
}

function k6Card(r) {
  const j = read(`k6-${r.slug}.json`);
  const m = j?.metrics ?? {};
  const v = (k) => m[k]?.values ?? m[k] ?? {};
  const d = v('http_req_duration'), q = v('http_reqs'), f = v('http_req_failed');
  const thr = Object.entries(m).flatMap(([name, x]) => Object.entries(x.thresholds ?? {}).filter(([, t]) => t && typeof t === 'object').map(([expr, t]) => ({ name, expr, ok: t.ok })));
  const err = f.rate ?? f.value;
  return `<article class="card" id="k6-${esc(r.slug)}">
  <header><h3>${esc(r.name)}</h3>${badge(r.code === 0)}</header>
  <div class="stats">${stat('p95', ms(d['p(95)'] ?? r.p95))}${stat('Rata-rata', ms(d.avg))}${stat('Maks', ms(d.max))}${stat('Error', err == null ? (r.errorRate != null ? `${r.errorRate}%` : '-') : `${(err * 100).toFixed(1)}%`)}${stat('Request', n(q.count))}${stat('Req/detik', q.rate == null ? '-' : q.rate.toFixed(1))}${stat('VU maks', n(v('vus_max').max ?? v('vus_max').value))}${stat('Durasi', dur(j?.state?.testRunDurationMs))}</div>
  ${thr.length ? `<details ${r.code === 0 ? '' : 'open'}><summary>Threshold (${thr.filter((t) => t.ok).length}/${thr.length} lolos)</summary><ul class="thr">${thr.map((t) => `<li class="${t.ok ? 'to' : 'tb'}">${t.ok ? 'Lolos' : 'Gagal'}: ${esc(t.name)} ${esc(t.expr)}</li>`).join('')}</ul></details>` : ''}
  <footer>${link(`k6-${r.slug}.html`, 'Detail lengkap')}</footer></article>`;
}

const nm = read('newman-summary.json'), k6 = read('k6-summary.json');
const nmR = nm?.results ?? [], k6R = k6?.results ?? [];
const nmOk = nmR.filter((r) => r.code === 0 && r.setupOk !== false).length;
const k6Ok = k6R.filter((r) => r.code === 0).length;
const allOk = nmOk === nmR.length && k6Ok === k6R.length && !nm?.teardownFailed && (nmR.length + k6R.length) > 0;
const panel = (id, list, cards) => `<section class="panel" id="panel-${id}" role="tabpanel">${list.length ? `<div class="grid">${cards}</div>` : '<p class="empty">Tidak dijalankan pada run ini.</p>'}</section>`;
const tab = (id, title, ok, list) => `<button class="tab" role="tab" data-tab="${id}"><i class="dot ${list.length ? (ok === list.length ? 'ok' : 'bad') : 'off'}"></i>${title}<em>${list.length ? `${ok}/${list.length}` : '-'}</em></button>`;
const defTab = k6R.length && (k6Ok < k6R.length || nmOk === nmR.length) ? 'k6' : nmR.length ? 'newman' : 'k6';

const css = `:root{--bg:#f6f7f9;--card:#fff;--text:#16181d;--mute:#667085;--line:#e4e7ec;--ok:#12805c;--okb:#e6f6ef;--bad:#c0262d;--badb:#fdeaea;--acc:#3b5bdb}
@media(prefers-color-scheme:dark){:root{--bg:#0f1115;--card:#171a21;--text:#e8eaef;--mute:#9aa3b2;--line:#2a2f3a;--ok:#4cc38a;--okb:#10291f;--bad:#ff7b80;--badb:#321517;--acc:#8ea2ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:1120px;margin:0 auto;padding:32px 20px 64px}
.top{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;margin-bottom:24px}
h1{font-size:26px;margin:0 0 4px;font-weight:600}.meta{color:var(--mute);font-size:14px}
.tabs{display:flex;gap:6px;border-bottom:1px solid var(--line);margin-bottom:20px;overflow-x:auto}
.tab{appearance:none;background:none;border:0;border-bottom:2px solid transparent;margin-bottom:-1px;padding:10px 16px;font:inherit;font-weight:600;color:var(--mute);cursor:pointer;display:flex;align-items:center;gap:8px;white-space:nowrap}
.tab em{font-style:normal;font-size:12px;padding:1px 8px;border-radius:999px;background:var(--line);color:var(--text)}
.tab[aria-selected=true]{color:var(--text);border-bottom-color:var(--acc)}
.dot{width:8px;height:8px;border-radius:50%;background:var(--mute)}.dot.ok{background:var(--ok)}.dot.bad{background:var(--bad)}
.panel[hidden]{display:none}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:36px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px}.kpi span{color:var(--mute);font-size:13px}.kpi b{display:block;font-size:26px;font-weight:600;margin-top:2px}
.sh{display:flex;align-items:center;gap:12px;margin:8px 0 14px}h2{font-size:20px;margin:0;font-weight:600}.count{color:var(--mute);font-size:14px}
section{margin-bottom:40px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(480px,1fr));gap:16px}
@media(max-width:560px){.grid{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:12px;scroll-margin-top:16px}
.card header{display:flex;justify-content:space-between;align-items:center;gap:8px}h3{font-size:16px;margin:0;font-weight:600}
.pill{padding:3px 12px;border-radius:999px;font-size:13px;font-weight:600}.pill.ok{background:var(--okb);color:var(--ok)}.pill.bad{background:var(--badb);color:var(--bad)}
.bar{height:8px;border-radius:999px;background:var(--badb);overflow:hidden}.bar i{display:block;height:100%;background:var(--ok)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:10px}.stat span{display:block;color:var(--mute);font-size:12px}.stat b{font-size:17px;font-weight:600}
details{border-top:1px solid var(--line);padding-top:10px}summary{cursor:pointer;font-weight:600;font-size:14px}
.scroll{overflow-x:auto;max-height:320px;overflow-y:auto;margin-top:8px}table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);white-space:nowrap}td:first-child{white-space:normal}th{color:var(--mute);font-weight:500}
.to{color:var(--ok)}.tb{color:var(--bad);font-weight:600}.fails,.thr{list-style:none;padding:0;margin:8px 0 0;display:grid;gap:8px;font-size:13px}.fails li{background:var(--badb);border-radius:8px;padding:8px 10px}.fails small{display:block;color:var(--mute);margin-top:2px}
.note{margin:0;padding:8px 10px;border-radius:8px;font-size:13px}.note.bad{background:var(--badb);color:var(--bad)}
footer{margin-top:auto}.btn{display:inline-block;padding:6px 14px;border-radius:8px;border:1px solid var(--line);color:var(--acc);text-decoration:none;font-size:13px;font-weight:600}.btn:hover{border-color:var(--acc)}
.empty{color:var(--mute)}.warn{background:var(--badb);color:var(--bad);padding:10px 14px;border-radius:10px;margin-bottom:20px;font-size:14px}`;

const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Test report ${esc(path.basename(dir))}</title><style>${css}</style></head><body><div class="wrap">
<div class="top"><div><h1>Lawang test report</h1><div class="meta">Run Environment ${esc(envName)} &middot; Dibuat ${esc(new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }))} WIB</div></div></div>
${nm?.teardownFailed ? '<div class="warn">Teardown gagal: cek config server (IP blacklist, security header, CORS).</div>' : ''}
<div class="kpis"><div class="kpi"><span>Status keseluruhan</span><b>${badge(allOk)}</b></div><div class="kpi"><span>K6</span><b>${k6Ok}/${k6R.length}</b></div><div class="kpi"><span>Newman</span><b>${nmOk}/${nmR.length}</b></div></div>
<div class="tabs" role="tablist" data-default="${defTab}">${tab('k6', 'Report K6', k6Ok, k6R)}${tab('newman', 'Report Newman', nmOk, nmR)}</div>
${panel('k6', k6R, k6R.map(k6Card).join(''))}
${panel('newman', nmR, nmR.map(newmanCard).join(''))}
</div><script>
(function(){var tabs=[].slice.call(document.querySelectorAll('.tab')),panels=[].slice.call(document.querySelectorAll('.panel'));
function show(id){tabs.forEach(function(t){t.setAttribute('aria-selected',t.dataset.tab===id);});panels.forEach(function(p){p.hidden=p.id!=='panel-'+id;});}
tabs.forEach(function(t){t.addEventListener('click',function(){show(t.dataset.tab);try{history.replaceState(null,'','#'+t.dataset.tab);}catch(e){}});});
var h=location.hash.slice(1),card=h?document.getElementById(h):null,pn=card&&card.closest('.panel'),id=pn?pn.id.replace('panel-',''):(h==='k6'||h==='newman'?h:document.querySelector('.tabs').dataset.default);
show(id);if(card)card.scrollIntoView();})();
</script></body></html>`;

fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log(`Dashboard dibuat: ${path.join(dir, 'index.html')}`);
