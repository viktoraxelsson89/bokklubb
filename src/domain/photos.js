export function canUploadPhotos(user) {
  return !!user?.displayName;
}

export function canDeletePhoto(photo, user) {
  if (!user || !photo) return false;
  if (user.role === 'admin') return true;
  return photo.uploadedBy === user.displayName;
}

export function buildStoragePath(bookId, now = Date.now(), rand = randomToken()) {
  return `meetings/${bookId}/${now}-${rand}.jpg`;
}

export function normalizePhoto(doc) {
  if (!doc) return doc;
  const downloadUrl = doc.downloadUrl || doc.url || null;
  const storagePath = doc.storagePath || (doc.fileName ? `photos/${doc.fileName}` : null);
  return { ...doc, downloadUrl, storagePath };
}

export function buildPhotoPayload({ bookId, storagePath, downloadUrl, uploadedBy, now, width, height }) {
  const payload = {
    bookId,
    storagePath,
    downloadUrl,
    uploadedBy,
    uploadedAt: now,
  };
  if (width != null) payload.width = width;
  if (height != null) payload.height = height;
  return payload;
}

function randomToken() {
  return Math.random().toString(36).slice(2, 10);
}

export function getPhotosForBook(photos, bookId) {
  return photos
    .filter(p => p.bookId === bookId)
    .sort((a, b) => (a.uploadedAt || '').localeCompare(b.uploadedAt || ''));
}

export function groupPhotosByBook(photos, books) {
  const bookById = new Map(books.map(b => [b.id, b]));
  const counts = new Map();
  const buckets = new Map();
  for (const photo of photos) {
    if (!buckets.has(photo.bookId)) buckets.set(photo.bookId, []);
    buckets.get(photo.bookId).push(photo);
    counts.set(photo.bookId, (counts.get(photo.bookId) || 0) + 1);
  }

  const groups = [];
  for (const [bookId, items] of buckets) {
    const book = bookById.get(bookId);
    if (!book) continue;
    const sorted = [...items].sort((a, b) => (a.uploadedAt || '').localeCompare(b.uploadedAt || ''));
    groups.push({
      bookId,
      book,
      photos: sorted,
      count: counts.get(bookId) || 0,
    });
  }

  return sortPhotoGroups(groups);
}

export function sortPhotoGroups(groups) {
  return [...groups].sort((a, b) => {
    const seasonA = a.book?.season ?? 0;
    const seasonB = b.book?.season ?? 0;
    if (seasonA !== seasonB) return seasonB - seasonA;
    const dateA = a.book?.meetingDate || a.book?.dateAdded || '';
    const dateB = b.book?.meetingDate || b.book?.dateAdded || '';
    return dateB.localeCompare(dateA);
  });
}

export function getGroupSubtitle(book) {
  if (!book) return '';
  const parts = [];
  if (book.season != null) parts.push(`Säsong ${book.season}`);
  if (book.meetingDate) parts.push(book.meetingDate);
  if (book.chosenBy) parts.push(`Värd: ${book.chosenBy}`);
  return parts.join(' · ');
}
