// app.js — Lógica principal · Ratios Food Cost · Bonita Menorca

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const CENTROS = ['BINIFADET','TAMARINDOS','TAMARINDOS BAR','TIRANT','TIENDA'];
const CCOL = {
  'BINIFADET':    '#1D9E75',
  'TAMARINDOS':   '#185FA5',
  'TAMARINDOS BAR':'#534AB7',
  'TIRANT':       '#BA7517',
  'TIENDA':       '#993C1D'
};
const CPILL = {
  'BINIFADET':    'pBINIFADET',
  'TAMARINDOS':   'pTAMAR',
  'TAMARINDOS BAR':'pTAMARBAR',
  'TIRANT':       'pTIRANT',
  'TIENDA':       'pTIENDA'
};

let charts = {};
let semCentro = 'ALL';
const PAGE = 30;
let pages = { ing: 0, gas: 0, ppto: 0 };

// ── Helpers ────────────────────────────────────────────────────────
const fmt   = n => (n||0).toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2});
const fmtK  = n => n >= 1000 ? (n/1000).toFixed(1)+'k' : (n||0).toFixed(0);
const fmtPct= r => ((r||0)*100).toFixed(1)+'%';
const rcls  = r => !r||r<=0 ? 'b-gray' : r<=0.25 ? 'b-ok' : r<=0.35 ? 'b-warn' : 'b-bad';
const rcol  = r => !r||r<=0 ? '#888'   : r<=0.25 ? '#1D9E75' : r<=0.35 ? '#BA7517' : '#A32D2D';
const rlbl  = r => !r||r<=0 ? '—'      : r<=0.25 ? 'Óptimo'  : r<=0.35 ? 'Aceptable' : 'Elevado';

function gc() { return document.getElementById('gCentro').value; }
function gm() { return +document.getElementById('gMes').value; }
function getIng(c,m)  { return DB.ingresos.filter(r=>(!c||c==='ALL'||r.centro===c)&&(!m||r.mes===m)); }
function getGas(c,m)  { return DB.gastos.filter(r=>(!c||c==='ALL'||r.centro===c)&&(!m||r.mes===m)); }
function getPpto(c,m) { return DB.presupuesto.filter(r=>(!c||c==='ALL'||r.centro===c)&&(!m||r.mes===m)); }

function destroyChart(id) { if (charts[id]) { charts[id].destroy(); charts[id] = null; } }
function extractMes(fecha) { try { return new Date(fecha).getMonth()+1; } catch { return 0; } }

// ── Tab navigation ─────────────────────────────────────────────────
function showTab(id, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  btn.classList.add('active');
  const renders = {
    'dash':            renderDashboard,
    'semanal':         renderSemanal,
    'subfamilia':      renderSubfamilia,
    'presupuesto-dash':renderPptoDash,
    't-ingresos':      renderTblIng,
    't-gastos':        renderTblGas,
    't-presupuesto':   renderTblPpto,
    't-cls-ing':       renderClsIng,
    't-cls-gas':       renderClsGas,
  };
  if (renders[id]) renders[id]();
}

function renderAll() { renderDashboard(); }

// ── Modals ─────────────────────────────────────────────────────────
function openM(id)  { document.getElementById(id).style.display = 'flex'; }
function closeM(id) { document.getElementById(id).style.display = 'none'; }

