import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, FileText, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import DeadlineReminder from '../components/DeadlineReminder'
import OrderStatusManager from '../components/OrderStatusManager'
import CartSummary from '../components/CartSummary'
import NotificationBell from '../components/NotificationBell'
import { getCartItems } from '../api/cartApi'
import { createOrder } from '../api/orderApi'
import { clearLocalCartItems, getLocalCartItems, saveLocalCartItems } from '../lib/localCart'
import { createPrototypeOrder } from '../lib/prototypeData'
import { getStudentProfile } from '../lib/studentProfile'
import { supabase } from '../lib/supabase'
import { generateCode } from '../utils/generateCode'

function mapCartItemToOrder(cartItem) {
  const uploadedFiles = Array.isArray(cartItem.uploadedFiles)
    ? cartItem.uploadedFiles
    : Array.isArray(cartItem.file_urls)
    ? cartItem.file_urls.map((fileUrl, index) => ({
        name: `Uploaded file ${index + 1}`,
        publicUrl: fileUrl,
      }))
    : []

  return {
    id: cartItem.id,
    uniqueCode: cartItem.uniqueCode || cartItem.code || '',
    serviceId: cartItem.service_id || cartItem.serviceId,
    serviceName: cartItem.services?.name || cartItem.serviceName || 'Printing Order',
    pages: Number(cartItem.pages) || 0,
    quantity: Number(cartItem.quantity) || 0,
    pricePerPage: Number(cartItem.price_per_page ?? cartItem.pricePerPage) || 0,
    totalPrice:
      Number(cartItem.total_price ?? cartItem.totalPrice) ||
      Number(cartItem.pages || 0) * Number(cartItem.quantity || 0) * Number(cartItem.price_per_page ?? cartItem.pricePerPage ?? 0),
    printMode: cartItem.printMode || 'color',
    printSides: cartItem.printSides || 'single',
    paperSize: cartItem.paperSize || 'A4',
    finishing: cartItem.finishing || 'none',
    finishingCharge: Number(cartItem.finishingCharge || 0),
    uploadedFiles,
    isServiceDocument: Boolean(cartItem.isServiceDocument),
    documentTitle: cartItem.documentTitle || '',
    documentUrl: cartItem.documentUrl || '',
    linkedOrderId: cartItem.linkedOrderId || '',
    linkedOrderStatus: cartItem.linkedOrderStatus || '',
    printStatus: cartItem.printStatus || cartItem.print_status || cartItem.status || 'pending',
    deadline: cartItem.deadline || null,
    collected: Boolean(cartItem.collected),
    collectedAt: cartItem.collectedAt || cartItem.collected_at || null,
    orderCreatedFromCart: Boolean(cartItem.orderCreatedFromCart),
  }
}

function getFriendlyNetworkMessage(error, fallbackMessage) {
  if (!error?.message) {
    return fallbackMessage
  }

  if (error.message.toLowerCase().includes('failed to fetch')) {
    return fallbackMessage
  }

  return error.message
}

function formatFinishingLabel(finishing) {
  const labels = {
    none: 'No finishing',
    staple: 'Staple',
    spiral: 'Spiral Bind',
    lamination: 'Lamination',
  }

  return labels[finishing] || finishing
}

function formatUploadedFileName(file) {
  if (!file) return ''
  if (typeof file === 'string') return file
  return file.name || 'Uploaded file'
}

function getStudentLabel(user) {
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name
  if (fullName) return fullName
  if (user?.email) return user.email.split('@')[0]
  return 'CampusPrint Student'
}

function normalizeCartItems(items) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map(mapCartItemToOrder)
}

