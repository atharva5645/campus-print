import React, { useEffect, useMemo, useState } from 'react'
import { deleteDocument, getDocuments, uploadDocument } from '../api/documentApi'

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
        const data = await getDocuments(service.id)
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

      const insertedDocument = await uploadDocument({
        serviceId: service.id,
        title: title.trim(),
        file: selectedFile,
      })

      if (insertedDocument) {
        setDocuments((current) => [insertedDocument, ...current])
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

  async function handleDelete(documentId) {
    const confirmed = window.confirm('Delete this document?')
    if (!confirmed) return

    try {
      setDeletingId(documentId)
      setError('')
      setMessage('')

      await deleteDocument(documentId)

      setDocuments((current) => current.filter((document) => document.id !== documentId))
      setMessage('Document deleted successfully.')
    } catch (deleteActionError) {
      setError(deleteActionError.message || 'Failed to delete document.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-outline-variant/30 bg-surface-container-lowest text-on-surface shadow-[0_24px_64px_rgba(32,48,68,0.15)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.38)]">
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-6 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">Document Manager</p>
            <h3 className="mt-1 font-headline text-2xl font-extrabold text-on-surface">{modalTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-on-surface transition hover:bg-surface-container-high"
            aria-label="Close documents modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4 px-6 py-6">
          {error && (
            <div className="rounded-2xl border border-error/25 bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-2xl border border-tertiary-container/50 bg-tertiary-container/30 px-4 py-3 text-sm text-tertiary-dim">
              {message}
            </div>
          )}

          {isUploadMode && (
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-on-surface" htmlFor="document-title">
                  Document title
                </label>
                <input
                  id="document-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter document title"
                  className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-on-surface" htmlFor="document-file">
                  Select file
                </label>
                <input
                  id="document-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                  className="block w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm text-on-surface file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-on-primary"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-on-surface-variant">{selectedFile.name}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          )}

          {isViewMode && (
            <div className="space-y-3">
              {isLoadingDocuments ? (
                <div className="rounded-2xl bg-surface-container-low px-4 py-8 text-center text-sm text-on-surface-variant">
                  Loading documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-2xl bg-surface-container-low px-4 py-8 text-center text-sm text-on-surface-variant">
                  No documents uploaded for this service yet.
                </div>
              ) : (
                documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-on-surface">{document.title}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{formatDate(document.created_at)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={document.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-dim"
                      >
                        Download
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(document.id)}
                        disabled={deletingId === document.id}
                        className="inline-flex items-center justify-center rounded-xl bg-error/10 px-4 py-2 text-sm font-semibold text-error transition hover:bg-error/20 disabled:cursor-not-allowed disabled:opacity-60"
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