// ── DASHBOARD ──────────────────────────────────────────────────────
function renderDashboard() {
  const c = gc(), m = gm();
  const ing = getIng(c, m), gas = getGas(c, m);
  const tI = ing.reduce((s,r) => s+r.pvp, 0);
  const tG = gas.reduce((s,r) => s+r.total, 0);
  const r  = tI > 0 ? tG/tI : 0;

  document.getElementById('d-metrics').innerHTML = `
    <div class="mc"><div class="lbl">Ingresos</div><div class="val" style="color:#1D9E75">€${fmtK(tI)}</div></div>
    <div class="mc"><div class="lbl">Gastos</div><div class="val">€${fmtK(tG)}</div></div>
    <div class="mc"><div class="lbl">Food cost</div><div class="val" style="color:${rcol(r)}">${fmtPct(r)}</div><div class="sub"><span class="badge ${rcls(r)}">${rlbl(r)}</span></div></div>
    <div class="mc"><div class="lbl">Margen bruto</div><div class="val">${fmtPct(1-r)}</div></div>
    <div class="mc"><div class="lbl">Registros ing.</div><div class="val">${ing.length}</div></div>
    <div class="mc"><div class="lbl">Registros gasto</div><div class="val">${gas.length}</div></div>
  `;

  // Chart: food cost mensual
  const mesMap = {};
  DB.ingresos.filter(r => !c||c==='ALL'||r.centro===c).forEach(r => { if (!mesMap[r.mes]) mesMap[r.mes]={i:0,g:0}; mesMap[r.mes].i+=r.pvp; });
  DB.gastos.filter(r => !c||c==='ALL'||r.centro===c).forEach(r => { if (!mesMap[r.mes]) mesMap[r.mes]={i:0,g:0}; mesMap[r.mes].g+=r.total; });
  const mkeys = Object.keys(mesMap).sort((a,b) => +a-+b);
  const ratios = mkeys.map(k => mesMap[k].i > 0 ? +(mesMap[k].g/mesMap[k].i*100).toFixed(1) : 0);

  destroyChart('monthly');
  charts.monthly = new Chart(document.getElementById('ch-monthly'), {
    type: 'bar',
    data: { labels: mkeys.map(k => MESES[+k].substring(0,3)), datasets: [{ data: ratios, backgroundColor: ratios.map(v => v<=25?'#1D9E75':v<=35?'#BA7517':'#A32D2D'), borderRadius: 3 }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>`${c.parsed.y}%`}}}, scales:{ y:{beginAtZero:true,max:60,ticks:{callback:v=>v+'%'},grid:{color:'rgba(128,128,128,.08)'}}, x:{grid:{display:false},ticks:{autoSkip:false}} } }
  });

  // Chart: por centro
  const cdta = CENTROS.map(ct => { const i=DB.ingresos.filter(r=>r.centro===ct).reduce((s,r)=>s+r.pvp,0); const g=DB.gastos.filter(r=>r.centro===ct).reduce((s,r)=>s+r.total,0); return i>0?+(g/i*100).toFixed(1):0; });
  destroyChart('centros');
  charts.centros = new Chart(document.getElementById('ch-centros'), {
    type: 'bar',
    data: { labels: ['Bini','Tamar','T.Bar','Tirant','Tienda'], datasets: [{ data: cdta, backgroundColor: Object.values(CCOL), borderRadius: 3 }] },
    options: { indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.parsed.x}%`}}}, scales:{ x:{beginAtZero:true,ticks:{callback:v=>v+'%'},grid:{color:'rgba(128,128,128,.08)'}}, y:{grid:{display:false}} } }
  });

  // Chart: ing vs gas
  destroyChart('inggas');
  charts.inggas = new Chart(document.getElementById('ch-inggas'), {
    type: 'bar',
    data: { labels: mkeys.map(k => MESES[+k].substring(0,3)), datasets: [
      { label:'Ingresos', data: mkeys.map(k => +mesMap[k].i.toFixed(0)), backgroundColor:'#1D9E75', borderRadius:3 },
      { label:'Gastos',   data: mkeys.map(k => +mesMap[k].g.toFixed(0)), backgroundColor:'#E24B4A', borderRadius:3 }
    ]},
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true,ticks:{callback:v=>fmtK(v)},grid:{color:'rgba(128,128,128,.08)'}}, x:{grid:{display:false},ticks:{autoSkip:false}} } }
  });

  // Chart: por familia
  const famMap = {};
  ing.forEach(r => { if (!famMap[r.familia]) famMap[r.familia]={i:0,g:0}; famMap[r.familia].i+=r.pvp; });
  gas.forEach(r => { if (!famMap[r.familia]) famMap[r.familia]={i:0,g:0}; famMap[r.familia].g+=r.total; });
  const fents = Object.entries(famMap).filter(([,v]) => v.i>0).sort((a,b) => b[1].i-a[1].i).slice(0,6);
  const fcols = ['#1D9E75','#185FA5','#534AB7','#BA7517','#993C1D','#3C3489'];
  destroyChart('fam');
  charts.fam = new Chart(document.getElementById('ch-fam'), {
    type: 'bar',
    data: { labels: fents.map(([k]) => k), datasets: [
      { label:'Ingresos', data: fents.map(([,v]) => +v.i.toFixed(0)), backgroundColor: fcols.map(c=>c+'55'), borderColor: fcols, borderWidth:1, borderRadius:3 },
      { label:'Gastos',   data: fents.map(([,v]) => +v.g.toFixed(0)), backgroundColor: fcols, borderRadius:3 }
    ]},
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true,ticks:{callback:v=>fmtK(v)},grid:{color:'rgba(128,128,128,.08)'}}, x:{grid:{display:false}} } }
  });

  // Tabla resumen
  const pptoMap = {};
  DB.presupuesto.filter(r=>!c||c==='ALL'||r.centro===c).forEach(r => { pptoMap[r.centro]=(pptoMap[r.centro]||0)+r.importe; });
  document.getElementById('tb-resumen').innerHTML = CENTROS.map(ct => {
    const i = DB.ingresos.filter(r=>r.centro===ct&&(!m||r.mes===m)).reduce((s,r)=>s+r.pvp,0);
    const g = DB.gastos.filter(r=>r.centro===ct&&(!m||r.mes===m)).reduce((s,r)=>s+r.total,0);
    const p = pptoMap[ct]||0;
    const rat = i > 0 ? g/i : 0;
    const dev = i - p;
    if (!i && !g) return '';
    return `<tr>
      <td><span class="pill ${CPILL[ct]}">${ct}</span></td>
      <td class="tr">€${fmt(i)}</td>
      <td class="tr">€${fmt(g)}</td>
      <td class="tr">${fmtPct(rat)}<span class="rbar"><span class="rfill" style="width:${Math.min(rat*100,100)}%;background:${rcol(rat)}"></span></span></td>
      <td class="tr"><span class="${dev>=0?'vs-ok':'vs-bad'}">${dev>=0?'+':''}€${fmt(dev)}</span></td>
      <td><span class="badge ${rcls(rat)}">${rlbl(rat)}</span></td>
    </tr>`;
  }).join('');
}

// ── SEMANAL ────────────────────────────────────────────────────────
function setSemCentro(c, btn) {
  semCentro = c;
  document.querySelectorAll('#stabs-semanal .stab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSemanal();
}

function renderSemanal() {
  const c = semCentro;
  const semMapI = {}, semMapG = {};
  DB.ingresos.filter(r => c==='ALL'||r.centro===c).forEach(r => { semMapI[r.semana]=(semMapI[r.semana]||0)+r.pvp; });
  DB.gastos.filter(r => c==='ALL'||r.centro===c).forEach(r => { semMapG[r.semana]=(semMapG[r.semana]||0)+r.total; });
  const sems = [...new Set([...Object.keys(semMapI),...Object.keys(semMapG)])].map(Number).sort((a,b)=>a-b);
  const iArr = sems.map(s => +(semMapI[s]||0).toFixed(0));
  const gArr = sems.map(s => +(semMapG[s]||0).toFixed(0));
  const rArr = sems.map(s => { const i=semMapI[s]||0,g=semMapG[s]||0; return i>0?+(g/i*100).toFixed(1):0; });
  const col  = c==='ALL'?'#1D9E75':CCOL[c]||'#1D9E75';

  destroyChart('semI');
  charts.semI = new Chart(document.getElementById('ch-sem-ing'), {
    type:'bar', data:{labels:sems.map(s=>'S'+s),datasets:[{data:iArr,backgroundColor:col,borderRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:v=>fmtK(v)},grid:{color:'rgba(128,128,128,.08)'}},x:{grid:{display:false},ticks:{autoSkip:false,maxRotation:0}}}}
  });
  destroyChart('semG');
  charts.semG = new Chart(document.getElementById('ch-sem-gas'), {
    type:'bar', data:{labels:sems.map(s=>'S'+s),datasets:[{data:gArr,backgroundColor:'#E24B4A',borderRadius:3}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:v=>fmtK(v)},grid:{color:'rgba(128,128,128,.08)'}},x:{grid:{display:false},ticks:{autoSkip:false,maxRotation:0}}}}
  });
  destroyChart('semR');
  charts.semR = new Chart(document.getElementById('ch-sem-ratio'), {
    type:'line',data:{labels:sems.map(s=>'S'+s),datasets:[{label:'Food cost %',data:rArr,borderColor:'#534AB7',backgroundColor:'#534AB71A',fill:true,tension:.35,pointRadius:4,pointBackgroundColor:'#534AB7'}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.parsed.y}%`}}},scales:{y:{beginAtZero:true,ticks:{callback:v=>v+'%'},grid:{color:'rgba(128,128,128,.08)'}},x:{grid:{display:false},ticks:{autoSkip:false,maxRotation:0}}}}
  });

  // Tabla detalle semanal
  const rows = [];
  if (c === 'ALL') {
    CENTROS.forEach(ct => {
      const si={}, sg={};
      DB.ingresos.filter(r=>r.centro===ct).forEach(r=>{si[r.semana]=(si[r.semana]||0)+r.pvp;});
      DB.gastos.filter(r=>r.centro===ct).forEach(r=>{sg[r.semana]=(sg[r.semana]||0)+r.total;});
      [...new Set([...Object.keys(si),...Object.keys(sg)])].map(Number).sort((a,b)=>a-b)
        .forEach(sem => { const i=si[sem]||0,g=sg[sem]||0; if(i||g) rows.push({sem,ct,i,g}); });
    });
  } else {
    sems.forEach(s => { const i=semMapI[s]||0,g=semMapG[s]||0; if(i||g) rows.push({sem:s,ct:c,i,g}); });
  }
  rows.sort((a,b) => a.sem-b.sem||a.ct.localeCompare(b.ct));
  document.getElementById('tb-semanal').innerHTML = rows.map(r => {
    const rat = r.i>0?r.g/r.i:0;
    return `<tr>
      <td><span class="badge b-gray">S${r.sem}</span></td>
      <td><span class="pill ${CPILL[r.ct]}">${r.ct}</span></td>
      <td class="tr">€${fmt(r.i)}</td>
      <td class="tr">€${fmt(r.g)}</td>
      <td class="tr">${fmtPct(rat)}<span class="rbar"><span class="rfill" style="width:${Math.min(rat*100,100)}%;background:${rcol(rat)}"></span></span></td>
      <td><span class="badge ${rcls(rat)}">${rlbl(rat)}</span></td>
    </tr>`;
  }).join('');
  const tI2 = rows.reduce((s,r)=>s+r.i,0), tG2 = rows.reduce((s,r)=>s+r.g,0);
  document.getElementById('tf-sem-ing').textContent   = '€'+fmt(tI2);
  document.getElementById('tf-sem-gas').textContent   = '€'+fmt(tG2);
  document.getElementById('tf-sem-ratio').textContent = tI2>0?fmtPct(tG2/tI2):'—';

  // Tabla por familia
  const sfMap = {};
  DB.ingresos.filter(r=>c==='ALL'||r.centro===c).forEach(r=>{const k=`${r.semana}|${r.centro}|${r.familia}`;if(!sfMap[k])sfMap[k]={sem:r.semana,ct:r.centro,fam:r.familia,i:0,g:0};sfMap[k].i+=r.pvp;});
  DB.gastos.filter(r=>c==='ALL'||r.centro===c).forEach(r=>{const k=`${r.semana}|${r.centro}|${r.familia}`;if(!sfMap[k])sfMap[k]={sem:r.semana,ct:r.centro,fam:r.familia,i:0,g:0};sfMap[k].g+=r.total;});
  document.getElementById('tb-sem-fam').innerHTML = Object.values(sfMap)
    .sort((a,b)=>a.sem-b.sem||a.ct.localeCompare(b.ct)).slice(0,80)
    .map(r=>{const rat=r.i>0?r.g/r.i:0;return`<tr><td><span class="badge b-gray">S${r.sem}</span></td><td><span class="pill ${CPILL[r.ct]}">${r.ct}</span></td><td><span class="badge b-info">${r.fam}</span></td><td class="tr">€${fmt(r.i)}</td><td class="tr">€${fmt(r.g)}</td><td class="tr">${r.i>0?fmtPct(rat):'—'}</td></tr>`;}).join('');
}

