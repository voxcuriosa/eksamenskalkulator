// Closed arithmetic grammar. Input is data and is never executed as JavaScript.
export const LIMITS = Object.freeze({length:2048,tokens:512,depth:48,rows:200,count:1000000});
export function finite(x) { if (!Number.isFinite(x)) throw new Error('Resultatet er utenfor tallområdet.'); return Object.is(x,-0)?0:x; }
export function calculate(source, mode='DEG') {
 if(!['DEG','RAD'].includes(mode)) throw new Error('Ugyldig vinkelmodus.');
 if(typeof source!=='string'||source.length>LIMITS.length) throw new Error('Uttrykket er for langt.');
 const s=source.replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replaceAll(',','.').replaceAll('π','pi');
 const tokens=[]; let i=0;
 while(i<s.length){ if(/\s/.test(s[i])){i++;continue;} const tail=s.slice(i); const n=tail.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/); const name=tail.match(/^[a-z]+/);
 if(n){tokens.push({type:'number',value:finite(Number(n[0]))});i+=n[0].length;} else if(name){tokens.push({type:name[0]});i+=name[0].length;} else if('+-*/^();%'.includes(s[i]))tokens.push({type:s[i++]}); else throw new Error('Bare tall og kalkulatorens regnefunksjoner er tillatt.');
 if(tokens.length>LIMITS.tokens)throw new Error('Uttrykket har for mange ledd.'); }
 tokens.push({type:'end'}); let p=0,depth=0;
 const peek=()=>tokens[p].type;
 const take=(t)=>{if(peek()!==t)throw new Error(t===')'?'Mangler en avsluttende parentes.':'Kontroller uttrykket og parentesene.');return tokens[p++];};
 const enter=(fn)=>{if(++depth>LIMITS.depth)throw new Error('For mange nestede uttrykk.');try{return finite(fn());}finally{depth--;}};
 const angle=x=>mode==='DEG'?x*Math.PI/180:x;
 const inverse=x=>mode==='DEG'?x*180/Math.PI:x;
 const functions={sqrt:x=>{if(x<0)throw new Error('Kvadratroten krever et tall større enn eller lik 0.');return Math.sqrt(x);},ln:x=>{if(x<=0)throw new Error('Logaritmer krever positive tall.');return Math.log(x);},log:x=>{if(x<=0)throw new Error('Logaritmer krever positive tall.');return Math.log10(x);},sin:x=>Math.sin(angle(x)),cos:x=>Math.cos(angle(x)),tan:x=>{const a=angle(x);if(Math.abs(Math.cos(a))<1e-15)throw new Error('Tangens er ikke definert for denne vinkelen.');return Math.tan(a);},asin:x=>inverse(Math.asin(x)),acos:x=>inverse(Math.acos(x)),atan:x=>inverse(Math.atan(x))};
 function primary(){return enter(()=>{let value;
 if(peek()==='number')value=tokens[p++].value;
 else if(peek()==='pi'){p++;value=Math.PI;}else if(peek()==='e'){p++;value=Math.E;}
 else if(peek()==='('){p++;value=sum();take(')');}
 else {const name=peek(); if(!Object.hasOwn(functions,name)&&name!=='root')throw new Error('Bruk tall eller en av kalkulatorens funksjoner.');p++;take('(');const a=sum();if(name==='root'){take(';');const b=sum();if(a===0)throw new Error('Rotgraden kan ikke være 0.');if(b<0&&(!Number.isInteger(a)||Math.abs(a%2)!==1))throw new Error('Negativt radikand krever en odde heltallig rotgrad.');value=b<0?-Math.pow(-b,1/a):Math.pow(b,1/a);}else value=functions[name](a);take(')');}
 while(peek()==='%'){p++;value/=100;}return finite(value);});}
 function power(){const a=primary();if(peek()==='^'){p++;const b=unary();if(a===0&&b===0)throw new Error('0 opphøyd i 0 er ikke definert her.');return finite(Math.pow(a,b));}return a;}
 function unary(){return enter(()=>{if(peek()==='+'){p++;return unary();}if(peek()==='-'){p++;return -unary();}return power();});}
 function product(){let a=unary();while(peek()==='*'||peek()==='/'){const op=tokens[p++].type,b=unary();if(op==='/'&&b===0)throw new Error('Kan ikke dele på 0.');a=finite(op==='*'?a*b:a/b);}return a;}
 function sum(){let a=product();while(peek()==='+'||peek()==='-'){const op=tokens[p++].type,b=product();a=finite(op==='+'?a+b:a-b);}return a;}
 if(peek()==='end')throw new Error('Skriv et regneuttrykk først.');const result=sum();if(peek()!=='end')throw new Error('Bruk × mellom faktorer. Kontroller parenteser og skilletegn.');return finite(result);
}
export function parseScalar(text){if(typeof text!=='string'||!/^[-+]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][-+]?\d+)?$/.test(text.trim()))throw new Error('Skriv én tallverdi per rad.');return finite(Number(text.trim().replace(',','.')));}
export function statistics(rows){if(!Array.isArray(rows)||rows.length===0||rows.length>LIMITS.rows)throw new Error('Legg inn mellom 1 og 200 verdier.');let n=0,mean=0,m2=0;
 for(const row of rows){const x=finite(row.value),w=row.frequency;if(!Number.isInteger(w)||w<1||n+w>LIMITS.count)throw new Error('Frekvens må være et positivt heltall. Maksimalt 1 000 000 observasjoner.');const total=n+w,delta=x-mean;mean=finite(mean+delta*(w/total));m2=finite(m2+delta*(x-mean)*w);n=total;}
 return {n,mean,population:finite(Math.sqrt(Math.max(0,m2/n))),sample:n>1?finite(Math.sqrt(Math.max(0,m2/(n-1)))):null};}
export function format(value){if(value===null)return '—';const rounded=Number(value.toPrecision(12)),abs=Math.abs(rounded);if(abs!==0&&(abs>=1e12||abs<1e-9)){const [m,e]=rounded.toExponential(11).split('e');return String(Number(m)).replace('.',',')+'E'+String(Number(e));}return rounded.toLocaleString('nb-NO',{maximumSignificantDigits:12,useGrouping:false});}
