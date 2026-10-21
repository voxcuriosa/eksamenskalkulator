import assert from 'node:assert/strict';
import {calculate as c,statistics as stats,parseScalar,format} from './dist/engine.mjs';
let checks=0;function close(actual,expected,tol=1e-12){assert.ok(Math.abs(actual-expected)<=tol*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);checks++;}function rejects(s){assert.throws(()=>c(s));checks++;}
for(const [s,n] of [['2+3*4',14],['(2+3)*4',20],['-2^2',-4],['(-2)^2',4],['2^-3',.125],['2^3^2',512],['1,5E-3',.0015],['sqrt(81)',9],['root(3;-27)',-3],['root(-3;-8)',-.5],['log(1000)',3],['ln(e)',1],['sin(30)',.5],['cos(60)',.5],['tan(45)',1],['asin(0.5)',30],['acos(0.5)',60],['atan(1)',45],['200*10%',20],['200+10%',200.1],['1/2+1/3',5/6],['10^(3)',1000],['e^(0)',1],['2×(3−1)÷4',1]])close(c(s),n);
close(c('sin(pi/2)','RAD'),1);close(c('acos(-1)','RAD'),Math.PI);
for(const s of ['', '1/0','0^0','sqrt(-1)','log(0)','asin(2)','tan(90)','root(0;2)','root(2;-1)','1e999','2(3)','x+2','solve(x)','window','constructor(1)','fetch(1)','alert(1)','1;2','1=1','[1]','<script>','1/*x*/2','1+','('.repeat(100)+'1'+')'.repeat(100),'-'.repeat(100)+'1','1+'.repeat(600)+'1','1'.repeat(2050)])rejects(s);
const standard=stats([2,4,4,4,5,5,7,9].map(value=>({value,frequency:1})));close(standard.n,8);close(standard.mean,5);close(standard.population,2);close(standard.sample,Math.sqrt(32/7));
const weighted=stats([{value:1,frequency:2},{value:3,frequency:2}]);close(weighted.mean,2);close(weighted.population,1);close(weighted.sample,Math.sqrt(4/3));
assert.equal(stats([{value:5,frequency:1}]).sample,null);checks++;
const shifted=stats([{value:1e12+1,frequency:1},{value:1e12+2,frequency:1},{value:1e12+3,frequency:1}]);close(shifted.sample,1);
for(const rows of [[],[{value:1,frequency:0}],[{value:1,frequency:1.1}],[{value:Infinity,frequency:1}],[{value:1,frequency:1000001}]]){assert.throws(()=>stats(rows));checks++;}
close(parseScalar('-1,2E3'),-1200);for(const x of ['1+2','1;2','Infinity','NaN','0x10','']){assert.throws(()=>parseScalar(x));checks++;}assert.equal(format(.30000000000000004),'0,3');checks++;
for(let a=-20;a<=20;a++){for(let b=1;b<=10;b++){close(c(`(${a})*${b}+${b}^2`),a*b+b*b);close(c(`(${a})/${b}`),a/b);}}
console.log(`${checks} kontroller bestått: regnerekkefølge, funksjoner, statistikk, grenser og avvist kode.`);