// ── SUBFAMILIA ─────────────────────────────────────────────────────
function renderSubfamilia() {
  const c   = document.getElementById('sf-centro').value;
  const fam = document.getElementById('sf-familia').value;
  const m   = +document.getElementById('sf-mes').value;
  const sfMap = {};
  DB.ingresos.filter(r=>(!c||r.centro===c)&&(!fam||r.familia===fam)&&(!m||r.mes===m))
    .forEach(r=>{const k=r.subfamilia+'||'+r.familia;if(!sfMap[k])sfMap[k]={sf:r.subfamilia,fam:r.familia,i:0,g:0};sfMap[k].i+=r.pvp;});
  DB.gastos.filter(r=>(!c||r.centro===c)&&(!fam||r.familia===fam)&&(!m||r.mes===m))
    .forEach(r=>{const k=r.subfamilia+'||'+r.familia;if(!sfMap[k])sfMap[k]={sf:r.subfamilia,fam:r.familia,i:0,g:0};sfMap[k].g+=r.total;});
  const ents = Object.values(sfMap).filter(v=>v.i>0).sort((a,b)=>b.i-a.i);
  const top10 = ents.slice(0,10);
  const lbl = v => v.sf.length>13?v.sf.substring(0,13)+'…':v.sf;

  destroyChart('sfI');
  charts.sfI = new Chart(document.getElementById('ch-sf-ing'),{
    type:'bar', data:{labels:top10.map(lbl),datasets:[{data:top10.map(v=>+v.i.toFixed(0)),backgroundColor:'#185FA5',borderRadius:3}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{callback:v=>fmtK(v)},grid:{color:'rgba(128,128,128,.08)'}},y:{grid:{display:false}}}}
  });
  const ratEnts = ents.filter(v=>v.i>0&&v.g>0).slice(0,10);
  destroyChart('sfR');
  charts.sfR = new Chart(document.getElementById('ch-sf-ratio'),{
    type:'bar', data:{labels:ratEnts.map(lbl),datasets:[{data:ratEnts.map(v=>+(v.g/v.i*100).toFixed(1)),backgroundColor:ratEnts.map(v=>{const r=v.g/v.i;return r<=0.25?'#1D9E75':r<=0.35?'#BA7517':'#A32D2D';}),borderRadius:3}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.parsed.x}%`}}},scales:{x:{beginAtZero:true,ticks:{callback:v=>v+'%'},grid:{color:'rgba(128,128,128,.08)'}},y:{grid:{display:false}}}}
  });

  document.getElementById('tb-sf').innerHTML = ents.map(v=>{const rat=v.i>0?v.g/v.i:0;return`<tr>
    <td>${v.sf}</td><td><span class="badge b-info">${v.fam}</span></td>
    <td class="tr">€${fmt(v.i)}</td><td class="tr">€${fmt(v.g)}</td>
    <td class="tr">${v.g>0?fmtPct(rat):'—'}<span class="rbar"><span class="rfill" style="width:${Math.min(rat*100,100)}%;background:${rcol(rat)}"></span></span></td>
    <td><span class="badge ${rcls(rat)}">${rlbl(rat)}</span></td>
  </tr>`;}).join('');
  const tI=ents.reduce((s,v)=>s+v.i,0), tG=ents.reduce((s,v)=>s+v.g,0);
  document.getElementById('tf-sf-ing').textContent   = '€'+fmt(tI);
  document.getElementById('tf-sf-gas').textContent   = '€'+fmt(tG);
  document.getElementById('tf-sf-ratio').textContent = tI>0?fmtPct(tG/tI):'—';
}

// ── PRESUPUESTO DASHBOARD ──────────────────────────────────────────
function renderPptoDash() {
  const c      = document.getElementById('pd-centro').value;
  const semSel = +document.getElementById('pd-semana').value;

  // Poblar select de semanas
  const semEl = document.getElementById('pd-semana');
  if (semEl.options.length <= 1) {
    [...new Set(DB.presupuesto.map(r=>r.semana))].sort((a,b)=>a-b).forEach(s=>{
      const o=document.createElement('option'); o.value=s; o.textContent='Semana '+s; semEl.appendChild(o);
    });
  }

  const pptoMap={}, realMap={};
  DB.presupuesto.filter(r=>(c==='ALL'||r.centro===c)&&(!semSel||r.semana===semSel)).forEach(r=>{const k=r.semana+'|'+r.centro;pptoMap[k]=(pptoMap[k]||0)+r.importe;});
  DB.ingresos.filter(r=>(c==='ALL'||r.centro===c)&&(!semSel||r.semana===semSel)).forEach(r=>{const k=r.semana+'|'+r.centro;realMap[k]=(realMap[k]||0)+r.pvp;});
  const keys = [...new Set([...Object.keys(pptoMap),...Object.keys(realMap)])].sort();
  const rows = keys.map(k=>{const[sem,ct]=k.split('|');return{sem:+sem,ct,ppto:pptoMap[k]||0,real:realMap[k]||0};}).sort((a,b)=>a.sem-b.sem||a.ct.localeCompare(b.ct));

  const tPpto=rows.reduce((s,r)=>s+r.ppto,0);
  const tReal=rows.reduce((s,r)=>s+r.real,0);
  const tDev=tReal-tPpto;
  const tPct=tPpto>0?tReal/tPpto:0;

  document.getElementById('pd-metrics').innerHTML=`
    <div class="mc"><div class="lbl">Presupuesto total</div><div class="val">€${fmtK(tPpto)}</div></div>
    <div class="mc"><div class="lbl">Real total</div><div class="val" style="color:#1D9E75">€${fmtK(tReal)}</div></div>
    <div class="mc"><div class="lbl">Desviación</div><div class="val" style="color:${tDev>=0?'#1D9E75':'#A32D2D'}">${tDev>=0?'+':''}€${fmtK(Math.abs(tDev))}</div></div>
    <div class="mc"><div class="lbl">Cumplimiento</div><div class="val" style="color:${tPct>=1?'#1D9E75':tPct>=0.85?'#BA7517':'#A32D2D'}">${(tPct*100).toFixed(1)}%</div><div class="sub"><span class="badge ${tPct>=1?'b-ok':tPct>=0.85?'b-warn':'b-bad'}">${tPct>=1?'Superado':tPct>=0.85?'Cerca':'Por debajo'}</span></div></div>
  `;

  const semMap2={};
  rows.forEach(r=>{if(!semMap2[r.sem])semMap2[r.sem]={p:0,rr:0};semMap2[r.sem].p+=r.ppto;semMap2[r.sem].rr+=r.real;});
  const sems2=Object.keys(semMap2).sort((a,b)=>+a-+b);

  destroyChart('pdSem');
  charts.pdSem = new Chart(document.getElementById('ch-pd-sem'),{
    type:'bar',data:{labels:sems2.map(s=>'S'+s),datasets:[
      {label:'Presupuesto',data:sems2.map(s=>+semMap2[s].p.toFixed(0)),backgroundColor:'rgba(83,74,183,.35)',borderColor:'#534AB7',borderWidth:1,borderRadius:3},
      {label:'Real',       data:sems2.map(s=>+semMap2[s].rr.toFixed(0)),backgroundColor:'#1D9E75',borderRadius:3}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:v=>fmtK(v)},grid:{color:'rgba(128,128,128,.08)'}},x:{grid:{display:false},ticks:{autoSkip:false,maxRotation:0}}}}
  });

  const pcts=sems2.map(s=>semMap2[s].p>0?+(semMap2[s].rr/semMap2[s].p*100).toFixed(1):0);
  destroyChart('pdPct');
  charts.pdPct = new Chart(document.getElementById('ch-pd-pct'),{
    type:'line',data:{labels:sems2.map(s=>'S'+s),datasets:[
      {label:'Cumpl.%',data:pcts,borderColor:'#185FA5',backgroundColor:'#185FA51A',fill:true,tension:.3,pointRadius:4,pointBackgroundColor:'#185FA5'},
      {label:'100%',data:sems2.map(()=>100),borderColor:'#BA7517',borderDash:[4,4],borderWidth:1.5,pointRadius:0,fill:false}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.parsed.y}%`}}},scales:{y:{beginAtZero:true,ticks:{callback:v=>v+'%'},grid:{color:'rgba(128,128,128,.08)'}},x:{grid:{display:false},ticks:{autoSkip:false,maxRotation:0}}}}
  });

  document.getElementById('tb-pd').innerHTML = rows.map(r=>{
    const dev=r.real-r.ppto; const pct=r.ppto>0?r.real/r.ppto:0;
    return`<tr>
      <td><span class="badge b-gray">S${r.sem}</span></td>
      <td><span class="pill ${CPILL[r.ct]}">${r.ct}</span></td>
      <td class="tr">€${fmt(r.ppto)}</td>
      <td class="tr">€${fmt(r.real)}</td>
      <td class="tr"><span class="${dev>=0?'vs-ok':'vs-bad'}">${dev>=0?'+':''}€${fmt(dev)}</span></td>
      <td class="tr">${(pct*100).toFixed(1)}%</td>
      <td><span class="badge ${pct>=1?'b-ok':pct>=0.85?'b-warn':'b-bad'}">${pct>=1?'Superado':pct>=0.85?'Cerca':'Bajo'}</span></td>
    </tr>`;
  }).join('');
  document.getElementById('tf-pd-ppto').textContent='€'+fmt(tPpto);
  document.getElementById('tf-pd-real').textContent='€'+fmt(tReal);
  document.getElementById('tf-pd-dev').innerHTML=`<span class="${tDev>=0?'vs-ok':'vs-bad'}">${tDev>=0?'+':''}€${fmt(tDev)}</span>`;
  document.getElementById('tf-pd-pct').textContent=(tPct*100).toFixed(1)+'%';

  // Barras progreso por centro
  const centroMap={};
  rows.forEach(r=>{if(!centroMap[r.ct])centroMap[r.ct]={p:0,rr:0};centroMap[r.ct].p+=r.ppto;centroMap[r.ct].rr+=r.real;});
  document.getElementById('pd-barras').innerHTML=Object.entries(centroMap).map(([ct,v])=>{
    const pct2=v.p>0?Math.min(v.rr/v.p,1.5):0;
    const col=pct2>=1?'#1D9E75':pct2>=0.85?'#BA7517':'#A32D2D';
    return`<div class="bvs-row">
      <span class="pill ${CPILL[ct]}" style="min-width:120px">${ct}</span>
      <div class="prog-bg"><div class="prog-fill" style="width:${Math.min(pct2*100,100)}%;background:${col}"></div></div>
      <span style="font-size:11px;min-width:40px;text-align:right;color:${col}">${(pct2*100).toFixed(0)}%</span>
      <span style="font-size:11px;color:#888;min-width:90px;text-align:right">€${fmtK(v.rr)} / €${fmtK(v.p)}</span>
    </div>`;
  }).join('');
}