function CartPage() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [pageError, setPageError] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    async function loadCart() {
      try {
        const { data, error } = await supabase.auth.getUser()

        if (error || !data.user) {
          navigate('/', { replace: true })
          return
        }

        setCurrentUser(data.user)
        const localCartItems = normalizeCartItems(getLocalCartItems())
        const remoteCartItems = normalizeCartItems(await getCartItems(data.user.id))

        if (localCartItems.length > 0) {
          setCartItems(localCartItems)
        } else if (remoteCartItems.length > 0) {
          setCartItems(remoteCartItems)
          saveLocalCartItems(remoteCartItems)
        } else {
          setCartItems([])
        }

        setPageError('')
      } catch (error) {
        const localCartItems = normalizeCartItems(getLocalCartItems())

        if (localCartItems.length > 0) {
          setCartItems(localCartItems)
          setPageError('Using saved cart items right now.')
          return
        }

        setPageError(getFriendlyNetworkMessage(error, 'Could not load your cart because the backend is offline.'))
      }
    }

    loadCart()
  }, [navigate])

  const itemCount = cartItems.length
  const totalQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  )
  const totalPages = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.pages * item.quantity, 0),
    [cartItems],
  )
  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
    [cartItems],
  )

  const checkoutLabel = useMemo(() => {
    if (itemCount === 0) return 'No order selected'
    return `${itemCount} item${itemCount > 1 ? 's' : ''} in cart`
  }, [itemCount])

  const handleRemoveItem = (indexToRemove) => {
    setCartItems((current) => {
      const nextItems = current.filter((_, index) => index !== indexToRemove)
      saveLocalCartItems(nextItems)
      return nextItems
    })

    setCheckoutMessage('')
    setPageError('Cart updated successfully.')
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setPageError('No cart item is available for checkout.')
      return
    }

    try {
      setIsCheckingOut(true)
      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        navigate('/', { replace: true })
        return
      }

      let usedPrototypeMode = false

      for (const item of cartItems) {
        if (item.linkedOrderId) {
          continue
        }

        try {
          await createOrder({
            user_id: data.user.id,
            student_name: data.user.email,
            service_id: item.serviceId,
            service_name: item.serviceName,
            pages: item.pages,
            quantity: item.quantity,
            price_per_page: item.pricePerPage,
            notes: item.isServiceDocument
              ? `Added from uploaded service documents | ${item.documentTitle || item.serviceName}`
              : `Created from CampusPrint cart checkout | ${item.printMode === 'bw' ? 'Black & White' : 'Color'} | ${item.printSides === 'double' ? 'Double-sided' : 'Single-sided'} | ${item.paperSize} | ${item.finishing}`,
            file_urls: item.uploadedFiles
              .map((file) => file.publicUrl)
              .filter(Boolean),
          })
        } catch {
          usedPrototypeMode = true
          createPrototypeOrder({
            user_id: data.user.id,
            student_name: data.user.email,
            service_id: item.serviceId,
            service_name: item.serviceName,
            pages: item.pages,
            quantity: item.quantity,
            price_per_page: item.pricePerPage,
            notes: item.isServiceDocument
              ? `Added from uploaded service documents | ${item.documentTitle || item.serviceName}`
              : `Created from CampusPrint cart checkout | ${item.printMode === 'bw' ? 'Black & White' : 'Color'} | ${item.printSides === 'double' ? 'Double-sided' : 'Single-sided'} | ${item.paperSize} | ${item.finishing}`,
            file_urls: item.uploadedFiles
              .map((file) => file.publicUrl)
              .filter(Boolean),
          })
        }
      }

      clearLocalCartItems()
      setCartItems([])
      setCheckoutMessage(
        cartItems.some((item) => item.linkedOrderId)
          ? 'Order confirmed successfully. Your queued print jobs are already visible on the admin dashboard.'
          : usedPrototypeMode
          ? 'Prototype order created. Admin has been notified, and the student bell will update when the order is marked ready.'
          : 'Order created successfully. Check the bell icon for your latest order update.'
      )
      setPageError('')
      // Let any NotificationBell listeners refresh immediately after checkout
      window.dispatchEvent(new Event('campus_print_notifications_refresh'))

      const uploadedFileNames = cartItems
        .flatMap((item) => item.uploadedFiles || [])
        .map((file) => formatUploadedFileName(file))
        .filter(Boolean)
      const savedStudentProfile = getStudentProfile()

      navigate('/success', {
        state: {
          name: savedStudentProfile.name || getStudentLabel(data.user),
          dept:
            savedStudentProfile.department ||
            data.user?.user_metadata?.department ||
            data.user?.user_metadata?.dept ||
            'Department not set',
          file:
            uploadedFileNames.length > 0
              ? uploadedFileNames.join(', ')
              : `${itemCount} item${itemCount > 1 ? 's' : ''} from cart`,
          code: generateCode(),
        },
      })
    } catch (error) {
      setPageError(getFriendlyNetworkMessage(error, 'Checkout could not start. Please try again.'))
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(151,149,255,0.18),_transparent_34%),_var(--clr-surface)] font-body text-on-surface antialiased">
      <header className="sticky top-0 z-40 border-b border-white/20 bg-gradient-to-r from-[var(--clr-primary)] via-[var(--clr-primary-dim)] to-[var(--clr-secondary)] shadow-[0_16px_36px_rgba(32,48,68,0.12)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/order')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
              aria-label="Go back"
            >
              <ArrowLeft size={20} strokeWidth={2.2} />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">CampusPrint</p>
              <h1 className="truncate font-headline text-lg font-bold tracking-tight text-white sm:text-xl">
                Your Cart
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex sm:items-center sm:gap-3">
            <NotificationBell audience="student" userId={currentUser?.id} variant="dark" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 sm:pt-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-white/30 bg-surface-container-lowest shadow-[0_24px_48px_rgba(32,48,68,0.08)]">
              <div className="border-b border-outline-variant/20 bg-gradient-to-br from-primary/10 to-secondary-container/25 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <ShoppingBag size={22} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
                        Selected Order
                      </p>
                      <h2 className="mt-1 font-headline text-2xl font-bold text-on-surface">
                        {itemCount > 0 ? `${itemCount} item${itemCount > 1 ? 's' : ''} in cart` : 'No item in cart'}
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/order')}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_10px_20px_rgba(74,64,224,0.22)] transition-all hover:bg-primary-dim active:scale-95"
                    aria-label="Add more items"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                {pageError && (
                  <div className="rounded-[1.5rem] bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                    {pageError}
                  </div>
                )}
                {checkoutMessage && (
                  <div className="rounded-[1.5rem] bg-tertiary-container/25 p-4 text-sm text-on-tertiary-container">
                    {checkoutMessage}
                  </div>
                )}
                {itemCount > 0 ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-[1.5rem] bg-surface-container-low p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                          Items
                        </p>
                        <p className="mt-2 font-headline text-2xl font-bold text-on-surface">
                          {itemCount}
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] bg-surface-container-low p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                          Total Qty
                        </p>
                        <p className="mt-2 font-headline text-2xl font-bold text-on-surface">
                          {totalQuantity}
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] bg-surface-container-low p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                          Total Pages
                        </p>
                        <p className="mt-2 font-headline text-2xl font-bold text-on-surface">
                          {totalPages}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {cartItems.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="rounded-[1.5rem] bg-surface-container-low p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-headline text-lg font-bold text-on-surface">
                                {item.serviceName}
                              </p>
                              {item.isServiceDocument ? (
                                <>
                                  <p className="mt-1 text-sm text-on-surface-variant">
                                    Ready from uploaded service files
                                  </p>
                                  <p className="mt-1 text-xs text-on-surface-variant">
                                    Instant document add-on • No custom print setup needed
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="mt-1 text-sm text-on-surface-variant">
                                    {item.quantity} qty x {item.pages} pages x Rs {item.pricePerPage}
                                  </p>
                                  <p className="mt-1 text-xs text-on-surface-variant">
                                    {item.printMode === 'bw' ? 'Black & White' : 'Color'} • {item.printSides === 'double' ? 'Double-sided' : 'Single-sided'} • {item.paperSize} • {formatFinishingLabel(item.finishing)}
                                  </p>
                                </>
                              )}
                              {item.uniqueCode && (
                                <div className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-primary">
                                  Code: {item.uniqueCode}
                                </div>
                              )}
                              {item.linkedOrderId && (
                                <div className="mt-3 space-y-3">
                                  <DeadlineReminder deadline={item.deadline} isPaid={Boolean(item.collected)} />
                                  <OrderStatusManager
                                    readOnly
                                    status={item.printStatus}
                                    collected={Boolean(item.collected)}
                                    collectedAt={item.collectedAt}
                                  />
                                </div>
                              )}
                              {item.uploadedFiles?.length > 0 && (
                                <div className="mt-3 rounded-2xl bg-surface-container px-3 py-3">
                                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                                    <FileText size={14} strokeWidth={2} />
                                    Uploaded Documents
                                  </div>
                                  <div className="space-y-2">
                                    {item.uploadedFiles.map((file, fileIndex) => (
                                      <div
                                        key={`${formatUploadedFileName(file)}-${fileIndex}`}
                                        className="rounded-xl bg-surface-container-high px-3 py-2 text-sm text-on-surface"
                                      >
                                        {formatUploadedFileName(file)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-3">
                              <p className="font-headline text-xl font-extrabold text-primary">
                                Rs {item.totalPrice.toFixed(2)}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-error-container/15 text-error transition-all hover:bg-error-container/25 active:scale-95"
                                aria-label={`Remove ${item.serviceName}`}
                              >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[1.5rem] bg-surface-container-low p-5">
                      <p className="text-sm text-on-surface-variant">Cart status</p>
                      <p className="mt-2 font-headline text-lg font-bold text-on-surface">
                        {checkoutLabel}
                      </p>
                      <p className="mt-2 text-sm text-on-surface-variant">
                        Every item you add in this prototype is now shown here before checkout.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[1.5rem] bg-surface-container-low p-6 text-center">
                    <p className="font-headline text-lg font-bold text-on-surface">
                      Your cart is empty
                    </p>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      Create an order from the order page and it will appear here.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/order')}
                      className="mt-5 rounded-2xl bg-primary px-5 py-3 font-headline text-sm font-bold text-white shadow-[0_10px_20px_rgba(74,64,224,0.28)] transition-all active:scale-95"
                    >
                      Go to Order Page
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {itemCount > 0 && (
            <aside className="lg:sticky lg:top-28">
              <CartSummary
                pricePerPage={itemCount > 0 ? cartItems[0].pricePerPage : 0}
                pages={totalPages}
                quantity={totalQuantity}
                totalPrice={totalPrice}
                summaryRows={
                  itemCount > 0
                    ? cartItems[0].isServiceDocument
                      ? [
                          ...(cartItems[0].uniqueCode
                            ? [{ label: 'Unique Code', value: cartItems[0].uniqueCode }]
                            : []),
                          { label: 'Item Type', value: 'Uploaded Service File' },
                          { label: 'Documents', value: `${itemCount}` },
                          { label: 'Access', value: 'Added from service list' },
                        ]
                      : [
                          ...(cartItems[0].uniqueCode
                            ? [{ label: 'Unique Code', value: cartItems[0].uniqueCode }]
                            : []),
                          { label: 'Print Type', value: cartItems[0].printMode === 'bw' ? 'Black & White' : 'Color' },
                          { label: 'Sides', value: cartItems[0].printSides === 'double' ? 'Double-sided' : 'Single-sided' },
                          { label: 'Paper Size', value: cartItems[0].paperSize },
                          { label: 'Finishing', value: cartItems[0].finishing === 'none' ? 'None' : cartItems[0].finishing },
                        ]
                    : []
                }
                buttonLabel={isCheckingOut ? 'Processing...' : 'Checkout'}
                onAction={handleCheckout}
              />
            </aside>
          )}
        </section>
      </main>

      <div className="fixed bottom-0 left-0 z-50 w-full">
        <BottomNav />
      </div>
    </div>
  )
}

export default CartPage




