# Bokklubb — projektregler

## Arkitektur
- Domänlogik lever i `src/domain/` — ren JS, inga React-importer, inga Firebase-importer
- Firebase-access lever i `src/firebase/` — repositories/services
- React-komponenter får INTE innehålla råa Firestore-queries
- Varje page är en egen fil i `src/pages/`
- Delade komponenter i `src/components/`
- Global state via React Context i `src/context/` — en context per domänarea (BooksContext, AuthContext, PhotosContext, PlanningContext, RecipesContext, SuggestionsContext). Pages konsumerar context via hooks, skriver aldrig direkt till Firebase.

## Arbetsregler
- Gör små ändringar — max en feature area per task
- Ändra inte röstlogik utan att uppdatera/lägga till tester
- Inför inte nya dependencies utan explicit godkännande
- Skriv inte om fungerande kod bara för stil
- Kör tester efter varje ändring
- I Codex-sandboxen kan `npm.cmd test`/`npm.cmd run build` falla på esbuild `spawn EPERM`; då räcker syntax/diff-check och lokal verifiering
- Sammanfatta ändrade filer och beteendepåverkan efter varje uppgift

## Byggprinciper (Karpathy)

Beteenderegler för att minska vanliga LLM-kodfel. **Avvägning:** principerna favoriserar försiktighet före hastighet. För triviala uppgifter — använd omdöme.

### 1. Tänk innan du kodar
**Anta inget. Dölj inte förvirring. Lyft fram avvägningar.**

Innan implementation:
- Uttala antaganden explicit. Vid osäkerhet — fråga.
- Vid flera tolkningar — presentera dem, välj inte tyst.
- Om enklare approach finns — säg det. Pusha tillbaka när befogat.
- Om något är oklart — stanna. Namnge det förvirrande. Fråga.

### 2. Enkelhet först
**Minsta kod som löser problemet. Inget spekulativt.**

- Inga features utöver det som efterfrågats.
- Inga abstraktioner för engångskod.
- Ingen "flexibilitet" eller "konfigurerbarhet" som inte begärts.
- Ingen felhantering för omöjliga scenarier.
- Om du skrev 200 rader och det kunde varit 50 — skriv om.

Fråga dig: "Skulle en senior ingenjör säga att det här är överkomplicerat?" Om ja — förenkla.

### 3. Kirurgiska ändringar
**Rör bara det du måste. Städa bara din egen röra.**

Vid redigering av befintlig kod:
- "Förbättra" inte angränsande kod, kommentarer eller formatering.
- Refaktorera inte sådant som inte är trasigt.
- Matcha befintlig stil, även om du själv gjort annorlunda.
- Om du ser orelaterad död kod — nämn den, radera inte.

När dina ändringar skapar orphans:
- Ta bort imports/variabler/funktioner som DINA ändringar gjort oanvända.
- Ta inte bort tidigare död kod om inte ombedd.

Testet: Varje ändrad rad ska kunna spåras direkt till användarens begäran.

### 4. Målstyrd exekvering
**Definiera framgångskriterier. Loopa tills verifierat.**

Förvandla uppgifter till verifierbara mål:
- "Lägg till validering" → "Skriv tester för ogiltig input, få dem att passera"
- "Fixa buggen" → "Skriv test som reproducerar den, få det att passera"
- "Refaktorera X" → "Säkerställ att tester passerar före och efter"

För flerstegsuppgifter — uttala kort plan:
```
1. [Steg] → verifiera: [check]
2. [Steg] → verifiera: [check]
3. [Steg] → verifiera: [check]
```

Starka framgångskriterier låter dig loopa självständigt. Svaga kriterier ("få det att funka") kräver ständig klargöring.

**Principerna fungerar om:** färre onödiga ändringar i diffar, färre omskrivningar pga överkomplicering, klargörande frågor kommer före implementation istället för efter misstag.

## Stack (håll minimalt)
- Vite + React + react-router-dom
- Firebase (auth + firestore + storage)
- Vitest för tester
- INGEN TypeScript, Tailwind, Zustand, TanStack Query, shadcn eller komponentbibliotek i första slicen

## Domänregler
- Reveal sker BARA när 5/5 medlemmar röstat (preliminaryVotes.submitted === true)
- finalAverage = sum(alla 5 finalJudgments.vote) / 5 — exakt division, inte filtrering
- averageChange = sum(final.vote - preliminary.vote för varje medlem) / 5
- votesChanged = antal av 5 där final.vote !== preliminary.vote
- Preliminär röst och slutomdöme är separata koncept med separata Firestore-fält
- currentBook hanteras via isCurrentBook-fältet på bokdokumentet (verifierat i originalet)
- Bakåtkompatibilitet: gamla böcker har bara ratings{}, saknar preliminaryVotes/finalJudgments
- Genomsnitt för visning: `book.finalAverage || getAverageRating(book.ratings || {})`

## Domänspec
Fullständig specifikation finns i `docs/DOMAIN_SPEC.md` — läs den innan du rör röstlogik, Firebase-struktur eller fas-systemet.