// ── TABLAS CRUD ────────────────────────────────────────────────────
function renderTblIng() {
  const c=document.getElementById('fi-centro').value, m=+document.getElementById('fi-mes').value, f=document.getElementById('fi-fam').value;
  const rows=DB.ingresos.filter(r=>(!c||r.centro===c)&&(!m||r.mes===m)&&(!f||r.familia===f));
  const pg=pages.ing;
  document.getElementById('tb-ing').innerHTML=rows.slice(pg*PAGE,(pg+1)*PAGE).map(r=>`<tr>
    <td>${r.fecha}</td>
    <td><span class="pill ${CPILL[r.centro]}">${r.centro}</span></td>
    <td style="color:#888">${r.canal||''}</td>
    <td style="color:#888">${r.articulo||''}</td>
    <td>${r.descripcion||''}</td>
    <td><span class="badge b-info">${r.familia}</span></td>
    <td style="color:#888">${r.subfamilia}</td>
    <td class="tr">${(r.uds||0).toFixed(1)}</td>
    <td class="tr">€${fmt(r.base)}</td>
    <td class="tr">€${fmt(r.pvp)}</td>
    <td>${MESES[r.mes]||r.mes}</td>
    <td><button class="btn btn-sm btn-r" onclick="delRow('ingresos',${r.id})">×</button></td>
  </tr>`).join('');
  document.getElementById('tf-ing-u').textContent='€'+fmt(rows.reduce((s,r)=>s+(r.uds||0),0));
  document.getElementById('tf-ing-b').textContent='€'+fmt(rows.reduce((s,r)=>s+r.base,0));
  document.getElementById('tf-ing-p').textContent='€'+fmt(rows.reduce((s,r)=>s+r.pvp,0));
  document.getElementById('pag-ing').textContent=`${Math.min(pg*PAGE+1,rows.length)}–${Math.min((pg+1)*PAGE,rows.length)} de ${rows.length} registros`;
}

