# Bokklubb — Domänspecifikation

Referensdokument för React-migrationen. Allt här är verifierat mot originalmonoliten (`git show 8d2b73e:public/index.html`).

---

## Firebase-projekt

```
projectId:         bokklubb-21022
authDomain:        bokklubb-21022.firebaseapp.com
storageBucket:     bokklubb-21022.firebasestorage.app
```

---

## Collections

### `books/{docId}`

Alla böcker. `docId` är auto-genererat av Firestore (`addDoc`).

```js
{
  // Grundinfo
  title:        string,
  author:       string,
  season:       number,
  chosenBy:     string,          // ett av members[]
  dateAdded:    ISO string,
  meetingDate:  string | null,   // "YYYY-MM-DD" eller null

  // Fas-system
  phase:          'preliminary_voting' | 'revealed' | 'discussion' | 'finalized',
  isCurrentBook:  boolean,       // max en bok true åt gången

  // Förhandsröster (hemliga tills alla 5 röstat)
  preliminaryVotes: {
    [memberName]: {
      vote:        number | null,   // 1–10
      comment:     string,          // max 120 tecken
      submitted:   boolean,
      submittedAt: ISO string | null
    }
  },

  // Slutomdömen (efter diskussion)
  finalJudgments: {
    [memberName]: {
      vote:                   number | null,
      comment:                string,
      submitted:              boolean,
      submittedAt:            ISO string | null,
      changedFromPreliminary: boolean
    }
  },

  // Tidsstämplar
  preliminaryRevealedAt:  ISO string | null,
  discussionStartedAt:    ISO string | null,
  finalizedAt:            ISO string | null,

  // Omslag
  coverUrl: string | null,  // cachas i Firestore efter API-hämtning

  // Statistik (sätts vid finalisering)
  preliminaryAverage: number,   // genomsnitt av preliminaryVotes
  finalAverage:       number,   // genomsnitt av finalJudgments
  votesChanged:       number,   // antal av 5 som ändrade sig
  averageChange:      number,   // (finalAverage - preliminaryAverage)

  // Legacy (bakåtkompatibilitet)
  ratings:    { [memberName]: number },  // kopia av finalJudgments.vote vid finalisering
  food:       string,
  recipeLink: string
}
```

**Firestore-query för böcker:**
```js
query(collection(db, 'books'), orderBy('season'), orderBy('dateAdded', 'desc'))
```

### `users/{email}`

En dokument per användare, nyckel = e-postadress.

```js
{
  displayName: string,   // matchar ett namn i members[]
  role:        'admin' | string  // 'admin' ger extra rättigheter
}
```

### `appState/config`

Enda dokumentet. Spårar aktuell bok.

```js
{
  currentBookId: string | null,
  lastUpdated:   ISO string,
  version:       "2.0"
}
```

---

## Medlemmar

```js
const members = ['Viktor', 'Armando', 'Pontus', 'Oskar', 'Aaron'];
```

**Email → Namn-mapping:**
| Email | Namn |
|-------|------|
| viktoraxelsson89@gmail.com | Viktor |
| armando.tobar.dubon@hotmail.com | Armando |
| aaron.kepler@gmail.com | Aaron |
| ponrud@gmail.com | Pontus |
| oskar.wikingsson@gmail.com | Oskar |

---

## Fasmaskin (Book Phases)

```
preliminary_voting
      │
      │ (5/5 preliminaryVotes.submitted === true)
      │ → auto: phase = 'revealed', preliminaryRevealedAt, preliminaryAverage
      ▼
  revealed
      │
      │ (manuell: "Starta diskussion"-knapp)
      │ → initializes finalJudgments from preliminaryVotes (submitted: false)
      ▼
  discussion
      │
      │ (5/5 finalJudgments.submitted === true)
      │ → auto: phase = 'finalized', isCurrentBook = false, statistik beräknas
      ▼
  finalized
```

---

## Röstningslogik

### Förhandsröst (`addPreliminaryVote`)

