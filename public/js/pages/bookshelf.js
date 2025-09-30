// js/pages/bookshelf.js — Bokshyllan med sortering och visning

import { store } from '../state/store.js';
import { getAvgRating, getRatingColor } from '../utils/metrics.js';
import { loadCoversForBooks } from '../utils/covers.js';
import { openBookDetailsById } from './bookDetails.js';

import { BOOK_PHASES, getPhaseDisplayName, getPhaseStatusText } from '../utils/constants.js';

// Main display function
export function displayBookshelf() {
  const state = store.getState();
  const { books } = state;

  const container = document.getElementById('bookshelf-container');
  if (!container) return;

  const sortSelect = document.getElementById('bookshelf-sort');
  const sortBy = sortSelect ? sortSelect.value : 'date';
  const countElement = document.getElementById('bookshelf-count');

  // Sortera böcker
  const sortedBooks = sortBooks([...books], sortBy);

  // Uppdatera antal
  if (countElement) countElement.textContent = String(sortedBooks.length);

  // Rendera
  if (sortedBooks.length === 0) {
    container.innerHTML = `
      <div class="col-span-full rounded-2xl bg-sage/20 p-8 text-center">
        <p class="text-text-soft">Inga böcker att visa.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = sortedBooks.map(book => createBookCard(book)).join('');

  // Ladda omslag efter rendering (asynk — men vi väntar inte här)
  try {
    loadCoversForBooks(sortedBooks);
  } catch (_) {
    // tyst fallback — vi använder befintliga coverUrl om något strular
  }
}

// Sortera böcker
function sortBooks(books, sortBy) {
  switch (sortBy) {
    case 'title':
      return books.sort((a, b) => a.title.localeCompare(b.title, 'sv'));
    case 'author':
      return books.sort((a, b) => a.author.localeCompare(b.author, 'sv'));
    case 'season':
      return books.sort((a, b) => a.season - b.season);
    case 'rating':
      return books.sort((a, b) => {
        const ra = a.finalAverage ?? getAvgRating(a);
        const rb = b.finalAverage ?? getAvgRating(b);
        return rb - ra; // högst betyg först
      });
    case 'date':
      return books.sort((a, b) => {
        const dateA = a.meetingDate || a.dateAdded;
        const dateB = b.meetingDate || b.dateAdded;
        return new Date(dateB) - new Date(dateA); // nyast först
      });
    default:
      return books;
  }
}

// Skapa kort för en bok
function createBookCard(book) {
  const avgRating = book.finalAverage || getAvgRating(book);
  const hasRating = avgRating > 0;

  return `
    <div class="group relative rounded-2xl bg-white/70 ring-1 ring-grout/20 p-4 transition-all hover:shadow-lg hover:bg-white/90 hover:scale-[1.02] cursor-pointer book-card"
         data-book-id="${book.id}">
      <div class="flex gap-4">
        <!-- Bokomslag -->
        <div class="flex-shrink-0">
          <div class="w-16 h-24 rounded-lg overflow-hidden bg-dune shadow-md group-hover:shadow-lg transition-shadow">
            ${book.coverUrl
      ? `<img src="${book.coverUrl}" alt="${book.title}" class="w-full h-full object-cover">`
      : '<div class="w-full h-full flex items-center justify-center text-2xl">📚</div>'
    }
          </div>

          <!-- Betyg badge -->
          ${hasRating ? `
            <div class="mt-2 text-center">
              <span class="inline-block rounded-full ${getRatingColor(avgRating)} px-2 py-1 text-xs font-bold">
                ${avgRating.toFixed(1)}
              </span>
            </div>
          ` : ''}
        </div>

        <!-- Bokinfo -->
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-text mb-1 line-clamp-2 group-hover:text-ink transition-colors">
            ${book.title}
          </h3>
          <p class="text-sm text-text-soft italic mb-2 line-clamp-1">
            ${book.author}
          </p>

          <!-- Metadata -->
          <div class="space-y-1 text-xs text-text-muted">
            <div class="flex items-center gap-2">
              <span class="font-medium">Säsong:</span>
              <span>${book.season}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium">Vald av:</span>
              <span>${book.chosenBy}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium">Status:</span>
              <span class="${book.phase === BOOK_PHASES.FINALIZED ? 'text-sage' : 'text-sand'}">
                ${getPhaseDisplayName(book.phase)}
              </span>
            </div>
            ${book.meetingDate ? `
              <div class="flex items-center gap-2">
                <span class="font-medium">Datum:</span>
                <span>${new Date(book.meetingDate).toLocaleDateString('sv-SE')}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Hover overlay -->
      ${createHoverOverlay(book, avgRating, hasRating)}
    </div>
  `;
}

// Skapa hover overlay
function createHoverOverlay(book, avgRating, hasRating) {
  return `
    <div class="absolute inset-0 bg-[#2A2928]/90 text-bone p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <div class="h-full flex flex-col justify-center">
        <h4 class="font-semibold mb-2">${book.title}</h4>
        <p class="text-sm text-bone/80 mb-3">${book.author}</p>

        ${hasRating ? `
          <div class="space-y-1 text-xs">
            ${book.preliminaryAverage && book.finalAverage ? `
              <div>Förhandsröst: ${book.preliminaryAverage.toFixed(1)}/10</div>
              <div>Slutomdöme: ${book.finalAverage.toFixed(1)}/10</div>
              <div class="${book.averageChange > 0 ? 'text-sage' : book.averageChange < 0 ? 'text-red-300' : 'text-bone/80'}">
                Förändring: ${book.averageChange > 0 ? '+' : ''}${(book.averageChange || 0).toFixed(1)}
              </div>
            ` : `
              <div>Betyg: ${avgRating.toFixed(1)}/10</div>
            `}
            ${book.food ? `<div class="mt-2 text-bone/80">Mat: ${book.food}</div>` : ''}
          </div>
        ` : `
          <div class="text-xs text-bone/80">
            ${getPhaseStatusText(book.phase)}
          </div>
        `}
      </div>
    </div>
  `;
}



// Event: sorteringsändring
export function setupBookshelfSorting() {
  const sortSelect = document.getElementById('bookshelf-sort');
  if (!sortSelect) return;
  sortSelect.addEventListener('change', displayBookshelf);
}

// Event: klick på bokkort (event-delegation)
export function setupBookshelfInteraction() {
  const container = document.getElementById('bookshelf-container');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const card = e.target.closest('.book-card');
    if (!card) return;
    const id = card.dataset.bookId;
    if (id) openBookDetailsById(id);
  });
}