function renderTblGas() {
  const c=document.getElementById('fg-centro').value, m=+document.getElementById('fg-mes').value, f=document.getElementById('fg-fam').value;
  const rows=DB.gastos.filter(r=>(!c||r.centro===c)&&(!m||r.mes===m)&&(!f||r.familia===f));
  const pg=pages.gas;
  document.getElementById('tb-gas').innerHTML=rows.slice(pg*PAGE,(pg+1)*PAGE).map(r=>`<tr>
    <td>${r.fecha}</td>
    <td><span class="pill ${CPILL[r.centro]}">${r.centro}</span></td>
    <td style="color:#888">${r.proveedor}</td>
    <td>${r.producto}</td>
    <td><span class="badge b-info">${r.familia}</span></td>
    <td style="color:#888">${r.subfamilia}</td>
    <td class="tr">${r.cant}</td>
    <td>${r.unidad}</td>
    <td class="tr">€${fmt(r.total)}</td>
    <td>${MESES[r.mes]||r.mes}</td>
    <td><button class="btn btn-sm btn-r" onclick="delRow('gastos',${r.id})">×</button></td>
  </tr>`).join('');
  document.getElementById('tf-gas-t').textContent='€'+fmt(rows.reduce((s,r)=>s+r.total,0));
  document.getElementById('pag-gas').textContent=`${Math.min(pg*PAGE+1,rows.length)}–${Math.min((pg+1)*PAGE,rows.length)} de ${rows.length} registros`;
}

