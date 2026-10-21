# Eksamenskalkulator 2027 – Teknisk demo

Dette prosjektet er en statisk, avgrenset vitenskapelig kalkulator utviklet som forslag til en alternativ eksamensgjennomføring for Utdanningsdirektoratet (Udir) fra våren 2027.

Målet er å demonstrere at en digital lommeregner kan kjøres lokalt på enheten i Safe Exam Browser (SEB) med et strengt kontrollert funksjonssett, uten eksterne nettverksavhengigheter, kontoer eller beregningsservere.

> **Status:** Dette er et uavhengig teknisk forslag og en demo. Løsningen er ikke formelt godkjent av Udir til eksamen.

---

## 1. Funksjonsomfang (Versjon 0.4.0)

Kalkulatoren dekker Udirs uttrykkelig omtalte funksjonskrav samt standardfunksjonalitet fra anerkjente skolekalkulatorer:
* **Brøkregning og rasjonal aritmetikk:** Ekte og uekte brøker, blandet tall (`a b/c`), automatisk forkorting og veksling mellom brøk og desimaltall (`S⇔D`).
* **Kombinatorikk:** Fakultet ($n!$ for $n \in [0, 69]$), permutasjoner ($n\text{Pr}$) og kombinasjoner ($n\text{Cr}$).
* **Ans og minnevariabler:** `Ans` for forrige numeriske resultat. Ni uavhengige tallminner (`A, B, C, D, E, F, M, X, Y`), `M+`, `M−`, `STO` og `RCL`. Minner beholdes kun i sidens minne og slettes ved ny økt.
* **Elementære funksjoner:** Kvadratrøtter, $n$-te rot (`root(n; x)`), logaritmer ($\log$, $\ln$), potenser, $10^x$, $e^x$, trigonometri ($\sin, \cos, \tan$, inverse) i både DEG og RAD.
* **Envariabel statistikk:** Observasjoner ($n$), sum ($\sum x$), kvadratsum ($\sum x^2$), minimum ($\min$), maksimum ($\max$), gjennomsnitt ($\bar{x}$), populasjonsstandardavvik ($\sigma$) og utvalgsstandardavvik ($s$).
* **Visningsformater:** `NORM` (inntil 12 gjeldende sifre), `FIX` (fast antall desimaler 0–9) og `SCI` (vitenskapelig notasjon 1–9 gjeldende sifre).

---

## 2. Faglige vurderinger og bevisst utelatte funksjoner

Følgende funksjoner fra tradisjonelle vitenskapelige lommeregnere er **bevisst utelatt** i denne løsningen. Dette er gjort av hensyn til eksamensreglementet for 2027 og krever eventuell eksplisitt avklaring med Udir:

1. **Eksakt rotforenkling og symbolsk $\pi$ (f.eks. $\sqrt{8} \rightarrow 2\sqrt{2}$):**
   * *Vurdering:* Krever en symbolsk algebra-motor (CAS). Udir har eksplisitt forbudt CAS og symbolsk regning på Del 2. Hvis kalkulatoren automatisk forenkler $\sqrt{12}$ til $2\sqrt{3}$ eller forkorter eksakte $\pi$-brøker, kan det overprøve oppgaver som skal teste elevens egen algebraforståelse på papir.
2. **Regresjonsanalyse og tovariabel statistikk:**
   * *Vurdering:* Udir har fjernet kravet om regresjon på Del 2 ettersom PC (GeoGebra/Excel) fjernes. Innebygde regresjonsmodeller risikerer å flytte fokuset fra matematisk modellering på papir til testing av tasteferdigheter.
3. **Automatiske verditabeller for funksjoner ($f(x)$):**
   * *Vurdering:* Funksjonstabeller grenser tett opp mot grafiske kalkulatorer og programmerbare verktøy, som er forbudt under eksamen.
4. **Grader, minutter, sekunder ($^\circ\ '\ ''$) og Gradianer (GRA):**
   * *Vurdering:* Vinkelmålene gradianer og vinkelminutter/sekunder inngår ikke i læreplanene (LK20) for videregående skole i Norge. Å inkludere dem øker risikoen for at elever feilaktig havner i feil vinkelmodus under eksamen.
5. **Hyperbolske funksjoner ($\sinh, \cosh, \tanh$):**
   * *Vurdering:* Ikke en del av kompetansemålene i videregående opplæring og derfor utelatt for å holde grensesnittet ryddig.
6. **Programmering og skripting:**
   * *Vurdering:* Fra 2027 innføres oppgaver i R1 og S1 der elevene skal skrive programmer. Udir har presisert at dette skal gjøres **for hånd med penn på eksamenspapiret**. Kalkulatoren skal ifølge regelverket *ikke* være programmerbar.

---

## 3. Arkitektur og sikkerhet

* **Separasjon mellom eksamen og informasjon:**
  - `index.html`: Eksklusiv eksamenskalkulator i SEB. Ingen eksterne lenker eller markedsføring.
  - `info.html`: Separat informasjonsside for lærere, skoleledere og Udir, med kostnadsscenarioer og SEB-demofil.
* **Lukket beregningsmotor:** Deterministisk, rekursiv parser for numeriske uttrykk. Inndata behandles som data, aldri som programkode (ingen `eval`, `Function`, `innerHTML` eller skripting).
* **Frosset versjonering og offlineberedskap (`sw.js`):**
  - Entydig versjon (`v0.4.0`) med unikt cacheprefiks (`eksamenskalkulator-v0.4.0`).
  - Sletter utelukkende egne cacher og rører aldri andre cacher på opprinnelsen.
  - Ingen generell nettverksfallback: ukjente adresser avvises med 404/403.
  - Pålitelig toveis verifisering via `MessageChannel` med unik `requestId`. Status «Klar for offlinebruk» settes først når samtlige nødvendige filer er bekreftet i cachen av aktiv worker.
* **Content Security Policy (CSP):**
  - Kalkulatoren har `connect-src 'none'`: umuliggjør utgående nettverkstrafikk eller overføring av elevinndata under kjøring.
  - Workeren har en separat, minimal policy med `connect-src 'self'` for nødvendig intern installasjon.
* **Safe Exam Browser (SEB):**
  - Demofil (`eksamenskalkulator.seb`) med offisielle SEB-nøkler (`URLFilterEnable`, `URLFilterRules`).
  - Tillater kun kalkulatorens 8 nøyaktige app-stier og blokkerer automatisk all annen trafikk, nye vinduer, utviklerverktøy og fildeling.

---

## 4. Testkjøring

Prosjektet har en omfattende testsuite:
```bash
# Kjør matematiske tester, kravkontroller og sikkerhetsrevisjon
node test.mjs
node test-requirements.mjs
node test-new-engine.mjs
node test-comprehensive.mjs
node test-sw-logic.mjs
node verify-security.mjs
```

Start lokal testtjener:
```bash
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```
Åpne `http://127.0.0.1:8765/`.
