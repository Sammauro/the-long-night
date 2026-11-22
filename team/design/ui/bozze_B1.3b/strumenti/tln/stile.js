// CSS dei componenti. Le misure leggono le variabili di formato di base.js (--t12…--t28, --tocco, --dado).
'use strict';
const CSS = `
/* 1 · riga di orientamento */
.orienta{position:absolute;display:flex;align-items:center;gap:8px;padding:0 10px;border-bottom:1px solid var(--filo);background:#18161d;white-space:nowrap}
.orienta .turno{font-family:var(--f-titolo);font-size:var(--t16);color:var(--oro)}
.orienta .fase{font-family:var(--f-titolo);font-size:var(--t16)}
.orienta .istr{font-size:var(--t13);color:var(--osso);margin-left:6px;overflow:hidden;text-overflow:ellipsis}
.orienta.rifiuto .istr{color:var(--sangue-vivo)}
.orienta.buio{background:#100e13;border-bottom-color:#5a1a16}
.veglia{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:var(--t12)}
.veglia .posta{color:var(--cenere)}
.veglia.buio .v-buio{color:var(--sangue-vivo);font-weight:700}
.candela .cera{fill:#d9cfb6}.candela .arsa{fill:#3a3340}.candela .ora{fill:#f0d9a0}.candela .fiamma{fill:var(--oro)}

/* 2 · colonna sinistra */
.colonna-sx{position:absolute;padding:6px 8px 0 10px;border-right:1px solid var(--filo);background:var(--notte)}
.ris{display:flex;align-items:center;gap:4px;height:calc(var(--t17) + 5px);font-size:var(--t12);color:var(--cenere)}
.ris>.ico{width:calc(var(--t12) + 3px);height:calc(var(--t12) + 3px)}
.ris .l{min-width:2.2em}
.ris b{font-size:var(--t17);color:var(--osso);font-weight:800}
.ris .max{font-size:var(--t12);color:var(--cenere);font-weight:500}
.ris.hp>.ico{color:var(--sangue-vivo)}.ris.pt>.ico{color:var(--terrore)}.ris.luce>.ico,.ris.luce b{color:var(--oro)}
.ris.pericolo b{color:var(--sangue-vivo)}
.ris .salto{margin-left:auto;display:flex;align-items:center;gap:2px}
.ris .salto .l{min-width:0}.ris .salto .ico{width:12px;height:12px}.ris .salto b{font-size:var(--t14)}
.salto .l{display:none}.fmt-desk .salto .l{display:inline}
.delta{font-size:var(--t12);font-weight:800;padding:0 3px;margin-left:2px}
.delta.piu{color:#1b1409;background:var(--oro)}.delta.meno{color:#fff;background:var(--sangue)}
.stati-g{display:flex;flex-direction:column;gap:2px;margin:3px 0 2px}
.st{font-size:var(--t12);display:flex;align-items:center;gap:3px;line-height:1.1}
.st .ico{width:12px;height:12px}.st i{color:var(--cenere)}
.st.scudo .ico{color:#8cc0e6}.st.contra .ico{color:var(--oro)}.st.vuln{color:#f0a99d}.st.vuln .ico{color:var(--sangue-vivo)}.st.stun .ico{color:#d9c873}
.plancia .tit{font-family:var(--f-titolo);font-style:italic;font-size:var(--t13);color:var(--cenere)}
.nicchie{display:grid;grid-template-columns:repeat(2,var(--tocco));gap:3px;margin-top:2px}
.nicchia{position:relative;height:var(--tocco);border:1px dashed #4a4258;display:flex;align-items:center;justify-content:center;color:#6d6380}
.nicchia .n{position:absolute;left:3px;top:1px;font-size:var(--t12)}
.nicchia .tipo{width:14px;height:14px;position:absolute;right:3px;top:3px}
.nicchia.k-fuoco .tipo{color:var(--fuoco)}.nicchia.k-terrore .tipo{color:var(--terrore)}.nicchia.k-vigore .tipo{color:#cfc3a8}
.nicchia.piena{border:1px solid var(--oro-cupo);background:#211d17}
.nicchia.piena b{font-size:var(--t20);font-weight:800;color:var(--osso);margin-top:8px}
.nicchia.coperta{border:1px solid #6b5a3a;background:repeating-linear-gradient(115deg,#2a2419 0 5px,#221d15 5px 10px)}
.nicchia .costo-l{position:absolute;bottom:2px;left:0;right:0;text-align:center;font-size:var(--t12);font-weight:800;color:var(--oro)}
.nicchia.coperta.piena b{margin-top:-6px}
.nicchia.evid{outline:2px solid var(--oro);outline-offset:1px}
.nicchia.conflitto{outline:2px solid var(--sangue-vivo);outline-offset:1px}
.voci{list-style:none;margin-top:3px}
.voci li{font-size:var(--t12);line-height:1.15;margin-bottom:3px;color:var(--osso)}
.voci .vn b{color:var(--oro)}
.voci .vt{display:block;color:var(--cenere)}
.voci li.evid{outline:2px solid var(--oro);outline-offset:1px}
.voci li.esce .vt{color:#9fd18b}.voci li.resta .vt{color:#e7c37a}

/* 3 · cartiglio */
.cartiglio{position:absolute;display:flex;align-items:center;gap:8px;padding:0 8px 0 10px;background:#1a1720;border-bottom:1px solid var(--filo);border-left:3px solid var(--oro-cupo)}
.cartiglio .marca{font-family:var(--f-titolo);font-style:italic;font-size:var(--t13);color:var(--oro);flex:none}
.cartiglio .testo{flex:1;font-size:var(--t13);line-height:1.2;min-width:0}
.cartiglio .testo b{color:var(--osso)}
.cartiglio .testo .rosso{color:var(--sangue-vivo);font-weight:800}
.cartiglio .testo .tenue{color:var(--cenere)}
.cartiglio .testo .ico{width:13px;height:13px}
.cartiglio.guida{border-left-color:var(--terrore);background:#1d1826}
.cartiglio.guida .marca{color:var(--terrore)}
.cartiglio.esito{border-left-color:var(--sangue-vivo);background:#24151a}
.cartiglio.buio{border-left-color:var(--sangue-vivo);background:#1b1015}
.cartiglio .passi{display:flex;gap:4px;align-items:center;flex-wrap:nowrap}
.cartiglio .passo{font-size:var(--t12);padding:2px 5px;border:1px solid #3d3650;color:var(--cenere);white-space:nowrap}
.cartiglio .passo.fatto{color:#b7c9a8;border-color:#3e4a36}
.cartiglio .passo.ora{color:#1a140a;background:var(--oro);border-color:var(--oro);font-weight:700}
.secondario{flex:none;min-height:var(--tocco);min-width:var(--tocco);padding:2px 10px;background:#2a2630;border:1px solid #5a5068;font-size:var(--t13);font-weight:700;display:flex;flex-direction:column;justify-content:center;align-items:center;line-height:1.1}
.secondario small{font-size:var(--t12);font-weight:500;color:var(--cenere)}
.secondario.lieve{background:transparent;border-color:#3d3650;color:var(--cenere)}

/* 4 · mano: carta in ombra */
.mano{position:absolute;display:flex;flex-direction:column;gap:2px}
.striscia{position:relative;flex:1;display:flex;background:var(--carta-ombra);color:var(--osso);border-left:3px solid #3a3442;clip-path:polygon(0 0,100% 0,100% 100%,3px 100%,0 92%,2px 70%,0 45%,2px 20%)}
.striscia .corpo{flex:1;padding:2px 6px 0 7px;min-width:0}
.striscia h3{font-family:var(--f-titolo);font-weight:400;font-size:var(--t14);line-height:1.15;display:flex;align-items:center;gap:5px}
.striscia h3 .nome{white-space:nowrap}
.striscia .cd{margin-left:auto;font-family:var(--f-testo);font-size:var(--t12);font-weight:700;color:var(--cenere)}
.chip{font-family:var(--f-testo);font-size:var(--t12);font-weight:700;padding:0 4px;line-height:1.25;white-space:nowrap}
.chip.nuova{color:#1b1409;background:#d9caa3}
.chip.apri{color:#1b1409;background:var(--oro)}
.chip.no{color:#f2b8ad;border:1px solid #7a3a33}
.chip .ico{width:12px;height:12px}
.azione{font-size:var(--t12);line-height:1.2;font-weight:500;color:#ddd3c2}
.azione .ico{width:12px;height:12px}
.azione.intera{font-weight:500;margin-bottom:1px}
.passiva{font-size:var(--t12);font-style:italic;color:var(--cenere);line-height:1.15}
.costo{display:inline-flex;align-items:center;gap:1px;font-weight:800;padding:0 3px;margin-right:2px;border:1px solid #6e6278;line-height:1.1;color:var(--osso)}
.costo .ico{width:12px;height:12px}
.c-fuoco .ico{color:var(--fuoco)}.c-forza .ico{color:#e8dcc3}.c-presagio .ico{color:var(--terrore)}
.costo.gratis{font-weight:700;font-style:italic}
.costo.pt{color:var(--terrore);border-color:#5a4a80}
.matrice{width:72px;flex:none;border-left:1px dashed #4a4258;background:#1a171f;padding:2px 5px;font-size:var(--t12);line-height:1.2;position:relative;color:#d7cdbd}
.matrice .ico{width:12px;height:12px;color:var(--cenere)}
.matrice .eco-t{font-style:italic;color:var(--cenere);margin-left:2px}
.matrice .eco{display:block;font-weight:700}
.matrice .scelto{position:absolute;right:4px;bottom:2px;font-weight:800;color:#1b1409;background:var(--oro);padding:0 3px}
.striscia.apribile{border-left-color:var(--oro);background:#29241c}
.striscia.chiusa .corpo h3 .nome,.striscia.chiusa .azione{color:#a99fb6}
.striscia.chiusa .costo{border-color:#4a4258;color:#a99fb6}
.striscia.scarta{border-left-color:var(--oro);background:#29241c}
.striscia.scarta .matrice{background:#3a3020;border-left:1px solid var(--oro);color:var(--osso)}
.striscia.sel{outline:2px solid var(--oro);outline-offset:-2px}
.mano.fase-eco .azione,.mano.fase-eco .passiva{color:#9c92ab}
.mano.fase-eco .matrice{color:var(--osso)}
.fmt-desk .matrice{width:120px;padding:6px 8px}
.fmt-desk .striscia .corpo{padding:5px 10px 0 12px}

/* 5 · rosario sulla pergamena */
.rosario{position:absolute;background:radial-gradient(ellipse at 30% 20%,#e3d5b0 0,transparent 60%),radial-gradient(ellipse at 80% 90%,#cbb98e 0,transparent 55%),var(--pergamena);border-top:2px solid var(--inchiostro);color:var(--inchiostro)}
.rosario .capo{position:absolute;left:4px;top:0;bottom:0;width:var(--capo-w);display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:1px solid #a8966c}
.rosario .capo b{font-family:var(--f-titolo);font-size:var(--t28);font-weight:400;line-height:.9}
.rosario .capo span{font-size:var(--t12);font-style:italic}
.filo{position:absolute;left:var(--filo-x);right:var(--filo-dx);top:50%;height:2px;background:var(--oro-cupo)}
.perle{position:absolute;left:var(--perle-x);top:0;bottom:0;display:flex;gap:var(--perle-gap);align-items:stretch}
.perla{position:relative;width:var(--perla-w);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}
.perla .t-su,.perla .t-giu{font-size:var(--t12);line-height:1.1;min-height:calc(var(--t12) + 5px);white-space:nowrap;display:flex;align-items:center;padding:0 4px;border:1.5px solid transparent;border-radius:50%;font-weight:700}
.perla .tenue{color:var(--inchiostro-tenue);font-weight:500}
.perla .cerchio{border-color:var(--inchiostro);border-radius:50%/50%;font-weight:800}
.perla .cerchio.errore,.perla .errore{color:var(--inchiostro-rosso);border-color:var(--inchiostro-rosso)}
.perla .rosso{color:var(--inchiostro-rosso);font-weight:800}
.osso,.cera{position:relative;width:var(--dado);height:var(--dado);display:flex;align-items:center;justify-content:center}
.osso b,.cera b{font-size:var(--t28);font-weight:800;line-height:1}
.osso{background:radial-gradient(circle at 35% 30%,#fbf6ea,#e0d4b8);border:1.5px solid var(--inchiostro);border-radius:22%;color:var(--inchiostro)}
.osso .angolo,.cera .angolo{position:absolute;right:3px;top:3px;width:calc(var(--dado) * .27);height:calc(var(--dado) * .27)}
.k-fuoco .osso .angolo{color:var(--fuoco-inch)}.k-terrore .osso .angolo{color:var(--terrore-inch)}.k-vigore .osso .angolo{color:var(--vigore-inch)}
.mio.tenuto{transform:translateY(-4px)}
.mio.tenuto .osso{box-shadow:0 0 0 2px var(--pergamena),0 0 0 4px var(--oro-cupo)}
.mio.scartato{transform:translateY(5px)}
.mio.scartato .osso{background:repeating-linear-gradient(135deg,#cdbf9d 0 3px,#b9aa84 3px 6px);color:#5e5040;border-color:#7a6a50}
.ics{position:absolute;inset:4px;width:calc(100% - 8px);height:calc(100% - 8px);stroke:var(--inchiostro);stroke-width:1.1;fill:none;vector-effect:non-scaling-stroke;stroke-linecap:round}
.fmt-tel .ics{stroke-width:2.4}.fmt-desk .ics{stroke-width:3}
.mio.conflitto .osso{box-shadow:0 0 0 2px var(--pergamena),0 0 0 4px var(--inchiostro-rosso)}
.cera{width:var(--dado-n);height:var(--dado-n);background:radial-gradient(circle at 38% 32%,var(--cera-luce),var(--cera) 70%);border-radius:47% 53% 49% 51%/52% 46% 54% 48%;color:var(--cera-testo);box-shadow:inset 0 0 0 3px rgba(0,0,0,.18),0 1px 0 rgba(0,0,0,.25)}
.cera .angolo{color:#f0c3b8}
.nem:not(.colpisce) .cera{background:radial-gradient(circle at 38% 32%,#8c6d66,#5f4743 70%)}
.perla.risolto{opacity:.42}
.perla.risolto::after{content:'';position:absolute;left:18%;right:18%;top:50%;height:2px;background:var(--inchiostro);transform:rotate(-20deg)}
.perla.attivo .osso,.perla.attivo .cera{box-shadow:0 0 0 3px var(--pergamena),0 0 0 6px var(--oro),0 0 14px 6px rgba(201,168,76,.55)}
.perla.attivo{transform:translateY(-3px)}
.perla.spento .cera{background:#8f8574;filter:grayscale(1)}
.perla.spento .t-giu{color:var(--inchiostro-tenue)}
.tacche{display:flex;gap:3px}.tacche i{width:6px;height:12px;background:var(--inchiostro)}.tacche i.vuota{background:transparent;border:1px solid var(--inchiostro)}
.ago{width:4px;align-self:stretch;margin:6px 0;background:var(--inchiostro);position:relative}
.ago::before{content:'';position:absolute;top:-2px;left:-5px;border:7px solid transparent;border-top-color:var(--inchiostro)}
.rosario .fine{position:absolute;right:8px;top:6px;bottom:6px;width:var(--fine-w);display:flex;flex-direction:column;justify-content:flex-end;gap:4px}
.primario{width:100%;height:var(--prim-h);border:2px solid var(--inchiostro);background:var(--oro);color:#1a140a;font:700 var(--t17) var(--f-testo);display:flex;flex-direction:column;align-items:center;justify-content:center;clip-path:polygon(12px 0,100% 0,100% 100%,12px 100%,0 50%);line-height:1.15}
.primario small{font-size:var(--t12);font-weight:600}
.primario.spento{background:#b3a27b;color:#4a3f30;border-color:#8a7a58;height:var(--tocco);flex:none}
.motivo{font-size:var(--t12);line-height:1.2;color:#f6e2d8;background:var(--inchiostro-rosso);padding:3px 7px}
.motivo .ico{width:12px;height:12px}
.avviso{font-size:var(--t12);line-height:1.2;color:var(--inchiostro-rosso);font-weight:800;text-align:right}
.fmt-tel{--capo-w:34px;--filo-x:40px;--filo-dx:236px;--perle-x:42px;--perle-gap:2px;--perla-w:56px;--fine-w:216px;--prim-h:60px}
.fmt-desk{--capo-w:56px;--filo-x:66px;--filo-dx:400px;--perle-x:70px;--perle-gap:10px;--perla-w:84px;--fine-w:370px;--prim-h:86px}

/* 6 · carta aperta, scheda di dettaglio */
.aperta,.scheda{position:absolute;background:#201c22;border:1px solid var(--oro-cupo);box-shadow:inset 3px 0 0 var(--oro);padding:6px 9px 6px 12px;display:flex;flex-direction:column;gap:4px}
.aperta header,.scheda header{display:flex;align-items:baseline;gap:8px}
.aperta h3,.scheda h3{font-family:var(--f-titolo);font-weight:400;font-size:var(--t17);color:var(--oro)}
.aperta .cd{margin-left:auto;font-size:var(--t12);color:var(--cenere);font-weight:700}
.col-dado{font-size:var(--t12);color:var(--cenere);display:flex;align-items:center;gap:3px}
.col-dado b{color:var(--osso)}.col-dado .ico{width:12px;height:12px}
.tacca{display:inline-block;width:6px;height:12px;background:var(--oro)}.tacca.vuota{background:transparent;border:1px solid #6d6380}
.az-a{display:flex;gap:6px;padding:3px 6px;border:1px solid #3a3442;font-size:var(--t12);line-height:1.2}
.az-a .num{font-family:var(--f-titolo);font-size:var(--t16);color:var(--cenere);width:12px}
.az-a.ora{border:2px solid var(--oro);background:#2b2519}
.az-a.ora .num{color:var(--oro)}
.az-a.no{color:#a99fb6}.az-a.no .costo{color:#a99fb6;border-color:#4a4258}
.az-a .nota{color:#f2b8ad;font-style:italic}
.az-a.ora .nota{color:#e8d6a3;font-style:normal;font-weight:700}
.spinte{list-style:none;font-size:var(--t12);line-height:1.25}
.spinte li{display:flex;gap:6px}.spinte b{min-width:4.6em}.spinte .muro{color:#f2b8ad}
.aperta footer{margin-top:auto;display:flex;gap:6px;align-items:center}
.aperta footer .no-rimetti{font-size:var(--t12);color:var(--cenere);line-height:1.15;flex:1}
.regola{font-size:var(--t12);color:var(--cenere);font-style:italic;line-height:1.2}
.scheda .chiudi{position:absolute;right:2px;top:2px;width:var(--tocco);height:var(--tocco);background:transparent;border:0;color:var(--cenere);display:flex;align-items:center;justify-content:center}
.scheda .chiudi .ico{width:18px;height:18px}
.scheda p,.scheda li{font-size:var(--t12);line-height:1.25}
.scheda .faccia{display:grid;grid-template-columns:2.4em 1fr;gap:4px;padding:2px 0;border-top:1px solid #3a3442}
.scheda .faccia b{font-size:var(--t14)}
.scheda .faccia.estratta{background:#3a1a1a;outline:1px solid var(--sangue-vivo)}
.scheda .faccia .nm{font-weight:800}
.scheda .motivo-sel{color:#1b1409;background:var(--oro);padding:2px 6px;font-weight:700}
.toccato{outline:3px solid var(--oro);outline-offset:1px}
`;
module.exports = { CSS };