function renderTblPpto() {
  const c=document.getElementById('fp-centro').value, m=+document.getElementById('fp-mes').value;
  const rows=DB.presupuesto.filter(r=>(!c||r.centro===c)&&(!m||r.mes===m));
  const pg=pages.ppto;
  document.getElementById('tb-ppto').innerHTML=rows.slice(pg*PAGE,(pg+1)*PAGE).map(r=>`<tr>
    <td>${r.fecha}</td>
    <td><span class="pill ${CPILL[r.centro]}">${r.centro}</span></td>
    <td class="tr">€${fmt(r.importe)}</td>
    <td>S${r.semana}</td>
    <td>${MESES[r.mes]||r.mes}</td>
    <td><button class="btn btn-sm btn-r" onclick="delRow('presupuesto',${r.id})">×</button></td>
  </tr>`).join('');
  document.getElementById('tf-ppto-t').textContent='€'+fmt(rows.reduce((s,r)=>s+r.importe,0));
  document.getElementById('pag-ppto').textContent=`${rows.length} registros`;
}

function renderClsIng() {
  const q=document.getElementById('fai-q').value.toLowerCase(), f=document.getElementById('fai-fam').value;
  document.getElementById('tb-aing').innerHTML=DB.clsIng
    .filter(r=>(!q||r.producto.toLowerCase().includes(q))&&(!f||r.familia===f))
    .map(r=>`<tr>
      <td style="color:#888">${r.id}</td><td>${r.producto}</td>
      <td><span class="badge b-info">${r.familia}</span></td><td style="color:#888">${r.subfamilia}</td>
      <td>${r.factor}</td>
      <td><button class="btn btn-sm btn-r" onclick="delRow('clsIng',${r.id})">×</button></td>
    </tr>`).join('');
}

