# Bokklubb — projektregler

## Arkitektur
- Domänlogik lever i `src/domain/` — ren JS, inga React-importer, inga Firebase-importer
- Firebase-access lever i `src/firebase/` — repositories/services
- React-komponenter får INTE innehålla råa Firestore-queries
- Varje page är en egen fil i `src/pages/`
- Delade komponenter i `src/components/`

## Arbetsregler
- Gör små ändringar — max en feature area per task
- Ändra inte röstlogik utan att uppdatera/lägga till tester
- Inför inte nya dependencies utan explicit godkännande
- Skriv inte om fungerande kod bara för stil
- Kör tester efter varje ändring
- Sammanfatta ändrade filer och beteendepåverkan efter varje uppgift

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
