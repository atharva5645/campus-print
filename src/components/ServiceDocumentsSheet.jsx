import React from 'react'

function formatDate(value) {
  if (!value) return ''

  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

function ServiceDocumentsSheet({
  isOpen,
  service,
  documents,
  isLoading,
  onClose,
  onAddToCart,
}) {
  if (!isOpen || !service) return null

  return (
    <div className="fixed inset-0 z-[220] flex items-end justify-center bg-slate-950/65 px-4 py-6 sm:items-center">
      <div className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900 text-white shadow-[0_24px_64px_rgba(0,0,0,0.38)]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">Service Files</p>
            <h3 className="mt-1 font-headline text-2xl font-extrabold text-white">{service.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close files panel"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4 px-6 py-6">
          {isLoading ? (
            <div className="rounded-2xl bg-slate-800 px-4 py-10 text-center text-sm text-white/70">
              Loading uploaded files...
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-2xl bg-slate-800 px-4 py-10 text-center text-sm text-white/70">
              No files have been uploaded for this service yet.
            </div>
          ) : (
            documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white">{document.title}</p>
                  <p className="mt-1 text-sm text-white/60">Uploaded {formatDate(document.created_at)}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={document.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Open File
                  </a>
                  <button
                    type="button"
                    onClick={() => onAddToCart(document)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ServiceDocumentsSheet
