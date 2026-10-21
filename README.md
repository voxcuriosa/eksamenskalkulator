# Eksamenskalkulator 2027 – demo 0.1

En statisk, avgrenset vitenskapelig kalkulator som forslag til Udir. Alle beregninger utføres lokalt. Ingen avhengigheter, kontoer eller eksterne ressurser. Ikke godkjent til eksamen og ennå ikke testet inne i SEB.

## Åpne og teste

Server `dist/` med en statisk HTTP-server. For eksempel `python3 -m http.server 8765 --bind 127.0.0.1 --directory dist`. Åpne http://127.0.0.1:8765. HTML-moduler krever HTTP(S); dobbeltklikk på HTML-filen er ikke støttet. Kjør `node test.mjs` for beregningskontrollene.

For Udir eller fylkeskommunal hosting kan innholdet i `dist/` legges på en dedikert HTTPS-opprinnelse. Ingen database eller beregningsserver er nødvendig. Sites-publiseringen er en privat fremvisning med vertsleverandørens tilgangslag; den er ikke en kontrollert eksamensinstallasjon. Det selvstendige statiske innholdet er leveransen til slik hosting.

## Kravgrunnlag – våren 2027

Kontrollert 21. oktober 2026 mot Udirs «Endringer i eksamen», sist endret 16. oktober 2026:
https://www.udir.no/eksamen-og-prover/eksamen/slik-endrer-vi-eksamen/

Udir beskriver en enkel vitenskapelig kalkulator med kvadratrøtter, logaritmer, sinus, cosinus, tangens og standardavvik. Grafiske, likningsløsende, programmerbare og kommuniserende kalkulatorer er ikke tillatt. Datamaskin er fjernet som ordinært hjelpemiddel på del 2. Dette prosjektet er et forslag om en alternativ gjennomføring, ikke en påstand om at SEB gjør løsningen tillatt under dagens regler.

Kilden angir ikke en uttømmende positivliste over funksjoner. «Alle tillatte funksjoner og ingenting annet» kan derfor ikke sertifiseres ut fra denne teksten alene. Alle uttrykkelig omtalte regnefunksjoner er implementert. Grunnleggende betjening og inverse funksjoner nedenfor er produktets foreslåtte avgrensning og må også vurderes av Udir. Udirs søkeresultater for nye eksempeloppgaver ble funnet, men oppgaveheftene kunne ikke leses i denne gjennomgangen. Ingen funksjoner er tatt inn med en påstand om at eksempeloppgavene godkjenner dem.

## Funksjonsmatrise

| Funksjoner | Implementert | Grunnlag |
|---|---|---|
| Kvadratrot | Ja | Uttrykkelig omtalt av Udir |
| log base 10 og ln | Ja | Udirs kategori logaritmer |
| sin, cos, tan | Ja | Uttrykkelig omtalt av Udir |
| Standardavvik, populasjon og utvalg | Ja | Udirs kategori standardavvik; begge konvensjoner er merket |
| Tall, + − × ÷, fortegn, parenteser, desimaler | Ja | Foreslått grunnleggende kalkulatorbetjening |
| Potenser, kvadrat, n-te rot, 10^x, e^x | Ja | Foreslått grunnleggende vitenskapelig tallregning |
| π, e, vitenskapelig notasjon og prosent (/100) | Ja | Foreslått grunnleggende tallregning |
| Invers sin/cos/tan og DEG/RAD | Ja | Foreslått avgrensning av trigonometriske funksjoner |
| Frekvenser, antall og gjennomsnitt | Ja | Grunnlag for standardavviksberegning |
| Graftegning, likningsløsing, programmering | Nei | Uttrykkelig forbudt kategori |
| Kommunikasjonsfunksjoner i kalkulatoren | Nei | Uttrykkelig forbudt kategori; statisk distribusjon er egen problemstilling |
| CAS, symbolsk regning, variabler, makroer | Nei | Utenfor foreslått funksjonssett |
| Regresjon, verditabeller, derivasjon, integrasjon | Nei | Ikke lagt til uten konkret avklaring |
| Fakultet, nCr/nPr, fordelingsverktøy, matriser, komplekse tall | Nei | Ikke lagt til uten konkret avklaring |
| Formelbank, forklarte løsninger, regneark, filimport, eksport | Nei | Utenfor foreslått funksjonssett |

