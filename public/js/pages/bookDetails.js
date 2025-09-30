// js/features/bookDetails.js
import { store } from '../state/store.js';
import { getAvgRating, getRatingColor } from '../utils/metrics.js';
import { getPhaseDisplayName } from '../utils/constants.js';
import { createModal } from '../components/modals/BaseModal.js';

export function openBookDetailsById(bookId) {
  const state = store.getState();
  const book = state.books.find(b => b.id === bookId);
  if (!book) return;

  const avgRating = book.finalAverage || getAvgRating(book);
  const hasRating = avgRating > 0;

  const meeting = book.meetingDate
    ? new Date(book.meetingDate).toLocaleDateString('sv-SE')
    : 'Inget datum satt';

  const content = `
    <div class="flex gap-4">
      <div class="flex-shrink-0">
        <div class="w-20 h-32 rounded-lg overflow-hidden bg-dune shadow-md">
          ${book.coverUrl
            ? `<img src="${book.coverUrl}" alt="${book.title}" class="w-full h-full object-cover" />`
            : '<div class="w-full h-full flex items-center justify-center text-3xl">📚</div>'}
        </div>
        ${hasRating ? `
          <div class="mt-3 text-center">
            <span class="inline-block rounded-full ${getRatingColor(avgRating)} px-2 py-1 text-xs font-bold">
              ${avgRating.toFixed(1)}
            </span>
          </div>` : ''}
      </div>

      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-text mb-1">${book.title}</h3>
        <p class="text-sm text-text-soft italic mb-2">${book.author}</p>

        <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-text-soft">
          <div><span class="font-medium text-text">Säsong:</span> ${book.season}</div>
          <div><span class="font-medium text-text">Vald av:</span> ${book.chosenBy}</div>
          <div><span class="font-medium text-text">Status:</span> ${getPhaseDisplayName(book.phase)}</div>
          <div><span class="font-medium text-text">Datum:</span> ${meeting}</div>
          ${book.food ? `<div class="col-span-2"><span class="font-medium text-text">Mat:</span> ${book.food}</div>` : ''}
        </div>

        ${book.preliminaryAverage && book.finalAverage ? `
          <div class="mt-4 grid grid-cols-3 gap-3 text-xs">
            <div class="rounded-xl bg-dune p-3 text-center">
              <div class="font-semibold">Förhandsröst</div>
              <div>${book.preliminaryAverage.toFixed(1)}/10</div>
            </div>
            <div class="rounded-xl bg-dune p-3 text-center">
              <div class="font-semibold">Slutomdöme</div>
              <div>${book.finalAverage.toFixed(1)}/10</div>
            </div>
            <div class="rounded-xl bg-dune p-3 text-center ${book.averageChange > 0 ? 'text-sage' : book.averageChange < 0 ? 'text-red-600' : ''}">
              <div class="font-semibold">Förändring</div>
              <div>${book.averageChange > 0 ? '+' : ''}${(book.averageChange || 0).toFixed(1)}</div>
            </div>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="mt-6 flex gap-3">
      <button id="edit-book-btn" class="rounded-2xl bg-sage px-5 py-2 font-semibold text-ink hover:brightness-105 active:scale-95">
        Redigera
      </button>
      <a href="${book.recipeLink || '#'}" target="_blank"
         class="rounded-2xl px-5 py-2 font-semibold border border-grout/30 hover:bg-white/60 ${book.recipeLink ? '' : 'pointer-events-none opacity-50'}">
        Recept
      </a>
    </div>
  `;

  const modal = createModal({
    title: 'Bokdetaljer',
    contentHTML: content,
    size: 'md',
  });

  modal.open();

  // Events i modalen
  const root = document.body.querySelector('[aria-modal="true"]');
  const editBtn = root.querySelector('#edit-book-btn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      // Här kan du öppna din befintliga edit-modal, eller dispatcha en CustomEvent
      document.dispatchEvent(new CustomEvent('book:edit', { detail: { id: bookId } }));
      modal.close();
    });
  }
}