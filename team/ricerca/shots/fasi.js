// Schermate per fase (B1.2a). Uso: server su 8765, poi NODE_PATH=$(npm root -g) node team/ricerca/shots/fasi.js team/ricerca/shots
const { chromium } = require('playwright');
const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const views = [{ n: 'phone', w: 844, h: 390, dpr: 2, touch: true }, { n: 'desk', w: 1400, h: 850, dpr: 1 }];
  for (const v of views) {
    const ctx = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dpr, hasTouch: !!v.touch, isMobile: !!v.touch });
    const p = await ctx.newPage();
    await p.route(/cdnjs.*three/, r => r.abort());
    await p.goto('http://127.0.0.1:8765/index.html?seed=7&room=r1'); await p.waitForTimeout(2500);
    const skip = p.getByText(/Salta il tutorial/i).first();
    if (await skip.count()) { await skip.click(); await p.waitForTimeout(2500); }
    const shot = async (n) => { await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/${v.n}_${n}.png` }); };
    const S = (c) => p.evaluate((c) => TLN.ui.send(c), c);
    const G = () => p.evaluate(() => { const G = TLN.ui.st.G; return { phase: G.phase, turn: G.turn, seq: G.seq.map(d => ({ uid: d.uid, kind: d.kind, owner: d.owner, state: d.state, value: d.value })), res: G.res && { cursor: G.res.cursor, active: G.res.active, pool: G.res.pool }, hand: G.hand.map(h => h.uid + ':' + h.id) }; });
    let g = await G();
    // Selezione: tieni d8, un d6, un d4
    const pick = []; const seen = {};
    g.seq.filter(d => d.owner === 'P').forEach(d => { if (!seen[d.kind]) { seen[d.kind] = 1; pick.push(d.uid); } });
    for (const u of pick) { await S({ type: 'SEL_TOGGLE', die: u }); }
    await shot('01_selezione_tenuti');
    await S({ type: 'SEL_CONFIRM' }); await p.waitForTimeout(1500);
    await shot('02_risoluzione_finestra');
    // anteprima dado nemico: tocca il primo dado nemico pendente
    g = await G();
    const ai = g.seq.find(d => d.kind === 'ai' && d.state === 'pending');
    const dieEl = p.locator('#sequence .die, #seq .die, .seq .die').first();
    await S({ type: 'INSPECT_DIE', die: ai.uid }).catch(()=>{});
    await shot('03_anteprima_dado_nemico');
    // avanza fino a un dado giocatore attivo
    for (let i = 0; i < 12; i++) {
      g = await G(); if (g.phase !== 'RISOLUZIONE' || (g.res && g.res.active)) break;
      await S({ type: 'ADVANCE' }); await p.waitForTimeout(1800);
    }
    await shot('04_dado_attivo');
    g = await G();
    // apri una carta non gratuita
    const opened = await p.evaluate(() => { const G = TLN.ui.st.G, E = TLN.engine; for (const h of G.hand) { if (!E.check(G, { type: 'OPEN_CARD', card: h.uid })) { TLN.ui.send({ type: 'OPEN_CARD', card: h.uid }); return h.id; } } return null; });
    await shot('05_carta_aperta_' + opened);
    if (opened) await S({ type: 'CANCEL_CARD' });
    // vai a fine turno 1 → Fine Turno del turno 2
    for (let i = 0; i < 30; i++) {
      g = await G(); if (g.phase !== 'RISOLUZIONE') break;
      await S({ type: 'ADVANCE' }); await p.waitForTimeout(1500);
    }
    await p.waitForTimeout(1500);
    g = await G();
    await shot('06_' + g.phase.toLowerCase() + '_t' + g.turn);
    console.log(v.n, 'fase finale', g.phase, g.turn, 'carta', opened);
    await ctx.close();
  }
  await b.close();
})();
