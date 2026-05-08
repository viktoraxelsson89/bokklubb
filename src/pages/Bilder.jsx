import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useBooks } from '../context/BooksContext.jsx'
import { usePhotos } from '../context/PhotosContext.jsx'
import {
  groupPhotosByBook,
  getGroupSubtitle,
  canUploadPhotos,
  canDeletePhoto,
  buildStoragePath,
  buildPhotoPayload,
} from '../domain/photos.js'
import {
  addPhoto,
  deletePhoto,
  uploadPhotoBlob,
  deletePhotoFile,
} from '../firebase/photos.js'
import { compressImage } from '../domain/image.js'
import { DS, LORA, SYS } from '../styles/tokens.js'
import { MutedLabel, CoverPlaceholder, EmptyState, IconButton, LoadingState } from '../components/ui.jsx'

export default function Bilder() {
  const { userData } = useAuth()
  const { books, loading: booksLoading } = useBooks()
  const { photos, loading: photosLoading } = usePhotos()

  const [lightbox, setLightbox] = useState(null) // { groupIndex, photoIndex }
  const [uploadState, setUploadState] = useState({}) // { [bookId]: { progress, total, error } }

  const groups = useMemo(() => groupPhotosByBook(photos, books), [photos, books])

  const openLightbox = useCallback((groupIndex, photoIndex) => {
    setLightbox({ groupIndex, photoIndex })
  }, [])

  if (booksLoading || photosLoading) {
    return <LoadingState text="Laddar bilder..." />
  }

  return (
    <div style={{ minHeight: '100%', background: DS.gradientBg, color: DS.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 14px 32px' }}>
        <div style={{ marginBottom: 18, padding: '0 4px' }}>
          <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1.05rem', color: DS.ink, marginBottom: 2 }}>
            Bilder
          </div>
          <div style={{ fontSize: '0.72rem', color: DS.ash }}>
            {photos.length} {photos.length === 1 ? 'bild' : 'bilder'} från {groups.length} {groups.length === 1 ? 'träff' : 'träffar'}
          </div>
        </div>

        {books.length === 0 ? (
          <EmptyState title="Inga bilder" text="Lägg till en bok först." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {books.length > 0 && groups.length === 0 && (
              <UploadableEmptyBooks
                books={books}
                userData={userData}
                uploadState={uploadState}
                setUploadState={setUploadState}
              />
            )}
            {groups.map((group, gIdx) => (
              <BookGroup
                key={group.bookId}
                group={group}
                userData={userData}
                uploadState={uploadState[group.bookId]}
                onUpload={files => handleUpload(group.bookId, files, userData, setUploadState)}
                onPhotoClick={pIdx => openLightbox(gIdx, pIdx)}
              />
            ))}

            {/* böcker utan foton: visa minimal upload-rad */}
            {groups.length > 0 && (
              <BooksWithoutPhotos
                books={books}
                groups={groups}
                userData={userData}
                uploadState={uploadState}
                setUploadState={setUploadState}
              />
            )}
          </div>
        )}
      </div>

      {lightbox && (
        <Lightbox
          group={groups[lightbox.groupIndex]}
          photoIndex={lightbox.photoIndex}
          userData={userData}
          onClose={() => setLightbox(null)}
          onChange={photoIndex => setLightbox(s => ({ ...s, photoIndex }))}
          onDeleted={() => {
            const group = groups[lightbox.groupIndex]
            if (!group) { setLightbox(null); return }
            const remaining = group.count - 1
            if (remaining <= 0) setLightbox(null)
            else setLightbox(s => ({ ...s, photoIndex: Math.min(s.photoIndex, remaining - 1) }))
          }}
        />
      )}
    </div>
  )
}

async function handleUpload(bookId, fileList, userData, setUploadState) {
  if (!userData) return
  const files = [...fileList].filter(f => f && f.type?.startsWith('image/'))
  if (files.length === 0) return

  setUploadState(s => ({ ...s, [bookId]: { progress: 0, total: files.length, error: null } }))

  let progress = 0
  for (const file of files) {
    try {
      const blob = await compressImage(file, { maxWidth: 1600, quality: 0.85 })
      const now = Date.now()
      const storagePath = buildStoragePath(bookId, now)
      const downloadUrl = await uploadPhotoBlob(storagePath, blob)
      const payload = buildPhotoPayload({
        bookId,
        storagePath,
        downloadUrl,
        uploadedBy: userData.displayName,
        now: new Date(now).toISOString(),
      })
      await addPhoto(payload)
      progress += 1
      setUploadState(s => ({ ...s, [bookId]: { progress, total: files.length, error: null } }))
    } catch (err) {
      setUploadState(s => ({ ...s, [bookId]: { progress, total: files.length, error: err.message || 'Uppladdning misslyckades' } }))
      return
    }
  }

  setTimeout(() => {
    setUploadState(s => {
      const next = { ...s }
      delete next[bookId]
      return next
    })
  }, 1500)
}

function BookGroup({ group, userData, uploadState, onUpload, onPhotoClick }) {
  const { book, photos, count } = group
  const canUpload = canUploadPhotos(userData)

  return (
    <div style={{
      background: DS.bone,
      borderRadius: 24,
      padding: 16,
      boxShadow: DS.shadowSoft,
      outline: '1px solid rgba(156,153,143,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <CoverPlaceholder title={book.title} coverUrl={book.coverUrl} size="sm" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: LORA, fontWeight: 600, fontSize: '0.98rem', color: DS.ink, lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{book.title}</div>
          <div style={{
            fontFamily: LORA, fontStyle: 'italic', fontSize: '0.74rem', color: DS.soft, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{getGroupSubtitle(book)}</div>
          <div style={{ fontFamily: SYS, fontSize: '0.68rem', color: DS.ash, marginTop: 2 }}>
            {count} {count === 1 ? 'bild' : 'bilder'}
          </div>
        </div>
        {canUpload && <UploadButton onUpload={onUpload} />}
      </div>

      {uploadState && <UploadStatus state={uploadState} />}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
        gap: 6,
      }}>
        {photos.map((photo, idx) => (
          <Thumbnail key={photo.id} photo={photo} onClick={() => onPhotoClick(idx)} />
        ))}
      </div>
    </div>
  )
}

function Thumbnail({ photo, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        aspectRatio: '1 / 1',
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        background: DS.dune,
        outline: '1px solid rgba(156,153,143,0.15)',
        transform: hov ? 'scale(0.99)' : 'none',
        transition: 'transform 0.12s ease',
      }}
    >
      <img
        src={photo.downloadUrl}
        alt=""
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  )
}

function UploadButton({ onUpload, label = 'Ladda upp' }) {
  return (
    <label style={{
      cursor: 'pointer',
      padding: '7px 12px',
      borderRadius: 16,
      background: DS.sage,
      color: DS.ink,
      fontSize: '0.78rem',
      fontWeight: 600,
      boxShadow: DS.shadowInset,
      flexShrink: 0,
      whiteSpace: 'nowrap',
    }}>
      {label}
      <input
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => {
          const files = e.target.files
          if (files && files.length) onUpload(files)
          e.target.value = ''
        }}
      />
    </label>
  )
}

function UploadStatus({ state }) {
  if (state.error) {
    return (
      <div style={{
        marginBottom: 10,
        background: 'rgba(180,60,60,0.08)', color: '#8b3a3a',
        fontSize: '0.78rem', padding: '8px 12px', borderRadius: 12,
        outline: '1px solid rgba(180,60,60,0.18)',
      }}>{state.error}</div>
    )
  }
  if (state.progress < state.total) {
    return (
      <div style={{
        marginBottom: 10,
        background: 'rgba(255,255,255,0.6)',
        fontSize: '0.78rem', padding: '8px 12px', borderRadius: 12,
        color: DS.soft,
        outline: '1px solid rgba(156,153,143,0.18)',
      }}>
        Laddar upp {state.progress + 1} av {state.total}…
      </div>
    )
  }
  return null
}

function BooksWithoutPhotos({ books, groups, userData, uploadState, setUploadState }) {
  const withPhotos = new Set(groups.map(g => g.bookId))
  const empty = books
    .filter(b => !withPhotos.has(b.id))
    .sort((a, b) => {
      const sA = a.season ?? 0, sB = b.season ?? 0
      if (sA !== sB) return sB - sA
      return (b.meetingDate || '').localeCompare(a.meetingDate || '')
    })

  if (empty.length === 0) return null
  if (!canUploadPhotos(userData)) return null

  return (
    <div style={{
      background: 'rgba(255,255,255,0.5)',
      borderRadius: 18,
      padding: 14,
      outline: '1px solid rgba(156,153,143,0.15)',
    }}>
      <div style={{ marginBottom: 10 }}><MutedLabel>Böcker utan bilder</MutedLabel></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {empty.map(book => (
          <EmptyBookRow
            key={book.id}
            book={book}
            uploadState={uploadState[book.id]}
            onUpload={files => handleUpload(book.id, files, userData, setUploadState)}
          />
        ))}
      </div>
    </div>
  )
}

function UploadableEmptyBooks({ books, userData, uploadState, setUploadState }) {
  if (!canUploadPhotos(userData)) {
    return <EmptyState title="Inga bilder" text="Inga bilder uppladdade än." />
  }
  const sorted = [...books].sort((a, b) => {
    const sA = a.season ?? 0, sB = b.season ?? 0
    if (sA !== sB) return sB - sA
    return (b.meetingDate || '').localeCompare(a.meetingDate || '')
  })
  return (
    <div style={{
      background: DS.bone,
      borderRadius: 24,
      padding: 16,
      boxShadow: DS.shadowSoft,
      outline: '1px solid rgba(156,153,143,0.18)',
    }}>
      <div style={{ marginBottom: 10 }}><MutedLabel>Ladda upp första bilden</MutedLabel></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map(book => (
          <EmptyBookRow
            key={book.id}
            book={book}
            uploadState={uploadState[book.id]}
            onUpload={files => handleUpload(book.id, files, userData, setUploadState)}
          />
        ))}
      </div>
    </div>
  )
}