function renderClsGas() {
  const q=document.getElementById('fag-q').value.toLowerCase(), f=document.getElementById('fag-fam').value;
  document.getElementById('tb-agas').innerHTML=DB.clsGas
    .filter(r=>(!q||r.articulo.toLowerCase().includes(q))&&(!f||r.familia===f))
    .map(r=>`<tr>
      <td style="color:#888">${r.id}</td><td>${r.articulo}</td>
      <td style="color:#888">${r.unidad}</td>
      <td><span class="badge b-info">${r.familia}</span></td><td style="color:#888">${r.subfamilia}</td>
      <td>${r.factor}</td>
      <td><button class="btn btn-sm btn-r" onclick="delRow('clsGas',${r.id})">×</button></td>
    </tr>`).join('');
}

// ── PASTE LOADER ───────────────────────────────────────────────────
function loadPaste(type) {
  const ids = { ing:'paste-ing', gas:'paste-gas', ppto:'paste-ppto', aing:'paste-aing', agas:'paste-agas' };
  const raw = document.getElementById(ids[type]).value.trim();
  if (!raw) { showMsg(type, 'Texto vacío', 'err'); return; }
  const lines = raw.split('\n').filter(l => l.trim());
  let count=0, errs=0;
  const newRows = [];
  lines.forEach((line, i) => {
    const cols = line.split('\t').map(s => s.trim().replace(/^"|"$/g,''));
    try {
      if (type === 'ing') {
        // FECHA · CENTRO · CANAL · ARTICULO · DESCRIPCION · UNIDADES · BASE · PVP · SEMANA · MES · FAMILIA · SUBFAMILIA · FACTOR
        const [fecha,centro,canal,articulo,descripcion,uds,base,pvp,semana,mes,familia,subfamilia] = cols;
        if (!fecha || !centro) throw new Error('faltan campos');
        const m = +mes || extractMes(fecha);
        newRows.push({ id:Date.now()+i, fecha, centro:centro.toUpperCase(), canal:canal||centro, articulo, descripcion, uds:parseFloat(uds)||0, base:parseFloat(base)||0, pvp:parseFloat(pvp)||0, semana:+semana||0, mes:m, familia:(familia||'COMIDA').toUpperCase(), subfamilia:subfamilia||'VARIOS' });
        count++;
      } else if (type === 'gas') {
        // FECHA · CENTRO · PROVEEDOR · PRODUCTO · FAMILIA · SUBFAMILIA · CANTIDAD · UNIDAD · TOTAL · SEMANA · MES
        const [fecha,centro,proveedor,producto,familia,subfamilia,cant,unidad,total,semana,mes] = cols;
        if (!fecha || !centro) throw new Error('faltan campos');
        const m = +mes || extractMes(fecha);
        newRows.push({ id:Date.now()+i, fecha, centro:centro.toUpperCase(), proveedor:proveedor||'—', producto:producto||'—', familia:(familia||'COMIDA').toUpperCase(), subfamilia:subfamilia||'VARIOS', cant:parseFloat(cant)||0, unidad:unidad||'UND', total:parseFloat(total)||0, semana:+semana||0, mes:m });
        count++;
      } else if (type === 'ppto') {
        // FECHA · CENTRO · PRESUPUESTO_DIA · SEMANA · MES
        const [fecha,centro,importe,semana,mes] = cols;
        if (!fecha || !centro) throw new Error('faltan campos');
        const m = +mes || extractMes(fecha);
        newRows.push({ id:Date.now()+i, fecha, centro:centro.toUpperCase(), importe:parseFloat(importe)||0, semana:+semana||0, mes:m });
        count++;
      } else if (type === 'aing') {
        const [id,producto,familia,subfamilia,factor] = cols;
        newRows.push({ id:+id, producto, familia:(familia||'COMIDA').toUpperCase(), subfamilia:subfamilia||'VARIOS', factor:parseFloat(factor)||1 });
        count++;
      } else if (type === 'agas') {
        const [id,articulo,unidad,familia,subfamilia,factor] = cols;
        newRows.push({ id:+id, articulo, unidad:unidad||'UND', familia:(familia||'COMIDA').toUpperCase(), subfamilia:subfamilia||'VARIOS', factor:parseFloat(factor)||1 });
        count++;
      }
    } catch(e) { errs++; }
  });
  if (type==='ing')  DB.ingresos=[...DB.ingresos,...newRows];
  else if(type==='gas')  DB.gastos=[...DB.gastos,...newRows];
  else if(type==='ppto') DB.presupuesto=[...DB.presupuesto,...newRows];
  else if(type==='aing') DB.clsIng=[...DB.clsIng,...newRows];
  else if(type==='agas') DB.clsGas=[...DB.clsGas,...newRows];
  document.getElementById(ids[type]).value='';
  showMsg(type, `${count} filas cargadas${errs>0?' ('+errs+' errores)':''}`, errs>0?'err':'ok');
  if(type==='ing')  { renderTblIng(); renderDashboard(); }
  else if(type==='gas')  { renderTblGas(); renderDashboard(); }
  else if(type==='ppto') { renderTblPpto(); }
  else if(type==='aing') renderClsIng();
  else if(type==='agas') renderClsGas();
}

