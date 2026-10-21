import {calculate,statistics,parseScalar,format,LIMITS,createMemoryStore,MEMORY_NAMES,CalcResult} from './engine.mjs';
import {RELEASE} from './release.mjs';

const $=id=>document.getElementById(id),input=$('expression');
let mode='DEG',completed=false;
let lastResultObj = new CalcResult(0);
let ansValue = new CalcResult(0);
const memoryStore = createMemoryStore();

// Format display settings: NORM, FIX, SCI
let displayMode = 'NORM';
let displayDigits = 2; // For FIX (0-9) or SCI (1-9)

// Fraction display mode: 'DECIMAL' | 'FRACTION' | 'MIXED'
let fractionView = 'AUTO';

function message(text,error=false){
  $('calc-message').textContent=text;
  $('calc-message').classList.toggle('error',error);
}

function updateAnswerDisplay(){
  if (!completed) return;
  const val = lastResultObj;
  if (!val) {
    $('answer').textContent = '—';
    return;
  }

  if (val.isExact()) {
    if (fractionView === 'FRACTION') {
      $('answer').textContent = val.rational.formatFraction();
      return;
    }
    if (fractionView === 'MIXED') {
      $('answer').textContent = val.rational.formatMixed();
      return;
    }
    if (fractionView === 'DECIMAL') {
      $('answer').textContent = format(val, { displayMode, digits: displayDigits });
      return;
    }
    // AUTO: If fraction with den > 1, show fraction by default
    if (val.rational.den !== 1n) {
      $('answer').textContent = val.rational.formatFraction();
      return;
    }
  }

  $('answer').textContent = format(val, { displayMode, digits: displayDigits });
}

function getStatusPrefix() {
  const angleStr = mode === 'DEG' ? 'Grader (DEG)' : 'Radianer (RAD)';
  const fmtStr = displayMode === 'NORM' ? 'NORM' : `${displayMode} ${displayDigits}`;
  return `${angleStr} · ${fmtStr}`;
}

function invalidate(){
  completed=false;
  fractionView = 'AUTO';
  $('answer').textContent='—';
  message(getStatusPrefix() + ' · 12 gjeldende sifre');
}

function insert(text){
  const start=input.selectionStart??input.value.length;
  let value=input.value;
  let pos=start;

  if(completed){
    if(['+','−','×','÷','^','^2','%','!'].includes(text)){
      value='Ans';
      pos=value.length;
    } else {
      value='';
      pos=0;
    }
    input.value=value;
    input.setSelectionRange(pos,pos);
  }

  const a=input.selectionStart??pos,b=input.selectionEnd??a;
  if(input.value.length-(b-a)+text.length>LIMITS.length){
    message('Uttrykket er for langt.',true);
    return;
  }
  input.setRangeText(text,a,b,'end');
  invalidate();
  input.focus();
}

function run(){
  try{
    const res = calculate(input.value, mode, { memories: memoryStore, ans: ansValue });
    lastResultObj = res;
    ansValue = res; // Ans oppdateres kun ved vellykket beregning
    completed = true;
    fractionView = 'AUTO';
    updateAnswerDisplay();
    message(getStatusPrefix() + (res.isExact() ? ' · Eksakt brøksvar' : ' · Tilnærmet flyttall'));
  } catch(e) {
    $('answer').textContent='—';
    message(e.message,true);
    completed=false;
    // Mislykket beregning overskriver IKKE ansValue!
  }
}

function clear(){
  input.value='';
  lastResultObj = new CalcResult(0);
  completed=false;
  fractionView = 'AUTO';
  $('answer').textContent='0';
  message(getStatusPrefix() + ' · 12 gjeldende sifre');
  input.focus();
}

// Knappeklikk for data-insert
for(const b of document.querySelectorAll('[data-insert]')){
  b.addEventListener('pointerdown',e=>e.preventDefault());
  b.addEventListener('click',()=>insert(b.dataset.insert));
}

$('equals').addEventListener('click',run);
$('clear').addEventListener('click',clear);
$('backspace').addEventListener('click',()=>{
  const a=input.selectionStart??input.value.length,b=input.selectionEnd??a;
  input.setRangeText('',a===b?Math.max(0,a-1):a,b,'end');
  invalidate();
  input.focus();
});

input.addEventListener('input',invalidate);
input.addEventListener('keydown',e=>{
  if(e.key==='Enter'){e.preventDefault();run();}
  if(e.key==='Escape'){e.preventDefault();clear();}
});

// Vinkelmodus
for(const m of ['DEG','RAD']) {
  $(m.toLowerCase()).addEventListener('click',()=>{
    mode=m;
    $('deg').setAttribute('aria-pressed',String(m==='DEG'));
    $('rad').setAttribute('aria-pressed',String(m==='RAD'));
    invalidate();
  });
}

