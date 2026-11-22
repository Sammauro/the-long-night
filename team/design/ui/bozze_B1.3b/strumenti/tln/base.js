// TLN · interfaccia di combattimento · base comune a ogni direzione (A "Il Rosario", B "Il Registro").
// Token di colore e tipografia come variabili CSS, misure per formato, icone, sigilli dei nemici.
// Le direzioni cambiano solo il layout (layout_A.js): token e componenti restano gli stessi.
'use strict';
const L = require('../../../strumenti/lib'); // icone, sigilli e figure segnaposto del B1.3a

const FONTS = L.FONTS; // IM Fell English (titoli) + Alegreya Sans (tutto ciò che si legge in fretta)

// Formati: telefono orizzontale (primario) e desktop. Le misure dei componenti leggono queste variabili.
const FORMATI = {
  tel: { nome: 'telefono', w: 844, h: 390 },
  desk: { nome: 'desktop', w: 1400, h: 850 },
};

const TOKENS = `
:root{
  /* palette CLAUDE.md §7 (nomi del mondo) */
  --notte:#151519; --scheda:#16141c; --pietra:#1c1a24; --filo:#2e2a3e;
  --osso:#e8e0d0; --cenere:#9a90a8; --oro:#c9a84c; --sangue:#b84040; --scudo:#4a8fbd;
  /* estensioni motivate (SPEC §3) */
  --sangue-vivo:#e2705f;      /* rosso per testo piccolo su fondo scuro */
  --oro-cupo:#7d6526;         /* oro ossidato: filo del rosario, bordi */
  --pergamena:#d9caa3;        /* l'unica superficie chiara: la Sequenza */
  --pergamena-ombra:#bfae86;
  --inchiostro:#2a2017;       /* inchiostro su pergamena */
  --inchiostro-tenue:#5e5040; /* esito non scelto: leggibile (4,7:1) ma senza anello */
  --inchiostro-rosso:#8b1e17; /* minaccia scritta sulla pergamena (5,7:1) */
  --cera:#7e231c; --cera-luce:#a8382c; --cera-testo:#f6e2d8; /* sigilli di cera dei dadi nemici */
  --carta-ombra:#211e26;      /* carte in mano: carta in ombra, inchiostro chiaro */
  --carta-ombra-2:#2a2630;
  --vigore:#e8e0d0; --fuoco:#e58a45; --terrore:#a68ae0;
  --fuoco-inch:#a4471a; --terrore-inch:#5a3d9a; --vigore-inch:#3b2f22;
  --f-titolo:'IM Fell English', 'Lora', Georgia, serif;
  --f-testo:'Alegreya Sans', 'Inter', system-ui, sans-serif;
  /* scala tipografica, telefono */
  --t12:12px; --t13:13px; --t14:14px; --t16:16px; --t17:17px; --t20:20px; --t28:28px;
  --tocco:44px; --dado:48px; --dado-n:44px;
}
.fmt-desk{ --t12:14px; --t13:15px; --t14:16px; --t16:19px; --t17:20px; --t20:24px; --t28:40px; --tocco:48px; --dado:72px; --dado-n:66px; }
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#0c0b0e}
body{font-family:var(--f-testo);font-variant-numeric:lining-nums tabular-nums;color:var(--osso);-webkit-font-smoothing:antialiased}
*{font-variant-numeric:lining-nums!important}
.palco{position:relative;overflow:hidden;background:var(--notte);margin:0 auto}
.fmt-tel.palco{width:844px;height:390px}
.fmt-desk.palco{width:1400px;height:850px}
.ico{display:inline-block;width:1em;height:1em;vertical-align:-0.14em;fill:currentColor;flex:none}
button{font-family:inherit;color:inherit;cursor:pointer}
:focus-visible{outline:2px solid var(--oro);outline-offset:2px}
@media (prefers-reduced-motion: reduce){ *{transition:none!important;animation:none!important} }
`;

