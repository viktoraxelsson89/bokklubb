import { describe, it, expect } from 'vitest';
import {
  canUploadPhotos,
  canDeletePhoto,
  buildStoragePath,
  buildPhotoPayload,
  normalizePhoto,
  getPhotosForBook,
  groupPhotosByBook,
  sortPhotoGroups,
  getGroupSubtitle,
} from './photos.js';

const admin = { displayName: 'Viktor', role: 'admin' };
const member = { displayName: 'Armando', role: 'member' };
const other = { displayName: 'Pontus', role: 'member' };

describe('canUploadPhotos', () => {
  it('alla inloggade får ladda upp', () => {
    expect(canUploadPhotos(member)).toBe(true);
    expect(canUploadPhotos(admin)).toBe(true);
  });

  it('utloggad nekas', () => {
    expect(canUploadPhotos(null)).toBe(false);
    expect(canUploadPhotos({})).toBe(false);
  });
});

describe('canDeletePhoto', () => {
  const photo = { uploadedBy: 'Armando' };

  it('admin får alltid radera', () => {
    expect(canDeletePhoto(photo, admin)).toBe(true);
  });

  it('uppladdaren får radera', () => {
    expect(canDeletePhoto(photo, member)).toBe(true);
  });

  it('andra medlemmar får inte', () => {
    expect(canDeletePhoto(photo, other)).toBe(false);
  });

  it('null user / null photo nekas', () => {
    expect(canDeletePhoto(photo, null)).toBe(false);
    expect(canDeletePhoto(null, member)).toBe(false);
  });
});

describe('normalizePhoto', () => {
  it('mappar legacy-schema (url + fileName) till nytt', () => {
    const legacy = {
      id: 'p1',
      bookId: 'b1',
      url: 'https://x/photos%2Ffoo.jpg?token=abc',
      fileName: 'foo.jpg',
      uploadedBy: 'Viktor',
      uploadedAt: '2025-09-29T10:20:40.611Z',
    };
    const normalized = normalizePhoto(legacy);
    expect(normalized.downloadUrl).toBe('https://x/photos%2Ffoo.jpg?token=abc');
    expect(normalized.storagePath).toBe('photos/foo.jpg');
    expect(normalized.uploadedBy).toBe('Viktor');
  });

  it('lämnar nya schema oförändrat', () => {
    const fresh = {
      id: 'p2',
      bookId: 'b1',
      downloadUrl: 'https://y/meetings%2Fb1%2F123.jpg?token=def',
      storagePath: 'meetings/b1/123-rand.jpg',
      uploadedBy: 'Viktor',
      uploadedAt: '2026-05-03T00:00:00Z',
    };
    const normalized = normalizePhoto(fresh);
    expect(normalized.downloadUrl).toBe(fresh.downloadUrl);
    expect(normalized.storagePath).toBe(fresh.storagePath);
  });

  it('hanterar null/undefined', () => {
    expect(normalizePhoto(null)).toBe(null);
  });

  it('sätter null på saknade fält', () => {
    const normalized = normalizePhoto({ id: 'p3' });
    expect(normalized.downloadUrl).toBe(null);
    expect(normalized.storagePath).toBe(null);
  });
});

describe('buildStoragePath', () => {
  it('bygger meetings/{bookId}/{timestamp}-{rand}.jpg', () => {
    expect(buildStoragePath('b1', 1700000000000, 'abc12345')).toBe(
      'meetings/b1/1700000000000-abc12345.jpg',
    );
  });
});

describe('buildPhotoPayload', () => {
  it('inkluderar baseFält', () => {
    const payload = buildPhotoPayload({
      bookId: 'b1',
      storagePath: 'meetings/b1/x.jpg',
      downloadUrl: 'https://x',
      uploadedBy: 'Viktor',
      now: '2026-05-03T00:00:00Z',
    });
    expect(payload).toEqual({
      bookId: 'b1',
      storagePath: 'meetings/b1/x.jpg',
      downloadUrl: 'https://x',
      uploadedBy: 'Viktor',
      uploadedAt: '2026-05-03T00:00:00Z',
    });
  });

  it('inkluderar width/height om angivna', () => {
    const payload = buildPhotoPayload({
      bookId: 'b1', storagePath: 'p', downloadUrl: 'u', uploadedBy: 'V', now: 't',
      width: 1600, height: 1200,
    });
    expect(payload.width).toBe(1600);
    expect(payload.height).toBe(1200);
  });
});

describe('getPhotosForBook', () => {
  it('filtrerar och sorterar äldst först', () => {
    const photos = [
      { id: '2', bookId: 'a', uploadedAt: '2026-02-01' },
      { id: '1', bookId: 'a', uploadedAt: '2026-01-01' },
      { id: '3', bookId: 'b', uploadedAt: '2026-03-01' },
    ];
    expect(getPhotosForBook(photos, 'a').map(p => p.id)).toEqual(['1', '2']);
  });
});

describe('groupPhotosByBook', () => {
  const books = [
    { id: 'b1', season: 1, title: 'Bok 1', meetingDate: '2024-01-01' },
    { id: 'b2', season: 3, title: 'Bok 2', meetingDate: '2026-01-01' },
    { id: 'b3', season: 2, title: 'Bok 3', meetingDate: '2025-01-01' },
  ];
  const photos = [
    { id: 'p1', bookId: 'b1', uploadedAt: '2024-01-02' },
    { id: 'p2', bookId: 'b1', uploadedAt: '2024-01-01' },
    { id: 'p3', bookId: 'b2', uploadedAt: '2026-01-01' },
    { id: 'p4', bookId: 'b3', uploadedAt: '2025-01-01' },
  ];

  it('grupperar per bok och sorterar senaste säsong först', () => {
    const groups = groupPhotosByBook(photos, books);
    expect(groups.map(g => g.bookId)).toEqual(['b2', 'b3', 'b1']);
  });

  it('sätter count och photos sorterat äldst först', () => {
    const groups = groupPhotosByBook(photos, books);
    const b1Group = groups.find(g => g.bookId === 'b1');
    expect(b1Group.count).toBe(2);
    expect(b1Group.photos.map(p => p.id)).toEqual(['p2', 'p1']);
  });

  it('hoppar över foton som saknar matchande bok', () => {
    const groups = groupPhotosByBook(
      [{ id: 'x', bookId: 'missing', uploadedAt: 't' }],
      books,
    );
    expect(groups.length).toBe(0);
  });
});

describe('sortPhotoGroups', () => {
  it('sorterar på säsong fallande, sedan datum fallande', () => {
    const groups = [
      { bookId: 'a', book: { season: 1, meetingDate: '2024-01-01' } },
      { bookId: 'b', book: { season: 2, meetingDate: '2025-01-01' } },
      { bookId: 'c', book: { season: 2, meetingDate: '2025-06-01' } },
    ];
    expect(sortPhotoGroups(groups).map(g => g.bookId)).toEqual(['c', 'b', 'a']);
  });
});

describe('getGroupSubtitle', () => {
  it('formaterar säsong / datum / värd', () => {
    expect(getGroupSubtitle({ season: 3, meetingDate: '2026-05-01', chosenBy: 'Viktor' }))
      .toBe('Säsong 3 · 2026-05-01 · Värd: Viktor');
  });

  it('hoppar över saknade fält', () => {
    expect(getGroupSubtitle({ season: 1 })).toBe('Säsong 1');
    expect(getGroupSubtitle({})).toBe('');
    expect(getGroupSubtitle(null)).toBe('');
  });
});