// Bytte mellom brøk (S<=>D) og blandet tall (a b/c)
if ($('btn-sd')) {
  $('btn-sd').addEventListener('click', () => {
    if (!completed || !lastResultObj) return;
    if (fractionView === 'AUTO' || fractionView === 'FRACTION') {
      fractionView = 'DECIMAL';
    } else {
      fractionView = 'FRACTION';
    }
    updateAnswerDisplay();
  });
}

if ($('btn-mixed')) {
  $('btn-mixed').addEventListener('click', () => {
    if (!completed || !lastResultObj) return;
    if (fractionView === 'MIXED') {
      fractionView = 'FRACTION';
    } else {
      fractionView = 'MIXED';
    }
    updateAnswerDisplay();
  });
}

// Visningsformat (NORM, FIX, SCI)
function updateFormatButtons() {
  if ($('fmt-norm')) $('fmt-norm').setAttribute('aria-pressed', String(displayMode === 'NORM'));
  if ($('fmt-fix')) $('fmt-fix').setAttribute('aria-pressed', String(displayMode === 'FIX'));
  if ($('fmt-sci')) $('fmt-sci').setAttribute('aria-pressed', String(displayMode === 'SCI'));
}

if ($('fmt-norm')) {
  $('fmt-norm').addEventListener('click', () => {
    displayMode = 'NORM';
    updateFormatButtons();
    if (completed) updateAnswerDisplay();
    else message(getStatusPrefix());
  });
}

if ($('fmt-fix')) {
  $('fmt-fix').addEventListener('click', () => {
    const val = prompt('Angi antall desimaler for FIX (0–9):', String(displayDigits));
    if (val !== null && /^[0-9]$/.test(val.trim())) {
      displayMode = 'FIX';
      displayDigits = parseInt(val.trim(), 10);
      updateFormatButtons();
      if (completed) updateAnswerDisplay();
      else message(getStatusPrefix());
    }
  });
}

if ($('fmt-sci')) {
  $('fmt-sci').addEventListener('click', () => {
    const val = prompt('Angi antall gjeldende sifre for SCI (1–9):', String(Math.max(1, displayDigits)));
    if (val !== null && /^[1-9]$/.test(val.trim())) {
      displayMode = 'SCI';
      displayDigits = parseInt(val.trim(), 10);
      updateFormatButtons();
      if (completed) updateAnswerDisplay();
      else message(getStatusPrefix());
    }
  });
}

// Minneoperasjoner: M+, M-, STO, RCL
function updateMemoryIndicator() {
  const hasMem = Object.values(memoryStore).some(v => v !== 0 && v !== 0n);
  if ($('mem-indicator')) {
    $('mem-indicator').hidden = !hasMem;
  }
}

if ($('btn-mplus')) {
  $('btn-mplus').addEventListener('click', () => {
    try {
      const cur = completed ? lastResultObj : calculate(input.value || '0', mode, { memories: memoryStore, ans: ansValue });
      const mVal = memoryStore['M'] || 0;
      const mCalc = (mVal instanceof CalcResult) ? mVal : new CalcResult(mVal);
      const res = calculate('M + (' + (cur.isExact() ? cur.rational.formatFraction() : cur.value) + ')', mode, { memories: memoryStore, ans: ansValue });
      memoryStore['M'] = res;
      updateMemoryIndicator();
      message(`M+ utført: M = ${format(res)}`);
    } catch (e) {
      message(e.message, true);
    }
  });
}

if ($('btn-mminus')) {
  $('btn-mminus').addEventListener('click', () => {
    try {
      const cur = completed ? lastResultObj : calculate(input.value || '0', mode, { memories: memoryStore, ans: ansValue });
      const res = calculate('M - (' + (cur.isExact() ? cur.rational.formatFraction() : cur.value) + ')', mode, { memories: memoryStore, ans: ansValue });
      memoryStore['M'] = res;
      updateMemoryIndicator();
      message(`M− utført: M = ${format(res)}`);
    } catch (e) {
      message(e.message, true);
    }
  });
}

if ($('btn-sto')) {
  $('btn-sto').addEventListener('click', () => {
    const memName = prompt('Lagre verdi i minne (A, B, C, D, E, F, M, X, Y):', 'A');
    if (!memName) return;
    const name = memName.trim().toUpperCase();
    if (!MEMORY_NAMES.includes(name)) {
      message('Ugyldig minnenavn. Bruk A, B, C, D, E, F, M, X eller Y.', true);
      return;
    }
    const val = completed ? lastResultObj : new CalcResult(0);
    memoryStore[name] = val;
    updateMemoryIndicator();
    message(`Lagret i minne ${name} = ${format(val)}`);
  });
}