const ICONS_EXTRA = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="i-morso" viewBox="0 0 24 24"><path d="M3 7c2.5 0 3 3 4.5 3S10 7 12 7s3 3 4.5 3S19 7 21 7v3c-1.5 0-2.2 3-4.5 3S14 10 12 10s-2.2 3-4.5 3S4.5 10 3 10z"/><path d="M5 15l1.6 4 1.6-4zM10.4 15l1.6 4.5 1.6-4.5zM15.8 15l1.6 4 1.6-4z"/></symbol>
<symbol id="i-stordito" viewBox="0 0 24 24"><path d="M12 3l1.6 4.2 4.4.3-3.4 2.8 1.1 4.3L12 12.2 8.3 14.6l1.1-4.3L6 7.5l4.4-.3z"/><path d="M4 18.5c3-2 13-2 16 0l-.8 1.6c-3-1.6-11.4-1.6-14.4 0z"/></symbol>
<symbol id="i-vuln" viewBox="0 0 24 24"><path d="M12 2.2l8.2 3v6.1c0 5.2-3.4 9-8.2 10.6-4.8-1.6-8.2-5.4-8.2-10.6V5.2z" fill-opacity=".35"/><path d="M13.4 4.5l-3 6.5h3l-2.6 8.5 6-10h-3.3l2.4-5z"/></symbol>
<symbol id="i-contra" viewBox="0 0 24 24"><path d="M4 6h10l-3-3 1.4-1.4L18 7.2l-5.6 5.6L11 11.4l3-3H4z"/><path d="M20 18H10l3 3-1.4 1.4L6 16.8l5.6-5.6 1.4 1.4-3 3h10z"/></symbol>
<symbol id="i-candela" viewBox="0 0 24 24"><path d="M9 9h6v13H9z"/><path d="M12 1.5c1.6 2.3 2.6 3.7 2.6 5a2.6 2.6 0 0 1-5.2 0c0-1.3 1-2.7 2.6-5z"/></symbol>
<symbol id="i-chiudi" viewBox="0 0 24 24"><path d="M5.6 4.2L12 10.6l6.4-6.4 1.4 1.4-6.4 6.4 6.4 6.4-1.4 1.4-6.4-6.4-6.4 6.4-1.4-1.4 6.4-6.4-6.4-6.4z"/></symbol>
</defs></svg>`;

const ICONS = L.ICONS + ICONS_EXTRA;
const ico = L.ico;
const TIPO_ICO = { vigore: 'forza', fuoco: 'fuoco', terrore: 'presagio', forza: 'forza', presagio: 'presagio' };
const NOME_TIPO = { vigore: 'Vigore', fuoco: 'Fuoco', terrore: 'Terrore' };
const SCARTO = { vigore: '+1 PM', fuoco: '+1 Luce', terrore: '+1 PT' };
const AZ_ICO = { orda: 'artigli', morso: 'morso', incassare: 'scudo' };
const AZ_BREVE = { orda: 'Orda', morso: 'Morso', incassare: 'Incassare' };

function sigillo(id, size, cls) { return L.sigillo(id, size, { cls: cls || '' }); }

function pagina(titolo, fmt, corpo, cssExtra) {
  const F = FORMATI[fmt];
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=${F.w}">
<title>${titolo}</title>${FONTS}
<style>${TOKENS}${cssExtra}
.didascalia{width:${F.w}px;margin:16px auto 6px;font:500 14px var(--f-testo);color:#9a90a8}
body.solo .didascalia{display:none} body.solo .palco{display:none} body.solo .palco.vis{display:block}
</style></head><body>
${ICONS}
${corpo}
<script>(function(){var q=new URLSearchParams(location.search).get('stato');if(q){document.body.classList.add('solo');var e=document.getElementById(q);if(e)e.classList.add('vis');}})();</script>
</body></html>`;
}

module.exports = { FORMATI, TOKENS, ICONS, ico, sigillo, TIPO_ICO, NOME_TIPO, SCARTO, AZ_ICO, AZ_BREVE, pagina, hexPoly: L.hexPoly, svgPerso: L.svgPerso };
