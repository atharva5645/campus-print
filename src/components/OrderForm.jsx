import React from 'react'
import { FileText, Layers3, UploadCloud } from 'lucide-react'

function OrderForm({
  quantity,
  pages,
  printMode,
  printSides,
  paperSize,
  finishing,
  uploadedFiles,
  isUploading,
  onQuantityChange,
  onPagesChange,
  onPrintModeChange,
  onPrintSidesChange,
  onPaperSizeChange,
  onFinishingChange,
  onFileSelect,
  onRemoveFile,
}) {
  const optionGroups = [
    {
      title: 'Print Type',
      subtitle: 'Choose black and white or color output',
      value: printMode,
      onChange: onPrintModeChange,
      options: [
        { value: 'bw', label: 'Black & White' },
        { value: 'color', label: 'Color' },
      ],
    },
    {
      title: 'Sides',
      subtitle: 'Select how pages should be printed',
      value: printSides,
      onChange: onPrintSidesChange,
      options: [
        { value: 'single', label: 'Single-sided' },
        { value: 'double', label: 'Double-sided' },
      ],
    },
    {
      title: 'Paper Size',
      subtitle: 'Pick the sheet size for your print job',
      value: paperSize,
      onChange: onPaperSizeChange,
      options: [
        { value: 'A4', label: 'A4' },
        { value: 'Legal', label: 'Legal' },
        { value: 'A3', label: 'A3' },
      ],
    },
    {
      title: 'Finishing',
      subtitle: 'Optional finishing for the final print set',
      value: finishing,
      onChange: onFinishingChange,
      options: [
        { value: 'none', label: 'None' },
        { value: 'staple', label: 'Staple' },
        { value: 'spiral', label: 'Spiral Bind' },
        { value: 'lamination', label: 'Lamination' },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {optionGroups.map((group) => (
          <div
            key={group.title}
            className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-[0_20px_40px_rgba(32,48,68,0.06)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] sm:p-6 transition-all"
          >
            <div className="mb-4">
              <p className="font-headline font-bold text-on-surface">{group.title}</p>
              <p className="text-xs text-on-surface-variant">{group.subtitle}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {group.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => group.onChange(option.value)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all active:scale-95 ${
                    group.value === option.value
                      ? 'border-primary bg-primary text-white shadow-[0_10px_20px_rgba(74,64,224,0.2)]'
                      : 'border-outline-variant/20 bg-surface-container-low text-on-surface hover:border-primary/30 hover:bg-surface-container'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-[0_20px_40px_rgba(32,48,68,0.06)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] sm:p-6 transition-all">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Layers3 size={20} strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-headline font-bold text-on-surface">Quantity</p>
              <p className="text-xs text-on-surface-variant">Number of document sets</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-full border border-outline-variant/20 bg-surface-container-low p-1 transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm transition-all active:scale-90 hover:bg-surface-container-high"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              aria-label="Decrease quantity"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <span className="font-headline text-xl font-bold">{quantity}</span>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-md transition-all active:scale-90 hover:bg-primary-dim"
              onClick={() => onQuantityChange(quantity + 1)}
              aria-label="Increase quantity"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-[0_20px_40px_rgba(32,48,68,0.06)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] sm:p-6 transition-all">
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
            className="w-full rounded-2xl bg-surface-container-low border border-transparent px-4 py-3 text-center font-headline text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-on-surface"
            type="number"
            min="1"
            value={pages}
            onChange={(event) =>
              onPagesChange(Math.max(1, Number(event.target.value) || 1))
            }
          />
        </div>
      </section>

      <section className="space-y-4 rounded-[1.75rem] bg-surface-container-lowest p-5 shadow-[0_20px_40px_rgba(32,48,68,0.06)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.2)] sm:p-6 transition-all">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UploadCloud size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-on-surface">Document Upload</h3>
            <p className="text-sm text-on-surface-variant">
              Add files for this order and review them before checkout.
            </p>
          </div>
        </div>

        <label
          className="group flex w-full cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-outline-variant/40 bg-surface-container-low px-5 py-8 text-center transition-colors hover:border-primary/50 dark:border-outline-variant/20 dark:hover:border-primary/40 focus-within:ring-2 focus-within:ring-primary/30 focus-within:outline-none"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.target.querySelector('input').click();
            }
          }}
        >
          <input
            className="hidden"
            type="file"
            accept=".pdf,image/*"
            onChange={onFileSelect}
            tabIndex={-1}
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
          {uploadedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container-low p-4 animate-fade-in-up transition-all hover:shadow-[0_8px_24px_rgba(32,48,68,0.05)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
            >
              <div className="flex min-w-0 items-center gap-4">
                {file.type === 'pdf' ? (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-error-container/20 text-error animate-scale-in">
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                  </div>
                ) : (
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl animate-scale-in">
                    <img
                      alt={file.name}
                      className="h-full w-full object-cover transition-transform hover:scale-110"
                      src={file.thumbnail}
                    />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-on-surface">{file.name}</p>
                  <p className="text-xs text-on-surface-variant">{file.meta}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className="material-symbols-outlined text-tertiary animate-scale-in"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                >
                  check_circle
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveFile(index)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-error-container/15 text-error transition-all hover:bg-error-container/25 active:scale-95"
                  aria-label={`Remove ${file.name}`}
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default OrderForm