if ($('btn-rcl')) {
  $('btn-rcl').addEventListener('click', () => {
    const memName = prompt('Hent verdi fra minne (A, B, C, D, E, F, M, X, Y):', 'M');
    if (!memName) return;
    const name = memName.trim().toUpperCase();
    if (!MEMORY_NAMES.includes(name)) {
      message('Ugyldig minnenavn. Bruk A, B, C, D, E, F, M, X eller Y.', true);
      return;
    }
    insert(name);
  });
}

// Tab navigation
function tab(name,focus=false){
  for(const n of ['calc','stats']){
    const selected=n===name;
    $(n+'-tab').setAttribute('aria-selected',String(selected));
    $(n+'-tab').tabIndex=selected?0:-1;
    $(n+'-panel').hidden=!selected;
  }
  $('deg').parentElement.hidden=name==='stats';
  if(focus)$(name+'-tab').focus();
}
for(const n of ['calc','stats']){
  $(n+'-tab').addEventListener('click',()=>tab(n));
  $(n+'-tab').addEventListener('keydown',e=>{
    if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
      e.preventDefault();
      tab(e.key==='Home'?'calc':e.key==='End'?'stats':n==='calc'?'stats':'calc',true);
    }
  });
}

// Statistikk
function clearStatsResults(){
  for(const n of ['n','mean','population','sample','sumX','sumX2','min','max']) {
    if ($('stat-'+n)) $('stat-'+n).textContent='—';
  }
  $('stats-message').textContent='';
}

let rowId=0;
function addRow(){
  if($('data-rows').children.length>=LIMITS.rows)return;
  const id=++rowId,row=document.createElement('div');
  row.className='data-row';
  const value=document.createElement('input');
  value.type='text';
  value.inputMode='decimal';
  value.maxLength=40;
  value.autocomplete='off';
  value.placeholder='0';
  value.setAttribute('aria-label','Verdi, rad '+id);
  const frequency=document.createElement('input');
  frequency.type='text';
  frequency.inputMode='numeric';
  frequency.maxLength=7;
  frequency.value='1';
  frequency.autocomplete='off';
  frequency.setAttribute('aria-label','Frekvens, rad '+id);
  const remove=document.createElement('button');
  remove.textContent='×';
  remove.setAttribute('aria-label','Fjern rad '+id);
  remove.addEventListener('click',()=>{
    row.remove();
    clearStatsResults();
    $('add-row').disabled=false;
    if(!$('data-rows').children.length)addRow();
  });
  for(const field of [value,frequency])field.addEventListener('input',clearStatsResults);
  row.append(value,frequency,remove);
  $('data-rows').append(row);
  $('add-row').disabled=$('data-rows').children.length>=LIMITS.rows;
  return value;
}

$('add-row').addEventListener('click',()=>addRow()?.focus());
$('stats-clear').addEventListener('click',()=>{
  $('data-rows').replaceChildren();
  rowId=0;
  clearStatsResults();
  for(let i=0;i<3;i++)addRow();
});

$('stats-calculate').addEventListener('click',()=>{
  try{
    const rows=[];
    for(const row of $('data-rows').children){
      const [v,f]=row.querySelectorAll('input');
      if(!v.value.trim()){
        if(f.value.trim()!==''&&f.value.trim()!=='1')throw new Error('En rad med frekvens må også ha en verdi.');
        continue;
      }
      if(!/^\d+$/.test(f.value.trim()))throw new Error('Frekvens må være et positivt heltall.');
      rows.push({value:parseScalar(v.value),frequency:Number(f.value)});
    }
    const result=statistics(rows);
    for(const n of ['n','mean','population','sample','sumX','sumX2','min','max']){
      if ($('stat-'+n)) $('stat-'+n).textContent=format(result[n]);
    }
    $('stats-message').textContent='';
  }catch(e){
    clearStatsResults();
    $('stats-message').textContent=e.message;
  }
});

for(let i=0;i<3;i++)addRow();
$('help-open').addEventListener('click',()=>$('help').showModal());
$('help-close').addEventListener('click',()=>$('help').close());

// Tilstandsmaskin for pålitelig offline-status
const OFFLINE_STATES = {
  UNSUPPORTED: 'UNSUPPORTED',
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  UNCONFIRMED: 'UNCONFIRMED'
};
let offlineState = OFFLINE_STATES.INITIALIZING;
let offlineDetail = '';

