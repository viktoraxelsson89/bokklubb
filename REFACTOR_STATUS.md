# Refaktorering: Bokklubb-app från monolit till modulär struktur

## Projektöversikt
- **Start:** 2025-01-15
- **Ursprung:** 4600-raders index.html
- **Mål:** Modulär filstruktur med state management
- **Estimerad tid:** 8-10 timmar över 2-3 veckor

## Aktuell status
**Fas:** 0 - Setup
**Progress:** 10%
**Senast uppdaterad:** 2025-01-15

---

## Fas 1: Store + första page (mål: 4-6h)
### Slutförda steg:
- [x] Git-setup och initial commit
- [x] Skapat REFACTOR_STATUS.md

### Pågående:
- [ ] Skapa js/state/store.js
- [ ] Skapa js/utils/metrics.js
- [ ] Skapa js/state/selectors.js
- [ ] Flytta Firebase snapshot-logik till js/data/books.js
- [ ] Konvertera bookshelf.js till store-baserad rendering

### Tekniska noteringar:
(Kommer fyllas på under arbetet)

---

## Fas 2: Covers + modals (mål: 2-3h)
Status: Ej påbörjad

### Planerade steg:
- [ ] Skapa js/utils/covers.js med Promise-cache
- [ ] Dela js/components/modals.js i 4 filer:
  - [ ] VoteModal.js
  - [ ] UploadModal.js  
  - [ ] EditBookModal.js
  - [ ] MissingCoverModal.js
- [ ] Skapa js/components/Toast.js (ersätt alert())

---

## Fas 3: Resterande pages (mål: 2-3h)
Status: Ej påbörjad

### Planerade steg:
- [ ] Konvertera seasons.js
- [ ] Konvertera statistics.js
- [ ] Konvertera members.js
- [ ] Konvertera timeline.js
- [ ] Konvertera cookbook.js
- [ ] Konvertera photobook.js
- [ ] Skapa js/utils/dom.js (event delegation)
- [ ] Lägg init-guard i js/app.js

---

## Tekniska skulder / Kända problem
(Fylls på under arbetets gång)

---

## Filstruktur (planerad)
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
│   │   └── selectors.js
│   ├── data/
│   │   ├── books.js
│   │   ├── photos.js
│   │   └── ratings.js
│   ├── pages/
│   │   ├── bookshelf.js
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
│   │       ├── VoteModal.js
│   │       ├── UploadModal.js
│   │       ├── EditBookModal.js
│   │       └── MissingCoverModal.js
│   └── utils/
│       ├── covers.js
│       ├── metrics.js
│       ├── helpers.js
│       └── dom.js
└── css/
└── styles.css (om custom CSS behövs)

---

## Checkpoints (Git tags)
- `before-refactoring` - Original monolit
- `checkpoint-1` - Store implementation klar
- `checkpoint-2` - Covers + modals klart
- `checkpoint-3` - Alla pages konverterade

---

## Nästa session-plan
**När:** [Datum för nästa arbetspass]
**Fokus:** Skapa store.js och konvertera bookshelf.js
**Förberedelser:** 
- Läs igenom denna fil
- Ha browser öppen för testning
- Bifoga REFACTOR_STATUS.md till ny AI-chatt