function clearTable(type) {
  if (!confirm('¿Borrar toda la tabla? Esta acción no se puede deshacer.')) return;
  if(type==='ing')  DB.ingresos=[];
  else if(type==='gas')  DB.gastos=[];
  else if(type==='ppto') DB.presupuesto=[];
  else if(type==='aing') DB.clsIng=[];
  else if(type==='agas') DB.clsGas=[];
  showMsg(type, 'Tabla borrada', 'err');
  if(type==='ing')  { renderTblIng(); renderDashboard(); }
  else if(type==='gas')  { renderTblGas(); renderDashboard(); }
  else if(type==='ppto') renderTblPpto();
  else if(type==='aing') renderClsIng();
  else if(type==='agas') renderClsGas();
}

function showMsg(type, msg, status) {
  const ids = { ing:'msg-ing', gas:'msg-gas', ppto:'msg-ppto', aing:'msg-aing', agas:'msg-agas' };
  const el = document.getElementById(ids[type]);
  if (!el) return;
  el.textContent = msg;
  el.className = 'paste-msg ' + (status==='ok'?'ok':'err');
  setTimeout(() => { el.textContent=''; el.className='paste-msg'; }, 5000);
}

function delRow(table, id) {
  DB[table] = DB[table].filter(r => r.id !== id);
  if(table==='ingresos')    { renderTblIng(); renderDashboard(); }
  else if(table==='gastos') { renderTblGas(); renderDashboard(); }
  else if(table==='presupuesto') renderTblPpto();
  else if(table==='clsIng') renderClsIng();
  else if(table==='clsGas') renderClsGas();
}

// ── MODAL SAVES ────────────────────────────────────────────────────
function saveIng() {
  const fecha=document.getElementById('ni-fecha').value, pvp=parseFloat(document.getElementById('ni-pvp').value)||0;
  if (!fecha||!pvp) { alert('Fecha y PVP son obligatorios'); return; }
  const mes=extractMes(fecha);
  DB.ingresos.push({ id:Date.now(), fecha, centro:document.getElementById('ni-centro').value, canal:document.getElementById('ni-canal').value||'—', articulo:document.getElementById('ni-art').value||'—', descripcion:document.getElementById('ni-desc').value||'—', familia:document.getElementById('ni-fam').value, subfamilia:document.getElementById('ni-sf').value||'VARIOS', uds:parseFloat(document.getElementById('ni-uds').value)||1, base:parseFloat(document.getElementById('ni-base').value)||0, pvp, semana:Math.ceil(mes*4.3), mes });
  closeM('m-ing'); renderTblIng(); renderDashboard();
}

function saveGas() {
  const fecha=document.getElementById('ng-fecha').value, total=parseFloat(document.getElementById('ng-total').value)||0;
  if (!fecha||!total) { alert('Fecha y total son obligatorios'); return; }
  const mes=extractMes(fecha);
  DB.gastos.push({ id:Date.now(), fecha, centro:document.getElementById('ng-centro').value, proveedor:document.getElementById('ng-prov').value||'—', producto:document.getElementById('ng-prod').value||'—', familia:document.getElementById('ng-fam').value, subfamilia:document.getElementById('ng-sf').value||'VARIOS', cant:parseFloat(document.getElementById('ng-cant').value)||1, unidad:document.getElementById('ng-unidad').value||'UND', total, semana:Math.ceil(mes*4.3), mes });
  closeM('m-gas'); renderTblGas(); renderDashboard();
}

function savePpto() {
  const fecha=document.getElementById('np-fecha').value, imp=parseFloat(document.getElementById('np-imp').value)||0;
  if (!fecha||!imp) { alert('Fecha e importe son obligatorios'); return; }
  const mes=extractMes(fecha);
  DB.presupuesto.push({ id:Date.now(), fecha, centro:document.getElementById('np-centro').value, importe:imp, semana:Math.ceil(mes*4.3), mes });
  closeM('m-ppto'); renderTblPpto();
}

function saveAIng() {
  const id=+document.getElementById('nai-id').value;
  if (!id) { alert('ID obligatorio'); return; }
  DB.clsIng.push({ id, producto:document.getElementById('nai-prod').value, familia:document.getElementById('nai-fam').value, subfamilia:document.getElementById('nai-sf').value, factor:parseFloat(document.getElementById('nai-factor').value)||1 });
  closeM('m-aing'); renderClsIng();
}

function saveAGas() {
  const id=+document.getElementById('nag-id').value;
  if (!id) { alert('ID obligatorio'); return; }
  DB.clsGas.push({ id, articulo:document.getElementById('nag-art').value, unidad:document.getElementById('nag-unidad').value, familia:document.getElementById('nag-fam').value, subfamilia:document.getElementById('nag-sf').value, factor:parseFloat(document.getElementById('nag-factor').value)||1 });
  closeM('m-agas'); renderClsGas();
}

// ── INIT ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
});