function setOfflineState(state, detail = '') {
  offlineState = state;
  if (detail) offlineDetail = detail;
  const badge = $('status-badge'), text = $('status-text');
  if (!badge || !text) return;

  const netDetail = navigator.onLine ? '' : ' · Nett frakoblet';

  switch (state) {
    case OFFLINE_STATES.READY:
      text.textContent = 'Klar for offlinebruk' + netDetail;
      badge.style.color = '#35695c';
      break;
    case OFFLINE_STATES.INITIALIZING:
      text.textContent = 'Klargjør offlinebruk …' + netDetail;
      badge.style.color = '#536770';
      break;
    case OFFLINE_STATES.UNCONFIRMED:
      text.textContent = (offlineDetail || 'Offlineberedskap kunne ikke bekreftes') + netDetail;
      badge.style.color = '#a32332';
      break;
    case OFFLINE_STATES.UNSUPPORTED:
      text.textContent = 'Service worker støttes ikke i denne nettleseren' + netDetail;
      badge.style.color = '#8a6d1b';
      break;
  }
}

window.addEventListener('online', () => setOfflineState(offlineState));
window.addEventListener('offline', () => setOfflineState(offlineState));

const TIMEOUT_MS = 6000;

function verifyWorkerWithChannel(worker) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const requestId = 'req_' + Math.random().toString(36).slice(2);
    const timer = setTimeout(() => {
      channel.port1.close();
      reject(new Error('Tidsavbrudd ved vent på verifisering fra service worker.'));
    }, TIMEOUT_MS);

    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      channel.port1.close();
      const res = event.data;
      if (!res || res.type !== 'VERIFY_CACHE_RESULT' || res.requestId !== requestId) {
        return reject(new Error('Uventet eller manglende svar-ID fra service worker.'));
      }
      resolve(res);
    };

    worker.postMessage({
      type: 'VERIFY_CACHE',
      requestId: requestId,
      expectedVersion: RELEASE.version
    }, [channel.port2]);
  });
}

function initServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    setOfflineState(OFFLINE_STATES.UNSUPPORTED);
    return;
  }

  setOfflineState(OFFLINE_STATES.INITIALIZING);

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (navigator.serviceWorker.controller) {
      checkActiveWorker(navigator.serviceWorker.controller);
    }
  });

  async function checkActiveWorker(worker) {
    if (!worker || worker !== navigator.serviceWorker.controller) {
      setOfflineState(OFFLINE_STATES.INITIALIZING);
      return;
    }

    try {
      const res = await verifyWorkerWithChannel(worker);
      if (res.version !== RELEASE.version) {
        setOfflineState(OFFLINE_STATES.UNCONFIRMED, 'Versjonsavvik i worker');
        console.warn('Eksamenskalkulator: Versjonsavvik.', { expected: RELEASE.version, got: res.version });
        return;
      }
      if (!res.verified) {
        setOfflineState(OFFLINE_STATES.UNCONFIRMED, 'Cache er ufullstendig');
        console.warn('Eksamenskalkulator: Cachen inneholder ikke samtlige påkrevde filer.', res);
        return;
      }
      setOfflineState(OFFLINE_STATES.READY);
    } catch (err) {
      setOfflineState(OFFLINE_STATES.UNCONFIRMED, 'Verifisering feilet');
      console.warn('Eksamenskalkulator: Feil under verifisering:', err.message);
    }
  }

  const initTimeout = setTimeout(() => {
    if (offlineState === OFFLINE_STATES.INITIALIZING) {
      setOfflineState(OFFLINE_STATES.UNCONFIRMED, 'Tidsavbrudd ved klargjøring');
    }
  }, TIMEOUT_MS);

  navigator.serviceWorker.register('./sw.js', { scope: './' })
    .then((reg) => {
      if (reg.installing) {
        reg.installing.addEventListener('statechange', (e) => {
          if (e.target.state === 'redundant') {
            clearTimeout(initTimeout);
            setOfflineState(OFFLINE_STATES.UNCONFIRMED, 'Installasjon feilet (redundant)');
          } else if (e.target.state === 'activated') {
            clearTimeout(initTimeout);
            if (navigator.serviceWorker.controller) {
              checkActiveWorker(navigator.serviceWorker.controller);
            }
          }
        });
      }

      navigator.serviceWorker.ready.then(() => {
        clearTimeout(initTimeout);
        if (navigator.serviceWorker.controller) {
          checkActiveWorker(navigator.serviceWorker.controller);
        } else {
          setOfflineState(OFFLINE_STATES.INITIALIZING, 'Venter på sidekontroll');
        }
      }).catch((err) => {
        clearTimeout(initTimeout);
        setOfflineState(OFFLINE_STATES.UNCONFIRMED);
        console.warn('Eksamenskalkulator: ready feilet:', err.message);
      });
    })
    .catch((err) => {
      clearTimeout(initTimeout);
      setOfflineState(OFFLINE_STATES.UNCONFIRMED, 'Registrering feilet');
      console.warn('Eksamenskalkulator: Registrering feilet:', err.message);
    });
}

window.addEventListener('load', initServiceWorker);
