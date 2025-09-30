// js/components/modal.js
// Enkel, återanvändbar modal utan externa beroenden.
// API:
//   const modal = createModal({ title, contentHTML, size: 'md'|'lg', onClose });
//   modal.open();
//   modal.close();

export function createModal({ title = '', contentHTML = '', size = 'md', onClose = null } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };
  const maxW = sizes[size] ?? sizes.md;

  const modal = document.createElement('div');
  modal.className = `relative w-full ${maxW} rounded-3xl bg-bone shadow-soft ring-1 ring-grout/20 overflow-hidden`;

  modal.innerHTML = `
    <div class="pointer-events-none absolute inset-0 bg-card-sheen"></div>
    <div class="relative p-6 md:p-8">
      <button class="absolute top-4 right-4 text-text-muted hover:text-text transition-colors" data-close aria-label="Stäng">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      ${title ? `<h2 class="text-xl md:text-2xl font-semibold mb-4">${title}</h2>` : ''}
      <div data-content>${contentHTML}</div>
    </div>
  `;

  overlay.appendChild(modal);

  function handleEscape(e) {
    if (e.key === 'Escape') {
      api.close();
    }
  }

  function handleClickBackdrop(e) {
    if (e.target === overlay) {
      api.close();
    }
  }

  const api = {
    setContent(html) {
      modal.querySelector('[data-content]').innerHTML = html;
    },
    open() {
      document.body.appendChild(overlay);
      document.addEventListener('keydown', handleEscape);
      overlay.addEventListener('click', handleClickBackdrop);
      modal.querySelector('[data-close]').addEventListener('click', api.close);
    },
    close() {
      overlay.removeEventListener('click', handleClickBackdrop);
      document.removeEventListener('keydown', handleEscape);
      overlay.remove();
      if (typeof onClose === 'function') onClose();
    },
  };

  return api;
}