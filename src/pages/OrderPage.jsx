import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import CartSummary from '../components/CartSummary'
import NotificationBell from '../components/NotificationBell'
import OrderForm from '../components/OrderForm'
import { getServices } from '../api/adminApi'
import { addCartItem } from '../api/cartApi'
import { createOrder } from '../api/orderApi'
import { uploadOrderFile } from '../api/uploadApi'
import { addLocalCartItem } from '../lib/localCart'
import { getLocalServices, getStudentSafeServices, syncLocalServices } from '../lib/localServices'
import { createPrototypeOrder } from '../lib/prototypeData'
import { supabase } from '../lib/supabase'
import { generateCode } from '../utils/generateCode'

const PRICE_PER_PAGE = 2.5
const PRINT_MODE_PRICING = {
  bw: 1.5,
  color: 2.5,
}

const PAPER_SIZE_MULTIPLIER = {
  A4: 1,
  Legal: 1.2,
  A3: 1.8,
}

const FINISHING_PRICE = {
  none: 0,
  staple: 10,
  spiral: 35,
  lamination: 20,
}

function buildLocalUploadPreview(file) {
  return {
    name: file.name,
    meta: `${(file.size / (1024 * 1024)).toFixed(1)} MB - Ready in prototype mode`,
    type: file.type.startsWith('image/') ? 'image' : 'pdf',
    thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    publicUrl: undefined,
  }
}

function revokePreviewUrl(file) {
  if (file?.thumbnail && typeof file.thumbnail === 'string' && file.thumbnail.startsWith('blob:')) {
    URL.revokeObjectURL(file.thumbnail)
  }
}

function getFinishingLabel(finishingOption, finishingPrice) {
  const labels = {
    none: 'None',
    staple: 'Staple',
    spiral: 'Spiral Bind',
    lamination: 'Lamination',
  }

  const baseLabel = labels[finishingOption] || finishingOption
  if (!finishingPrice || finishingOption === 'none') {
    return baseLabel
  }

  return `${baseLabel} (+Rs ${finishingPrice})`
}

function getPreferredService(candidateServices) {
  const safeServices = getStudentSafeServices(candidateServices)

  return (
    safeServices.find((service) => service.name === 'Color Printing' && service.enabled) ||
    safeServices.find((service) => service.enabled) ||
    safeServices[0] ||
    null
  )
}

