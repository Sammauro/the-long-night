// Serve i font Google dai pacchetti @fontsource quando la rete non arriva a fonts.googleapis.com.
// Cerca i pacchetti in FONTSOURCE_DIR (o node_modules accanto) ; se mancano lascia passare la richiesta.
'use strict';
const fs = require('fs');
const path = require('path');

function findDir() {
  const cands = [process.env.FONTSOURCE_DIR, path.join(__dirname, 'node_modules'), path.join(process.cwd(), 'node_modules')].filter(Boolean);
  for (const c of cands) if (fs.existsSync(path.join(c, '@fontsource', 'alegreya-sans'))) return c;
  return null;
}

function css(dir) {
  const face = (fam, pkg, w, style) => {
    const f = path.join(dir, '@fontsource', pkg, 'files', `${pkg}-latin-${w}-${style}.woff2`);
    if (!fs.existsSync(f)) return '';
    return `@font-face{font-family:'${fam}';font-style:${style};font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format('woff2');}`;
  };
  return [400, 500, 700, 800].map(w => face('Alegreya Sans', 'alegreya-sans', w, 'normal')).join('') +
    face('Alegreya Sans', 'alegreya-sans', 400, 'italic') + face('Alegreya Sans', 'alegreya-sans', 500, 'italic') +
    face('IM Fell English', 'im-fell-english', 400, 'normal') + face('IM Fell English', 'im-fell-english', 400, 'italic');
}

async function fontRoute(ctx) {
  const dir = findDir();
  if (!dir) return false;
  const body = css(dir);
  await ctx.route(/fonts\.googleapis\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body }));
  await ctx.route(/fonts\.gstatic\.com/, r => r.abort());
  return true;
}

module.exports = { fontRoute };
