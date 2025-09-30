# Refaktorering: Bokklubb-app från monolit till modulär struktur

## Projektöversikt
- **Start:** 2025-01-15
- **Ursprung:** 4600-raders index.html
- **Mål:** Modulär filstruktur med state management
- **Senast uppdaterad:** 2025-09-30

---

## Fas 1: Store + första page — **KLAR 2025-09-30**
### Slutförda:
- [x] Git-setup och initial commit
- [x] Skapat mappstruktur
- [x] `js/state/store.js` (batching, safe unsubscribe)
- [x] `js/utils/metrics.js` (getAvgRating, getRatingColor m.fl.)
- [x] `js/state/selectors.js` (getFinalizedBooks, getCurrentBook, getSeasonWinner, …)
- [x] Extraherat bokhyllan till `js/pages/bookshelf.js`
- [x] **Event-delegation** i bokhyllan (inga globala onclick)
- [x] `index.html` rensad (endast struktur)
- [x] `js/app.js` initierar tabs + bokhylla på `DOMContentLoaded`
- [x] Storekoppling bevisad:
  - `js/state/actions.js` (`addBook`, `hydrateBooks`)
  - `js/data/books.js` (SAMPLE_BOOKS seed)
  - UI re-renderar på state-ändring
- [x] Fas-konstanter centraliserade i `js/utils/constants.js`
  - `BOOK_PHASES`, `getPhaseDisplayName`, `getPhaseStatusText`

### Tekniska noteringar:
- Temporärt **gästläge** (ingen auth): “Inloggad som: Gäst”, “Offline-läge”
- Seeds används tills backend/auth kopplas in i senare faser

---

## Fas 2: Covers + modals (påbörjad)
### Klart / På gång:
- [x] Basmodal: `js/components/modals/BaseModal.js`
- [x] Bokdetaljer-modal: `js/pages/bookDetails.js`
- [ ] `js/utils/covers.js` med Promise-cache (ej klar)
- [ ] Delning av modaler:
  - [ ] `VoteModal.js`
  - [ ] `UploadModal.js`
  - [ ] `EditBookModal.js`
  - [ ] `MissingCoverModal.js`
- [ ] `js/components/Toast.js` (ersätter alert för notiser)

---

## Fas 3: Resterande pages (ej påbörjad)
- [ ] Konvertera `seasons.js`
- [ ] Konvertera `statistics.js`
- [ ] Konvertera `members.js`
- [ ] Konvertera `timeline.js`
- [ ] Konvertera `cookbook.js`
- [ ] Konvertera `photobook.js`
- [ ] `js/utils/dom.js` (generella delegations-helpers)
- [ ] Init-guard i `js/app.js` (om multipla entrypoints behövs)

---

## Filstruktur (planerad / delvis implementerad)
bokklubb-app/
├── index.html (~150 rader, endast struktur)  
├── js/  
│   ├── app.js (init + event setup)  
│   ├── config/  
│   │   └── firebase-config.js  
│   ├── auth/  
│   │   ├── auth.js  
│   │   └── user-helpers.js  
│   ├── state/  
│   │   ├── store.js  
│   │   ├── selectors.js  
│   │   └── actions.js ✅  
│   ├── data/  
│   │   ├── books.js ✅ (SAMPLE_BOOKS)  
│   │   ├── photos.js  
│   │   └── ratings.js  
│   ├── pages/  
│   │   ├── bookshelf.js ✅  
│   │   ├── bookDetails.js ✅  
│   │   ├── seasons.js  
│   │   ├── statistics.js  
│   │   ├── members.js  
│   │   ├── timeline.js  
│   │   ├── cookbook.js  
│   │   └── photobook.js  
│   ├── components/  
│   │   ├── Header.js  
│   │   ├── Navigation.js  
│   │   ├── Toast.js  
│   │   └── modals/  
│   │       ├── BaseModal.js ✅  
│   │       ├── VoteModal.js  
│   │       ├── UploadModal.js  
│   │       ├── EditBookModal.js  
│   │       └── MissingCoverModal.js  
│   └── utils/  
│       ├── constants.js ✅  
│       ├── covers.js  
│       ├── metrics.js ✅  
│       ├── helpers.js  
│       └── dom.js  
└── css/  
    └── styles.css (om custom CSS behövs)

---

## Checkpoints (Git tags)
- `before-refactoring` — Original monolit
- `checkpoint-1` — **Fas 1 klar** (denna version)
- `checkpoint-2` — Covers + modals + Toast klara
- `checkpoint-3` — Alla pages konverterade

---

## Nästa session-plan
**Fokus:** Fas 2
1) Implementera `utils/covers.js` (cache + lazy load)  
2) `Toast.js` (notiser)  
3) `EditBookModal.js` (koppla till `bookDetails`/“Redigera”)
