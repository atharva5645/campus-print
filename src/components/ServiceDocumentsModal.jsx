import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function extractStoragePath(fileUrl) {
  const marker = '/storage/v1/object/public/documents/'
  const markerIndex = fileUrl.indexOf(marker)
  if (markerIndex === -1) return null
  return decodeURIComponent(fileUrl.slice(markerIndex + marker.length))
}

function formatDate(value) {
  if (!value) return ''

  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function ServiceDocumentsModal({ isOpen, mode, service, onClose }) {
  const [title, setTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [documents, setDocuments] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const isUploadMode = mode === 'upload'
  const isViewMode = mode === 'view'

  const modalTitle = useMemo(() => {
    if (!service?.name) return 'Service Documents'
    return isUploadMode
      ? `Upload Document - ${service.name}`
      : `View Documents - ${service.name}`
  }, [isUploadMode, service])

  useEffect(() => {
    if (!isOpen) {
      setTitle('')
      setSelectedFile(null)
      setDocuments([])
      setIsUploading(false)
      setIsLoadingDocuments(false)
      setDeletingId('')
      setError('')
      setMessage('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !isViewMode || !service?.id) return

    let active = true

    async function loadDocuments() {
      try {
        setIsLoadingDocuments(true)
        setError('')
        const { data, error: fetchError } = await supabase
          .from('documents')
          .select('id, service_id, title, file_url, created_at')
          .eq('service_id', service.id)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        if (active) setDocuments(data || [])
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Failed to load documents.')
        }
      } finally {
        if (active) setIsLoadingDocuments(false)
      }
    }

    loadDocuments()

    return () => {
      active = false
    }
  }, [isOpen, isViewMode, service])

  if (!isOpen || !service) return null

  async function handleUpload(event) {
    event.preventDefault()

    if (!title.trim()) {
      setError('Please enter a document title.')
      return
    }

    if (!selectedFile) {
      setError('Please choose a file to upload.')
      return
    }

    try {
      setIsUploading(true)
      setError('')
      setMessage('')

      const safeFileName = `${Date.now()}-${selectedFile.name.replace(/\s+/g, '-')}`
      const storagePath = `service-${service.id}/${safeFileName}`

      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (storageError) throw storageError

      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(storagePath)

      const fileUrl = publicUrlData.publicUrl

      const { data: insertedRows, error: insertError } = await supabase
        .from('documents')
        .insert({
          service_id: service.id,
          title: title.trim(),
          file_url: fileUrl,
        })
        .select('id, service_id, title, file_url, created_at')

      if (insertError) {
        await supabase.storage.from('documents').remove([storagePath])
        throw insertError
      }

      if (insertedRows?.[0]) {
        setDocuments((current) => [insertedRows[0], ...current])
      }

      setTitle('')
      setSelectedFile(null)
      setMessage('Document uploaded successfully.')
    } catch (uploadError) {
      setError(uploadError.message || 'Failed to upload document.')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete(documentId, fileUrl) {
    const confirmed = window.confirm('Delete this document?')
    if (!confirmed) return

    try {
      setDeletingId(documentId)
      setError('')
      setMessage('')

      const storagePath = extractStoragePath(fileUrl)

      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([storagePath])

        if (storageError) throw storageError
      }

      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (deleteError) throw deleteError

      setDocuments((current) => current.filter((document) => document.id !== documentId))
      setMessage('Document deleted successfully.')
    } catch (deleteActionError) {
      setError(deleteActionError.message || 'Failed to delete document.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/70 px-4 py-6">
      <div className="w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900 text-white shadow-[0_24px_64px_rgba(0,0,0,0.38)]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">Document Manager</p>
            <h3 className="mt-1 font-headline text-2xl font-extrabold text-white">{modalTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close documents modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4 px-6 py-6">
          {error && (
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </div>
          )}

          {isUploadMode && (
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white" htmlFor="document-title">
                  Document title
                </label>
                <input
                  id="document-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter document title"
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-[var(--clr-primary)] focus:ring-2 focus:ring-[rgba(133,130,255,0.18)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white" htmlFor="document-file">
                  Select file
                </label>
                <input
                  id="document-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                  className="block w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-500 file:px-4 file:py-2 file:font-semibold file:text-white"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-white/70">{selectedFile.name}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex items-center justify-center rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          )}

          {isViewMode && (
            <div className="space-y-3">
              {isLoadingDocuments ? (
                <div className="rounded-2xl bg-slate-800 px-4 py-8 text-center text-sm text-white/70">
                  Loading documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-2xl bg-slate-800 px-4 py-8 text-center text-sm text-white/70">
                  No documents uploaded for this service yet.
                </div>
              ) : (
                documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-white">{document.title}</p>
                      <p className="mt-1 text-sm text-white/60">{formatDate(document.created_at)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={document.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                      >
                        Download
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(document.id, document.file_url)}
                        disabled={deletingId === document.id}
                        className="inline-flex items-center justify-center rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === document.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServiceDocumentsModal
