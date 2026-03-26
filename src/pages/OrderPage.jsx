import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import CartSummary from '../components/CartSummary'
import OrderForm from '../components/OrderForm'
import { getServices } from '../api/adminApi'
import { addCartItem } from '../api/cartApi'
import { uploadOrderFile } from '../api/uploadApi'
import { getLocalServices, syncLocalServices } from '../lib/localServices'
import { supabase } from '../lib/supabase'

const PRICE_PER_PAGE = 2.5
const placeholderFiles = [
  {
    name: 'assignment_final.pdf',
    meta: '1.2 MB - Ready',
    type: 'pdf',
  },
  {
    name: 'report_v1.jpg',
    meta: '840 KB - Ready',
    type: 'image',
    thumbnail:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBgiT5g4VgQV6MdCQ-9KKQatR530sh18s_lkzihkoY1CpsaZRVyfoxmGog8EFYul-WBIhEVdYQFfDMugz41W6QlpASXA03SCCGh4HeyFcBfXYgDhLrBKzdss28UXPxitsLsSCavtJlhpxgMrqJC4YxbOpne4pP_OS-FDgyra5OaafM_pfJJFLFb-GYsTRr6qLP55xbMbZNXLBsaBbTMyRKNoHwwqh9_mkO464E1poSZEBPoTh4e1Tcmaytl1r3ep4ci0vhG7R9RisI',
  },
]

function OrderPage() {
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [pages, setPages] = useState(50)
  const [selectedService, setSelectedService] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pageError, setPageError] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState(placeholderFiles)
  const [currentUser, setCurrentUser] = useState(null)

  const totalPrice = useMemo(() => quantity * pages * PRICE_PER_PAGE, [pages, quantity])

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
        const preferredService =
          services.find((service) => service.name === 'Color Printing') ||
          services.find((service) => service.enabled) ||
          services[0] ||
          null

        setSelectedService(preferredService)
        setPageError('')
      } catch (error) {
        const localServices = getLocalServices()
        const preferredService =
          localServices.find((service) => service.name === 'Color Printing' && service.enabled) ||
          localServices.find((service) => service.enabled) ||
          null

        setSelectedService(preferredService)
        setPageError('Using locally saved services for now. Admin changes on this device will still appear here.')
      }
    }

    loadServices()
  }, [navigate])

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

      await addCartItem({
        user_id: data.user.id,
        service_id: selectedService.id,
        pages,
        quantity,
        price_per_page: PRICE_PER_PAGE,
      })
      setPageError('')
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
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(151,149,255,0.18),_transparent_34%),_var(--clr-surface)] font-body text-on-surface antialiased">
      <header className="sticky top-0 z-40 border-b border-white/20 bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 shadow-[0_16px_36px_rgba(32,48,68,0.12)] backdrop-blur-xl">
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
              uploadedFiles={uploadedFiles}
              isUploading={isUploading}
              onQuantityChange={setQuantity}
              onPagesChange={setPages}
              onFileSelect={handleFileSelect}
            />
          </div>

          <aside className="hidden lg:sticky lg:top-28 lg:block">
            <CartSummary
              pricePerPage={PRICE_PER_PAGE}
              pages={pages}
              quantity={quantity}
              totalPrice={totalPrice}
              buttonLabel={isSubmitting ? 'Adding...' : 'Add to Cart'}
              onAction={handleAddToCart}
            />
          </aside>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-[5.25rem] z-40 px-4 sm:px-6 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-[1.5rem] border border-white/20 bg-surface-container-highest/90 px-4 py-3 shadow-[0_20px_40px_rgba(32,48,68,0.12)] backdrop-blur-xl">
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