function EmptyBookRow({ book, uploadState, onUpload }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 8px', borderRadius: 12,
      background: 'rgba(255,255,255,0.5)',
      outline: '1px solid rgba(156,153,143,0.15)',
    }}>
      <CoverPlaceholder title={book.title} coverUrl={book.coverUrl} size="xs" />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: LORA, fontWeight: 600, fontSize: '0.86rem', color: DS.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{book.title}</div>
        <div style={{
          fontFamily: SYS, fontSize: '0.66rem', color: DS.ash,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          S{book.season ?? '–'}{book.meetingDate ? ` · ${book.meetingDate}` : ''}
        </div>
        {uploadState && <UploadStatus state={uploadState} />}
      </div>
      <UploadButton onUpload={onUpload} label="+" />
    </div>
  )
}

function Lightbox({ group, photoIndex, userData, onClose, onChange, onDeleted }) {
  const photo = group?.photos?.[photoIndex]
  const total = group?.photos?.length ?? 0
  const [deleting, setDeleting] = useState(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  const goPrev = useCallback(() => {
    if (total <= 1) return
    onChange((photoIndex - 1 + total) % total)
  }, [photoIndex, total, onChange])

  const goNext = useCallback(() => {
    if (total <= 1) return
    onChange((photoIndex + 1) % total)
  }, [photoIndex, total, onChange])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') closeRef.current()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goPrev, goNext])

  if (!photo) return null

  const canDelete = canDeletePhoto(photo, userData)

  async function handleDelete() {
    if (!canDelete || deleting) return
    if (!window.confirm('Ta bort den här bilden?')) return
    setDeleting(true)
    try {
      await deletePhoto(photo.id)
      await deletePhotoFile(photo.storagePath)
      onDeleted()
    } catch (err) {
      alert(err.message || 'Kunde inte ta bort')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(18,19,18,0.92)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <IconButton
        onClick={(e) => { e.stopPropagation(); onClose() }}
        style={iconBtnStyle('top-right')}
        label="Stäng"
        size={44}
        variant="dark"
        round
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </IconButton>

      {total > 1 && (
        <>
          <IconButton
            onClick={(e) => { e.stopPropagation(); goPrev() }}
            style={iconBtnStyle('left')}
            label="Föregående"
            size={44}
            variant="dark"
            round
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </IconButton>
          <IconButton
            onClick={(e) => { e.stopPropagation(); goNext() }}
            style={iconBtnStyle('right')}
            label="Nästa"
            size={44}
            variant="dark"
            round
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </IconButton>
        </>
      )}

      <div onClick={e => e.stopPropagation()} style={{
        maxWidth: '92vw', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <img
          src={photo.downloadUrl}
          alt=""
          style={{
            maxWidth: '92vw', maxHeight: '78vh',
            objectFit: 'contain',
            borderRadius: 6,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        />
        <div style={{
          color: DS.bone, fontSize: '0.78rem', fontFamily: SYS,
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(0,0,0,0.4)',
          padding: '8px 14px', borderRadius: 20,
          backdropFilter: 'blur(6px)',
        }}>
          <span>{group.book?.title}</span>
          <span style={{ opacity: 0.6 }}>·</span>
          <span>{photoIndex + 1} / {total}</span>
          <span style={{ opacity: 0.6 }}>·</span>
          <span>{photo.uploadedBy}</span>
          {canDelete && (
            <>
              <span style={{ opacity: 0.6 }}>·</span>
              <button onClick={handleDelete} disabled={deleting} style={{
                background: 'transparent',
                border: '1px solid rgba(244,243,241,0.4)',
                color: DS.bone,
                padding: '3px 10px', borderRadius: 14,
                fontSize: '0.74rem', fontFamily: 'inherit',
                cursor: deleting ? 'wait' : 'pointer',
              }}>{deleting ? 'Tar bort…' : 'Ta bort'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function iconBtnStyle(position) {
  const base = {
    position: 'fixed',
    zIndex: 1001,
    backdropFilter: 'blur(6px)',
  }
  if (position === 'top-right') return { ...base, top: 18, right: 18 }
  if (position === 'left') return { ...base, top: '50%', left: 18, transform: 'translateY(-50%)' }
  if (position === 'right') return { ...base, top: '50%', right: 18, transform: 'translateY(-50%)' }
  return base
}
