import {calculate,statistics,parseScalar,format,LIMITS} from './engine.mjs';
const $=id=>document.getElementById(id),input=$('expression');let mode='DEG',completed=false,lastResult=0;
function message(text,error=false){$('calc-message').textContent=text;$('calc-message').classList.toggle('error',error);}
function invalidate(){completed=false;$('answer').textContent='—';message((mode==='DEG'?'Grader (DEG)':'Radianer (RAD)')+' · 12 gjeldende sifre i visningen');}
function insert(text){const start=input.selectionStart??input.value.length;let value=input.value;let pos=start;
 if(completed){if(['+','−','×','÷','^','^2','%'].includes(text)){value='('+String(lastResult)+')';pos=value.length;}else{value='';pos=0;}input.value=value;input.setSelectionRange(pos,pos);}
 const a=input.selectionStart??pos,b=input.selectionEnd??a;if(input.value.length-(b-a)+text.length>LIMITS.length){message('Uttrykket er for langt.',true);return;}
 input.setRangeText(text,a,b,'end');invalidate();input.focus();}
function run(){try{lastResult=calculate(input.value,mode);$('answer').textContent=format(lastResult);completed=true;message((mode==='DEG'?'Grader (DEG)':'Radianer (RAD)')+' · 12 gjeldende sifre i visningen');}catch(e){$('answer').textContent='—';message(e.message,true);completed=false;}}
function clear(){input.value='';lastResult=0;completed=false;$('answer').textContent='0';message((mode==='DEG'?'Grader (DEG)':'Radianer (RAD)')+' · 12 gjeldende sifre i visningen');input.focus();}
for(const b of document.querySelectorAll('[data-insert]')){b.addEventListener('pointerdown',e=>e.preventDefault());b.addEventListener('click',()=>insert(b.dataset.insert));}
$('equals').addEventListener('click',run);$('clear').addEventListener('click',clear);$('backspace').addEventListener('click',()=>{const a=input.selectionStart??input.value.length,b=input.selectionEnd??a;input.setRangeText('',a===b?Math.max(0,a-1):a,b,'end');invalidate();input.focus();});
input.addEventListener('input',invalidate);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run();}if(e.key==='Escape'){e.preventDefault();clear();}});
for(const m of ['DEG','RAD'])$(m.toLowerCase()).addEventListener('click',()=>{mode=m;$('deg').setAttribute('aria-pressed',String(m==='DEG'));$('rad').setAttribute('aria-pressed',String(m==='RAD'));invalidate();});
function tab(name,focus=false){for(const n of ['calc','stats']){const selected=n===name;$(n+'-tab').setAttribute('aria-selected',String(selected));$(n+'-tab').tabIndex=selected?0:-1;$(n+'-panel').hidden=!selected;}$('deg').parentElement.hidden=name==='stats';if(focus)$(name+'-tab').focus();}
for(const n of ['calc','stats']){$(n+'-tab').addEventListener('click',()=>tab(n));$(n+'-tab').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();tab(e.key==='Home'?'calc':e.key==='End'?'stats':n==='calc'?'stats':'calc',true);}});}
function clearStatsResults(){for(const n of ['n','mean','population','sample'])$('stat-'+n).textContent='—';$('stats-message').textContent='';}
let rowId=0;
function addRow(){if($('data-rows').children.length>=LIMITS.rows)return;const id=++rowId,row=document.createElement('div');row.className='data-row';const value=document.createElement('input');value.type='text';value.inputMode='decimal';value.maxLength=40;value.autocomplete='off';value.placeholder='0';value.setAttribute('aria-label','Verdi, rad '+id);const frequency=document.createElement('input');frequency.type='text';frequency.inputMode='numeric';frequency.maxLength=7;frequency.value='1';frequency.autocomplete='off';frequency.setAttribute('aria-label','Frekvens, rad '+id);const remove=document.createElement('button');remove.textContent='×';remove.setAttribute('aria-label','Fjern rad '+id);remove.addEventListener('click',()=>{row.remove();clearStatsResults();$('add-row').disabled=false;if(!$('data-rows').children.length)addRow();});for(const field of [value,frequency])field.addEventListener('input',clearStatsResults);row.append(value,frequency,remove);$('data-rows').append(row);$('add-row').disabled=$('data-rows').children.length>=LIMITS.rows;return value;}
$('add-row').addEventListener('click',()=>addRow()?.focus());$('stats-clear').addEventListener('click',()=>{$('data-rows').replaceChildren();rowId=0;clearStatsResults();for(let i=0;i<3;i++)addRow();});
$('stats-calculate').addEventListener('click',()=>{try{const rows=[];for(const row of $('data-rows').children){const [v,f]=row.querySelectorAll('input');if(!v.value.trim()){if(f.value.trim()!==''&&f.value.trim()!=='1')throw new Error('En rad med frekvens må også ha en verdi.');continue;}if(!/^\d+$/.test(f.value.trim()))throw new Error('Frekvens må være et positivt heltall.');rows.push({value:parseScalar(v.value),frequency:Number(f.value)});}const result=statistics(rows);for(const n of ['n','mean','population','sample'])$('stat-'+n).textContent=format(result[n]);$('stats-message').textContent='';}catch(e){clearStatsResults();$('stats-message').textContent=e.message;}});
for(let i=0;i<3;i++)addRow();$('help-open').addEventListener('click',()=>$('help').showModal());$('help-close').addEventListener('click',()=>$('help').close());