## Sikkerhetsarkitektur

`engine.mjs` inneholder en lukket rekursiv parser for numeriske uttrykk. Bare tall, godkjente matematiske funksjonsnavn, operatorer og parenteser kan tolkes. Ingen eval, Function-konstruktør, kodegenerering, plugins, nettverkskall, scriptinnlasting fra elevinndata eller generell programmeringsmotor. Inndata behandles med tekst-/input-API-er, aldri som HTML.

HTML setter CSP med `connect-src 'none'`, `default-src 'none'`, lokale script- og stilfiler, sperret worker-/frame-/objekt-/medieinnlasting og skjemainnsending. `_headers` angir tilsvarende serverheadere, inkludert frame-ancestors og Permissions-Policy. Verten må faktisk anvende disse; `_headers` er ikke automatisk støttet av alle servere. Etiketten om lokal beregning sier ikke at hele datamaskinen er isolert.

Bare app.mjs, engine.mjs og styles.css lastes av kalkulatorsiden. Ingen fetch, WebSocket, beacon, service worker, webfonter, analyse, tredjepartsbiblioteker, lokal lagring eller cookies brukes i kildekoden. Inndata og resultater oppbevares bare i sidens minne. Nettleser, operativsystem og privat vertsleverandørs tilgangslag ligger utenfor denne kildekodens kontroll.

Dette er fast JavaScript-programkode, ikke fravær av en JavaScript-motor. Eleven får ingen mulighet for å utføre egen kode gjennom kalkulatorens parser. Et absolutt fravær av scriptmotor krever en annen teknisk arkitektur.

## Offline og nettverk

Nett kreves for første innlasting fra server. Etter at alle ressurser er lastet, virker kalkulatoren uten server. Dette er verifisert ved å stoppe den lokale serveren og deretter beregne i det åpne vinduet. Dette beviser fortsatt drift etter serverbortfall, ikke isolasjon av hele enheten. Oppstart eller oppfriskning uten nett er ikke garantert. Ingen service worker eller vedvarende offline-cache er lagt til. HTTP-headere foreslår no-store for å unngå at gamle eksamensversjoner brukes utilsiktet.

## SEB-pilot før eksamensbruk

1. Udir avklarer funksjonsmatrisen og eventuell alternativ hjelpemiddelordning.
2. Fastsett eksakte støttede SEB- og OS-versjoner.
3. Host kun frosne, versjonerte ressurser på en dedikert HTTPS-opprinnelse; ingen brukerinnhold, opplasting eller generelle API-er på samme opprinnelse.
4. Bruk administrert SEB-konfigurasjon med tillatelsesliste for eksakt nødvendige sider/ressurser, innholdsfiltrering og sperrede utviklerverktøy, øvrig navigasjon og filoverføring. Ikke tillat hele udir.no eller et generelt fylkesdomene.
5. Verifiser CSP-headere, nettverkstrafikk, manipulerte filer og inndata, eksamenskonfigurasjon, vindusbytte og nettverksbrudd på Windows/macOS. BEK/CK kan inngå i kontroll av SEB-konfigurasjonen, men er ikke alene integritetsbevis for alle nettsidefiler.
6. Ekstern sikkerhetsgjennomgang, tilgjengelighetstest med elever og matematikkfaglig kontroll før pilot.

SEB-dokumentasjon: https://www.safeexambrowser.org/developer/seb-integration.html og https://www.safeexambrowser.org/macosx/mac_usermanual_en.html

## Numeriske grenser

IEEE-754 double brukes med opptil 12 gjeldende sifre i visningen. Ingen eksakt symbolsk brøkregning. Ingen automatisk likningsløsing. Prosent betyr alltid del på 100: 200+10% = 200,1. Eksplisitt multiplikasjon kreves. 0^0 avvises. Overflow og ikke-reelle resultater avvises; ekstrem underflow kan avrundes til null. Tangens avvises nær representerte poler. Parseren begrenser uttrykk til 2048 tegn, 512 tokens og 48 rekursjonsnivåer. Statistikk begrenses til 200 rader og 1 000 000 observasjoner. Avrunding og numerisk nøyaktighet må faglig valideres før eksamen.
