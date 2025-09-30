// js/app.js
import {
  displayBookshelf,
  setupBookshelfSorting,
  setupBookshelfInteraction,
} from './pages/bookshelf.js';
import { store } from './state/store.js';
import { addBook } from './state/actions.js';


import { hydrateBooks } from './state/actions.js';
import { SAMPLE_BOOKS } from './data/books.js';

/* ---------------------------
   Tabs: visa rätt sektion
----------------------------*/
function getAllTabs() {
  // Knappar i sidomenyn
  const buttons = Array.from(document.querySelectorAll('.tab[data-tab]'));
  // Sektioner i main
  const sections = [
    'bookshelf',
    'cookbook',
    'photobook',
    'seasons',
    'statistics',
    'members',
    'timeline',
    'add-book',
  ]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  return { buttons, sections };
}

function showTab(tabName) {
  const { buttons, sections } = getAllTabs();

  // Visa/dölj sektioner
  sections.forEach((el) => {
    if (el.id === tabName) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  // Aktiv stil på knappar
  buttons.forEach((btn) => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle('bg-white/10', isActive);
    btn.classList.toggle('bg-sage/10', isActive && tabName === 'add-book'); // specialfallet i din meny
    btn.classList.toggle('text-sage', isActive && tabName === 'add-book');
    // (justera gärna enligt din design – poängen är att markera aktiv)
  });

  // Spara vald tab lokalt och i hash (valfritt men praktiskt)
  try {
    localStorage.setItem('activeTab', tabName);
  } catch (_) {}
  if (location.hash !== `#${tabName}`) {
    history.replaceState(null, '', `#${tabName}`);
  }

  // Kör sid-specifik init om det behövs
  if (tabName === 'bookshelf') {
    // se till att hyllan är uppdaterad när man byter tillbaka till den
    displayBookshelf();
  }
}

function initTabs() {
  const { buttons } = getAllTabs();

  // Click handlers
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (!tab) return;
      showTab(tab);
    });
  });

  // Start-tab: hash > localStorage > fallback
  const hashTab = location.hash?.replace('#', '');
  const savedTab = (() => {
    try {
      return localStorage.getItem('activeTab');
    } catch {
      return null;
    }
  })();

  const startTab =
    (hashTab && document.getElementById(hashTab)) ||
    (savedTab && document.getElementById(savedTab))
      ? (hashTab || savedTab)
      : 'bookshelf';

  showTab(startTab);
}

// en tillfällig hjälpare för gästläge

function setGuestUI() {
  const user = document.getElementById('current-user');
  if (user) user.textContent = 'Gäst';
  const sync = document.getElementById('sync-indicator');
  if (sync) {
    sync.textContent = 'Offline-läge';
    sync.className = 'inline-flex items-center gap-1.5 rounded-full bg-ash/40 px-2.5 py-1 text-xs font-medium text-ink';
  }
}


/* -----------------------------------------
   Bokhyllan: init + re-render på state
------------------------------------------*/
function initBookshelfPage() {
  const container = document.getElementById('bookshelf-container');
  if (!container) return; // kör bara om bokhyllan finns på denna sida

  // 1) Koppla sorteringsmenyn
  setupBookshelfSorting();

  // 2) Koppla klick på bok-kort (event-delegation)
  setupBookshelfInteraction();

  // 3) Rita första gången
  displayBookshelf();

  // 4) Rendera om vid state-ändringar
  const unsubscribe = store.subscribe(() => {
    displayBookshelf();
  });

  // 5) Städa upp (bra vana)
  window.addEventListener('beforeunload', unsubscribe);
}

/* ---------------------------
   App start
----------------------------*/
document.addEventListener('DOMContentLoaded', () => {
  // Visa rätt sektioner och koppla tabbar
  initTabs();

    setGuestUI();                 // slipp "Inloggad som . / Ansluter …"
  hydrateBooks(SAMPLE_BOOKS);   // fyll bokhyllan om tom

  // Initiera bokhyllan (om den sektionen finns)
  initBookshelfPage();

  // Visa huvud-appen om du vill ha en fade-in-känsla
  const mainApp = document.getElementById('main-app');
  const loading = document.getElementById('loading');
  if (loading) loading.classList.add('hidden');
  if (mainApp) mainApp.classList.remove('hidden');

const form = document.getElementById('book-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = document.getElementById('title')?.value?.trim();
      const author = document.getElementById('author')?.value?.trim();
      const season = document.getElementById('season')?.value;
      const chosenBy = document.getElementById('chosen-by')?.value;
      const meetingDate = document.getElementById('meeting-date')?.value || null;
      const coverUrl = document.getElementById('cover-url')?.value?.trim() || '';

      if (!title || !author) {
        alert('Fyll i minst Titel och Författare.');
        return;
      }

      addBook({ title, author, season, chosenBy, meetingDate, coverUrl });

      // enkel reset + växla till Bokhylla-tab
      form.reset();
      const bookshelfBtn = document.querySelector('.tab[data-tab="bookshelf"]');
      if (bookshelfBtn) bookshelfBtn.click();

      });
  }



});