1. Kräver `phase === 'preliminary_voting'`
2. Kräver att användaren inte redan har `submitted: true`
3. Sparar `{vote: parseInt(vote), comment: trimmed.substring(0,120), submitted: true, submittedAt: now}`
4. Räknar `submittedCount = Object.values(preliminaryVotes).filter(v => v.submitted).length`
5. **Om `submittedCount === 5`**: auto-reveal
   - `phase = 'revealed'`
   - `preliminaryRevealedAt = now`
   - `preliminaryAverage = sum(allVotes) / 5`

### Starta diskussion (`startDiscussionPhase`)

1. Kräver `phase === 'revealed'`
2. Alla kan starta (ingen rollkontroll)
3. Initierar `finalJudgments` från `preliminaryVotes`:
   ```js
   { vote: prelim.vote, comment: "", submitted: false, submittedAt: null, changedFromPreliminary: false }
   ```
4. Sätter `phase = 'discussion'`, `discussionStartedAt = now`

### Slutomdöme (`addFinalJudgment`)

1. Kräver `phase === 'discussion'`
2. Kräver att användaren inte redan har `submitted: true`
3. Sparar `{vote: parseInt(vote), comment: trimmed.substring(0,120), submitted: true, submittedAt: now, changedFromPreliminary: prelimVote !== finalVote}`
4. Räknar `finalCount = Object.values(finalJudgments).filter(j => j.submitted).length`
5. **Om `finalCount === 5`**: auto-finalize
   - `phase = 'finalized'`
   - `finalizedAt = now`
   - `isCurrentBook = false`
   - `votesChanged = changes.filter(c => c !== 0).length` (antal som ändrat sig)
   - `averageChange = sum(final - preliminary for each member) / 5`
   - `finalAverage = sum(allFinalVotes) / 5`
   - `ratings = { [member]: finalJudgment.vote }` (legacy)

---

## Beräkningsfunktioner

### `calculateAverage(votes)`
```js
function calculateAverage(votes) {
  const validVotes = Object.values(votes).filter(v => v && v.submitted && v.vote);
  if (validVotes.length === 0) return 0;
  return validVotes.reduce((sum, v) => sum + v.vote, 0) / validVotes.length;
}
```
Används för att beräkna löpande genomsnitt i REVEALED/DISCUSSION-faserna.

### `getAverageRating(ratings)` (legacy)
```js
function getAverageRating(ratings) {
  const values = Object.values(ratings);
  return values.reduce((a, b) => a + b, 0) / values.length;
}
```
Används för gamla böcker som saknar `finalAverage` (har bara `ratings: {member: score}`).

### Viktigt mönster för bakåtkompatibilitet
```js
const avgRating = book.finalAverage || getAverageRating(book.ratings || {});
```
Alla ställen som visar betyg måste använda detta mönster för att stödja legacy-böcker.

### `getRatingColor(rating)`
```js
if (rating >= 8) return 'bg-sage text-ink';    // grön
if (rating >= 6) return 'bg-sand text-ink';    // sandfärgad
if (rating >= 4) return 'bg-mortar text-ink';  // grå
return 'bg-grout text-bone';                   // mörk grå, vit text
```

---

## `currentBook`-hantering

- **Lagras i Firestore** som `isCurrentBook: true` på ett bokdokument
- **Spåras dessutom** i `appState/config.currentBookId`
- Bara EN bok kan ha `isCurrentBook: true` åt gången
- `getCurrentBook()`: `books.find(book => book.isCurrentBook)`
- `setCurrentBook(bookId)`:
  1. Ta bort `isCurrentBook` från alla nuvarande "current" böcker
  2. Sätt `isCurrentBook: true` på `bookId`
  3. Uppdatera `appState/config.currentBookId`
- Vid finalisering (5/5 final votes): `isCurrentBook` sätts automatiskt till `false`

---

## Auth-flöde

```
DOMContentLoaded
  └→ initWithMigration()
       ├→ showLoginModal()
       └→ onAuthStateChanged(auth, (user) => {
              if (user && !user.isAnonymous):
                currentUser = user
                currentUserData = await getUserData(user.email)
                  // Hämtar users/{email} från Firestore
                  // currentUserData = { displayName, role, ... }
                if (currentUserData):
                  hideLoginModal()
                  updateUserInterface()
                  await loadBooksFromFirestore()  // sätter upp onSnapshot
                  await migrateOldBooksToNewFormat()
                  await initializeAppState()
                else:
                  showLoginError + handleSignOut()
              else (utloggad):
                currentUser = null
                currentUserData = null
                books = []
                showLoginModal()
          })
```