function OrderPage() {
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [pages, setPages] = useState(50)
  const [printMode, setPrintMode] = useState('color')
  const [printSides, setPrintSides] = useState('single')
  const [paperSize, setPaperSize] = useState('A4')
  const [finishing, setFinishing] = useState('none')
  const [selectedService, setSelectedService] = useState(() => getPreferredService(getLocalServices()))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pageError, setPageError] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  const pricePerPage = useMemo(() => {
    const basePrice = PRINT_MODE_PRICING[printMode] || PRICE_PER_PAGE
    const multiplier = PAPER_SIZE_MULTIPLIER[paperSize] || 1
    return Number((basePrice * multiplier).toFixed(2))
  }, [paperSize, printMode])

  const finishingCharge = FINISHING_PRICE[finishing] || 0

  const totalPrice = useMemo(
    () => Number((quantity * pages * pricePerPage + finishingCharge * quantity).toFixed(2)),
    [finishingCharge, pages, pricePerPage, quantity]
  )

  useEffect(() => {
    async function ensureAuthenticated() {
      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        navigate('/', { replace: true })
        return null
      }

      setCurrentUser(data.user)
      return data.user
    }

    async function loadServices() {
      try {
        const user = await ensureAuthenticated()
        if (!user) return

        const services = await getServices()
        syncLocalServices(services)
        setSelectedService(getPreferredService(services))
        setPageError('')
      } catch {
        setSelectedService(getPreferredService(getLocalServices()))
        setPageError('Using locally saved prototype services for now.')
      }
    }

    loadServices()
  }, [navigate])

  useEffect(() => {
    return () => {
      uploadedFiles.forEach(revokePreviewUrl)
    }
  }, [uploadedFiles])

  const handleAddToCart = async () => {
    if (!selectedService?.id) {
      setPageError('No print service is available right now.')
      return
    }

    try {
      setIsSubmitting(true)
      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        navigate('/', { replace: true })
        return
      }

      const localCartItem = {
        id: `local-${Date.now()}`,
        uniqueCode: generateCode(),
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        pages,
        quantity,
        pricePerPage,
        totalPrice,
        printMode,
        printSides,
        paperSize,
        finishing,
        finishingCharge,
        uploadedFiles: uploadedFiles.map((file) => ({
          name: file.name,
          type: file.type,
          publicUrl: file.publicUrl || '',
        })),
      }

      const orderPayload = {
        user_id: data.user.id,
        student_name: data.user.email,
        service_id: selectedService.id,
        service_name: selectedService.name,
        pages,
        quantity,
        price_per_page: pricePerPage,
        notes: `Created from CampusPrint add to cart | ${printMode === 'bw' ? 'Black & White' : 'Color'} | ${printSides === 'double' ? 'Double-sided' : 'Single-sided'} | ${paperSize} | ${finishing}`,
        file_urls: localCartItem.uploadedFiles.map((file) => file.publicUrl).filter(Boolean),
      }

      let apiWarning = ''

      try {
        const createdOrder = await createOrder(orderPayload)
        localCartItem.linkedOrderId = createdOrder.id
        localCartItem.linkedOrderStatus = createdOrder.status || 'pending'
        localCartItem.orderCreatedFromCart = true
      } catch {
        const prototypeOrder = createPrototypeOrder(orderPayload)
        localCartItem.linkedOrderId = prototypeOrder.id
        localCartItem.linkedOrderStatus = prototypeOrder.status || 'pending'
        localCartItem.orderCreatedFromCart = true
        apiWarning = 'Added to cart and queued for admin in prototype mode.'
      }

      addLocalCartItem(localCartItem)

      try {
        await addCartItem({
          user_id: data.user.id,
          service_id: selectedService.id,
          pages,
          quantity,
          price_per_page: pricePerPage,
        })
      } catch {
        apiWarning = apiWarning || 'Added to cart. Backend cart sync is unavailable right now, but the print job is already queued.'
      }

      setPageError(apiWarning)
      navigate('/cart')
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const upload = await uploadOrderFile(file)

      setUploadedFiles((current) => [
        {
          name: file.name,
          meta: `${(file.size / (1024 * 1024)).toFixed(1)} MB - Uploaded`,
          type: file.type.startsWith('image/') ? 'image' : 'pdf',
          thumbnail: file.type.startsWith('image/') ? upload.publicUrl : undefined,
          publicUrl: upload.publicUrl,
        },
        ...current,
      ])
      setPageError('')
    } catch {
      setUploadedFiles((current) => [
        buildLocalUploadPreview(file),
        ...current,
      ])
      setPageError('File added in prototype mode. Backend upload is unavailable right now.')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleRemoveFile = (indexToRemove) => {
    setUploadedFiles((current) => {
      const fileToRemove = current[indexToRemove]
      revokePreviewUrl(fileToRemove)
      return current.filter((_, index) => index !== indexToRemove)
    })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(151,149,255,0.18),_transparent_34%),_var(--clr-surface)] font-body text-on-surface antialiased">
      <header className="sticky top-0 z-40 border-b border-white/20 bg-gradient-to-r from-[var(--clr-primary)] via-[var(--clr-primary-dim)] to-[var(--clr-secondary)] shadow-[0_16px_36px_rgba(32,48,68,0.12)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
              aria-label="Go back"
            >
              <ArrowLeft size={20} strokeWidth={2.2} />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">CampusPrint</p>
              <h1 className="truncate font-headline text-lg font-bold tracking-tight text-white sm:text-xl">
                Printing Services
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <NotificationBell audience="student" userId={currentUser?.id} variant="dark" />
            <div className="text-right">
              <p className="text-xs text-white/70">Student dashboard</p>
              <p className="text-sm font-semibold text-white">{currentUser?.email || 'Ready to print'}</p>
            </div>
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white/30">
              <img
                alt="User Profile"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6d6Cvg73iHMTCIns0Bm-OVG9BzWzySG4ih6NyhFlHaztBtvQDB_aV_TelK4Mpz1KqmSc5n0VDy_6LAGcVarqOsc58jfQtqo9B44rQ6uXNjaPhQxkJqX1CXMaev22cSb_dy37epGQ0Pob_Q8NxJynp8F8Qaz_P8TZoyMeEV_mgpfVg4u-VZjPgHGIF9ayqX1AjWJsBRbfn-qvGiIM_MB-ouvGN84tMwRV3u77kRwNnCp4FlLA4u3kO7N3cBCfBo-UuYnJqMCZD8Uk"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-56 pt-6 sm:px-6 sm:pt-8 lg:pb-40">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)] lg:items-start">
          <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[2rem] border border-white/40 shadow-[0_24px_48px_rgba(32,48,68,0.10)]">
              <img
                alt="Printing Service"
                className="h-56 w-full object-cover sm:h-64"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbEZOWJiHz5lvMaeVf4os_53i1YAMoHAjy59gqBJsUDKNrVrn5a5wEkSA4heOqKN8X9IHitA79e9zYJS7tpqvtAsqiI96-Ouoyai_sv35pObc9ibsEwDFiDdqSjwxkGsrM7bII73lTxMOha1D_sHVExWSTEASYAdMnbGIdOFjgU-jHcjO1noYonCyzFFLrBVgxAGlb-GvotoIBTTEdCz4ABra1XH-D7gyoFaIypgo6RrcmH8nVpEyoAZI_1Seg85LWKSmcV2sJSA4"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#162033]/85 via-[#162033]/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <span className="mb-3 inline-flex rounded-full bg-tertiary-container px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-tertiary-container">
                  Academic Premium
                </span>
                <h2 className="font-headline text-2xl font-bold text-white sm:text-[2rem]">
                  {selectedService?.name || 'Standard A4 Document'}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-white/80 sm:text-base">
                  Fast document printing for notes, assignments, and campus submissions.
                </p>
              </div>
            </section>

            {pageError && (
              <section className="rounded-2xl border border-error/20 bg-error-container/10 p-4 text-sm text-error">
                {pageError}
              </section>
            )}

            <OrderForm
              quantity={quantity}
              pages={pages}
              printMode={printMode}
              printSides={printSides}
              paperSize={paperSize}
              finishing={finishing}
              uploadedFiles={uploadedFiles}
              isUploading={isUploading}
              onQuantityChange={setQuantity}
              onPagesChange={setPages}
              onPrintModeChange={setPrintMode}
              onPrintSidesChange={setPrintSides}
              onPaperSizeChange={setPaperSize}
              onFinishingChange={setFinishing}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
            />
          </div>

          <aside className="hidden lg:sticky lg:top-28 lg:block">
            <CartSummary
              pricePerPage={pricePerPage}
              pages={pages}
              quantity={quantity}
              totalPrice={totalPrice}
              summaryRows={[
                { label: 'Print Type', value: printMode === 'bw' ? 'Black & White' : 'Color' },
                { label: 'Sides', value: printSides === 'double' ? 'Double-sided' : 'Single-sided' },
                { label: 'Paper Size', value: paperSize },
                { label: 'Finishing', value: getFinishingLabel(finishing, finishingCharge) },
              ]}
              priceNote={`Rs ${pricePerPage} x ${pages} pages x ${quantity} qty${finishingCharge ? ` + Rs ${finishingCharge} finishing/set` : ''}`}
              buttonLabel={isSubmitting ? 'Adding...' : 'Add to Cart'}
              onAction={handleAddToCart}
            />
          </aside>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-[5.25rem] z-40 px-4 sm:px-6 lg:hidden">
        <div className="glass-surface mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-[1.5rem] px-4 py-3 shadow-[0_20px_40px_rgba(32,48,68,0.12)]">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
              Total Price
            </p>
            <p className="truncate font-headline text-2xl font-extrabold text-primary">
              Rs {totalPrice.toFixed(2)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="shrink-0 rounded-2xl bg-primary px-5 py-3 font-headline text-sm font-bold text-white shadow-[0_10px_20px_rgba(74,64,224,0.28)] transition-all active:scale-95"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 z-50 w-full">
        <BottomNav />
      </div>
    </div>
  )
}

export default OrderPage


