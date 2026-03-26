import React from 'react'
import { FileText, Layers3, UploadCloud } from 'lucide-react'

function OrderForm({
  quantity,
  pages,
  uploadedFiles,
  isUploading,
  onQuantityChange,
  onPagesChange,
  onFileSelect,
}) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-[0_20px_40px_rgba(32,48,68,0.06)] sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Layers3 size={20} strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline font-bold text-on-surface">Quantity</p>
              <p className="text-xs text-on-surface-variant">Number of document sets</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-full border border-outline-variant/10 bg-surface-container-low p-1">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-sm transition-all active:scale-90"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              aria-label="Decrease quantity"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <span className="font-headline text-xl font-bold">{quantity}</span>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-md transition-all active:scale-90"
              onClick={() => onQuantityChange(quantity + 1)}
              aria-label="Increase quantity"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-[0_20px_40px_rgba(32,48,68,0.06)] sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText size={20} strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline font-bold text-on-surface">Total Pages</p>
              <p className="text-xs text-on-surface-variant">Printed pages per set</p>
            </div>
          </div>
          <input
            className="w-full rounded-2xl bg-surface-container-low px-4 py-3 text-center font-headline text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
            type="number"
            min="1"
            value={pages}
            onChange={(event) =>
              onPagesChange(Math.max(1, Number(event.target.value) || 1))
            }
          />
        </div>
      </section>

      <section className="space-y-4 rounded-[1.75rem] bg-surface-container-lowest p-5 shadow-[0_20px_40px_rgba(32,48,68,0.06)] sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UploadCloud size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold">Document Upload</h3>
            <p className="text-sm text-on-surface-variant">
              Add files for this order and review them before checkout.
            </p>
          </div>
        </div>

        <label
          type="button"
          className="group flex w-full cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-outline-variant/40 bg-surface-container-low px-5 py-8 text-center transition-colors hover:border-primary/50"
        >
          <input
            className="hidden"
            type="file"
            accept=".pdf,image/*"
            onChange={onFileSelect}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
            <span className="material-symbols-outlined text-4xl">cloud_upload</span>
          </div>
          <p className="mt-4 font-headline font-bold text-on-surface">
            {isUploading ? 'Uploading file...' : 'Upload your PDF or Image'}
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Drag and drop or tap to browse from your device
          </p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-outline">
            Maximum file size: 25MB
          </p>
        </label>

        <div className="space-y-3">
          {uploadedFiles.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low p-4"
            >
              <div className="flex min-w-0 items-center gap-4">
                {file.type === 'pdf' ? (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-error-container/10 text-error">
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                  </div>
                ) : (
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                    <img
                      alt={file.name}
                      className="h-full w-full object-cover"
                      src={file.thumbnail}
                    />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{file.name}</p>
                  <p className="text-xs text-on-surface-variant">{file.meta}</p>
                </div>
              </div>

              <span
                className="material-symbols-outlined shrink-0 text-tertiary"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                check_circle
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default OrderForm