**`loginUser(email, password)`**: Anropar `signInWithEmailAndPassword`. Resultatet hanteras av `onAuthStateChanged`.

**`handleSignOut()`**: Anropar `signOut(auth)`.

---

## Behörighetssystem

| Åtgärd | Admin | Bokväljare | Alla inloggade |
|--------|-------|-----------|----------------|
| Förhandsröst | ✓ | ✓ | ✓ |
| Slutomdöme | ✓ | ✓ | ✓ |
| Starta diskussion | ✓ | ✓ | ✓ |
| Redigera bok (full) | ✓ | ✓ | ✗ |
| Lägga till mat/recept | ✓ | ✓ | ✗ |

- `canUserVotePreliminary`: kräver `phase === 'preliminary_voting'` och `!userVote.submitted` (admin alltid ok)
- `canUserVoteFinal`: kräver `phase === 'discussion'` och `!userVote.submitted`
- `canEditFullBook`: admin eller `book.chosenBy === user.displayName`

---

## Bokomslag-hämtning

Fallback-kedja vid tillägg av ny bok:
1. Manuellt angiven URL i formuläret
2. Google Books API: `https://www.googleapis.com/books/v1/volumes?q={title}+{author}`
   - Prioritet: `large > medium > thumbnail > smallThumbnail`
   - URL fixas: `http→https`, `zoom=1→zoom=2`, tar bort `&edge=curl`
3. Open Library: `https://openlibrary.org/search.json?q={title}+{author}`
   - Använder `cover_i` → `https://covers.openlibrary.org/b/id/{coverId}-L.jpg`
4. Om inget hittas: modal för manuell URL eller "hoppa över"

**Cover-cache**: `coverCache` (in-memory Map). Sparas även i Firestore på `book.coverUrl` för att slippa API-anrop vid framtida visning.

---

## Edge cases och gotchas

### Bokfaser
- **Böcker utan `phase`-fält**: gamla/migrerade böcker. Behandlas som finalized. `book.phase || BOOK_PHASES.PRELIMINARY_VOTING` används men `migrateOldBooksToNewFormat()` sätter rätt fas.
- **Böcker med bara `ratings`**: legacy-böcker (säsong 1–5). Saknar `preliminaryVotes`/`finalJudgments`. Använd `book.ratings` direkt för dessa.

### Röstning
- `changedFromPreliminary`: `preliminaryVote !== parseInt(finalVote)` — exakt jämförelse, inte tolerans
- Comment trunkeras till 120 tecken: `comment.trim().substring(0, 120)`
- `vote` sparas alltid som `parseInt(vote)` — aldrig string

### `currentBook`
- Kan vara `null` (ingen aktuell bok)
- Om `isCurrentBook` saknas på alla böcker men `appState.currentBookId` finns: dessa kan divergera. Appen använder `books.find(b => b.isCurrentBook)`.

### Statistik vid finalisering
- `averageChange = sum(final.vote - preliminary.vote for each member) / 5`
- Kan vara negativt (diskussion sänkte betyget i snitt)
- `votesChanged` räknar ANTAL som ändrat sig (0–5), inte magnitude

### Firestore-listener
- `onSnapshot` håller realtidsuppdateringar aktiva under hela sessionen
- Alla vy-uppdateringar sker i snapshot-callbacken via `updateAllViews()`

---

## Fasens displaynamn

| Fas | Visningsnamn |
|-----|-------------|
| `preliminary_voting` | Förhandsröstning |
| `revealed` | Resultat avslöjat |
| `discussion` | Diskussion |
| `finalized` | Slutgiltig |

---

## Historisk data (säsong 1–5)

25 böcker i Firestore, alla migrerade till `phase: 'finalized'` med `ratings`-fältet. Saknar verkliga `preliminaryVotes`/`finalJudgments` — dessa är satta till samma värde som `ratings` vid migration.
