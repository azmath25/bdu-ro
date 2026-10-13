/* Shared helpers for all pages. */
(() => {
  const BDU = window.BDU = {};
  const MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr'];
  const pad = n => String(n).padStart(2, '0');

  BDU.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  BDU.parseDate = iso => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  BDU.fmtDate = iso => {
    const d = BDU.parseDate(iso);
    return d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '';
  };
  BDU.dateParts = iso => {
    const d = BDU.parseDate(iso);
    return d ? { day: d.getDate(), month: MONTHS[d.getMonth()], year: d.getFullYear() } : { day: '', month: '', year: '' };
  };
  BDU.todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  BDU.status = iso => {
    const t = BDU.todayISO();
    return iso > t ? 'upcoming' : iso === t ? 'today' : 'past';
  };

  /* Loads data/<name>.json. Always returns an array. */
  BDU.load = async name => {
    const res = await fetch(`data/${name}.json?_=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  };

  /* Only allow http(s) links or files stored in /files — anything else becomes "#". */
  BDU.href = u => {
    u = String(u || '').trim();
    if (/^https?:\/\//i.test(u)) return u;
    if (/^files\//.test(u)) return u.split('/').map(encodeURIComponent).join('/');
    return '#';
  };

  /* Tiny text-to-HTML for blog posts: paragraphs, "## heading", "- list", "1. list", **bold**.
     $...$ and $$...$$ are left untouched for KaTeX. */
  BDU.renderBody = text => {
    const inline = s => BDU.esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return String(text || '').replace(/\r/g, '').split(/\n{2,}/).map(block => {
      let lines = block.split('\n').map(l => l.trimEnd()).filter(l => l.trim());
      if (!lines.length) return '';
      let out = '';
      if (/^##\s+/.test(lines[0])) {
        out += `<h3>${inline(lines[0].replace(/^##\s+/, ''))}</h3>`;
        lines = lines.slice(1);
        if (!lines.length) return out;
      }
      if (lines.every(l => /^[-*]\s+/.test(l))) return out + '<ul>' + lines.map(l => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`).join('') + '</ul>';
      if (lines.every(l => /^\d+[.)]\s+/.test(l))) return out + '<ol>' + lines.map(l => `<li>${inline(l.replace(/^\d+[.)]\s+/, ''))}</li>`).join('') + '</ol>';
      return out + '<p>' + lines.map(inline).join('<br>') + '</p>';
    }).join('\n');
  };

  /* Loads the bundled KaTeX (katex/ folder) only when a post actually contains math. */
  let katexReady;
  BDU.typeset = el => {
    if (!/\$|\\\(/.test(el.textContent)) return;
    const KATEX = 'katex/';
    const addScript = src => new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s);
    });
    katexReady = katexReady || (async () => {
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = KATEX + 'katex.min.css'; document.head.appendChild(css);
      await addScript(KATEX + 'katex.min.js');
      await addScript(KATEX + 'auto-render.min.js');
    })();
    katexReady.then(() => window.renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    })).catch(() => { /* if loading fails, raw TeX stays visible */ });
  };

  /* Menu button on small screens. */
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.nav-toggle');
    const nav = document.getElementById('menu');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
})();