// Tilstandsmaskin for pålitelig offline-status
const OFFLINE_STATES = {
  UNSUPPORTED: 'UNSUPPORTED',
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  UNCONFIRMED: 'UNCONFIRMED'
};
let offlineState = OFFLINE_STATES.INITIALIZING;

function setOfflineState(state, detail = '') {
  offlineState = state;
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
      text.textContent = (detail || 'Offlineberedskap kunne ikke bekreftes') + netDetail;
      badge.style.color = '#a32332';
      break;
    case OFFLINE_STATES.UNSUPPORTED:
      text.textContent = 'Service worker støttes ikke i denne nettleseren' + netDetail;
      badge.style.color = '#8a6d1b';
      break;
  }
}

// Lytter på nettverkstilstand kun som veiledende signal (endrer ikke verifisert cache-tilstand)
window.addEventListener('online', () => setOfflineState(offlineState));
window.addEventListener('offline', () => setOfflineState(offlineState));

function initServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    setOfflineState(OFFLINE_STATES.UNSUPPORTED);
    return;
  }

  setOfflineState(OFFLINE_STATES.INITIALIZING);

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'VERIFY_CACHE_RESULT') {
      if (event.data.verified && navigator.serviceWorker.controller) {
        setOfflineState(OFFLINE_STATES.READY);
      } else {
        setOfflineState(OFFLINE_STATES.UNCONFIRMED, 'Cache er ufullstendig');
        console.warn('Eksamenskalkulator: Verifisering av offline-cache feilet.', event.data);
      }
    }
  });

  navigator.serviceWorker.register('./sw.js', { scope: './' })
    .then((reg) => {
      // Hvis siden allerede er kontrollert og worker er aktiv:
      const checkActive = () => {
        const worker = reg.active || navigator.serviceWorker.controller;
        if (worker) {
          worker.postMessage({ type: 'VERIFY_CACHE' });
        } else {
          setOfflineState(OFFLINE_STATES.INITIALIZING);
        }
      };

      if (reg.installing) {
        reg.installing.addEventListener('statechange', (e) => {
          if (e.target.state === 'activated') {
            checkActive();
          }
        });
      }

      if (reg.waiting) {
        // En ny versjon venter; behold eksisterende versjon i denne elevøkten
        console.info('Eksamenskalkulator: En ny programversjon venter til neste økt.');
      }

      navigator.serviceWorker.ready.then(() => {
        checkActive();
      }).catch((err) => {
        setOfflineState(OFFLINE_STATES.UNCONFIRMED);
        console.error('Eksamenskalkulator: Feil under klargjøring av service worker:', err);
      });
    })
    .catch((err) => {
      setOfflineState(OFFLINE_STATES.UNCONFIRMED);
      console.error('Eksamenskalkulator: Registrering av service worker feilet:', err);
    });
}

window.addEventListener('load', initServiceWorker);
