# Eksamenskalkulator 2027 – Teknisk demo

Dette prosjektet er en statisk, avgrenset vitenskapelig kalkulator utviklet som forslag til en alternativ eksamensgjennomføring for Utdanningsdirektoratet (Udir) fra våren 2027.

Målet er å demonstrere at en digital lommeregner kan kjøres lokalt på enheten i Safe Exam Browser (SEB) med strengt kontrollert funksjonssett, uten eksterne nettverksavhengigheter, kontoer eller beregningsservere.

> **Status:** Dette er et uavhengig teknisk forslag og en demo. Løsningen er ikke formelt godkjent av Udir til eksamen.

## Arkitektur og nøkkelkomponenter

1. **Separasjon mellom kalkulator og presentasjon:**
   - Selve eksamenskalkulatoren (`index.html`): Inneholder kun kalkulator, statistikk, lokal brukerveiledning og statuslinje. Ingen eksterne kildelenker, markedsføring eller unntak fra eksamensmiljøets sperrer.
   - Informasjonssiden (`info.html`): Ligger separat og inneholder bakgrunn, kostnadsscenarioer, SEB-demofil for nedlasting, kildehenvisninger og teknisk dokumentasjon.
2. **Lukket beregningsmotor (`engine.mjs`):**
   - Deterministisk, rekursiv parser for numeriske uttrykk.
   - Inndata behandles utelukkende som data, aldri som programkode (ingen `eval`, `Function`, `innerHTML` eller script-injeksjon).
   - Avgrensning: Ingen graftegner, likningsløser, CAS/symbolregning, variabler eller formelbank.
3. **Frosset versjonering og offlineberedskap (`sw.js`):**
   - Service Worker med entydig versjonsnummer (`v0.2.0`) og unikt cacheprefiks (`eksamenskalkulator-`).
   - Sletter kun gamle versjoner med eget prefiks og rører aldri andre cacher på domenet.
   - Installer alle ressurser samlet; `skipWaiting()` kalles ikke ubetinget i installasjonsfasen, slik at en aktiv elevøkt ikke kapres av nye versjoner.
   - Pålitelig tilstandsmaskin i brukergrensesnittet bekrefter offlineberedskap først etter at workeren er aktiv, kontrollerer siden og har verifisert at alle ressurser foreligger i cachen.
4. **Sikkerhet og Content Security Policy (CSP):**
   - Kalkulatoren har `connect-src 'none'`, som forhindrer alle utgående API-kall, fetch og WebSockets under kjøring.
   - Service Worker har en separat policy med `connect-src 'self'` slik at den kan hente og oppdatere de fast definerte programfilene fra samme opprinnelse.
5. **Safe Exam Browser (SEB):**
   - Demofil (`eksamenskalkulator.seb`) med offisielle SEB-nøkkelnavn (`URLFilterEnable`, `URLFilterRules`).
   - Tillater kun `https://voxcuriosa.no/kalkulator/*` og blokkerer automatisk all annen trafikk.

## Testkjøring lokalt

Kjør beregningstestene, kravkontrollene og sikkerhetsverifiseringen:
```bash
node test.mjs
node test-requirements.mjs
node test-sw-logic.mjs
node verify-security.mjs
```

Start en lokal statisk tjener for manuell testing:
```bash
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```
Åpne `http://127.0.0.1:8765/`.
