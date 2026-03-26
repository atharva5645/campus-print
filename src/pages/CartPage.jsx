import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import CartSummary from '../components/CartSummary'
import { getCartItems } from '../api/cartApi'
import { createOrder } from '../api/orderApi'
import { supabase } from '../lib/supabase'

function CartPage() {
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [pageError, setPageError] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState('')

  useEffect(() => {
    async function loadCart() {
      try {
        const { data, error } = await supabase.auth.getUser()

        if (error || !data.user) {
          navigate('/', { replace: true })
          return
        }

        const cartItems = await getCartItems(data.user.id)

        if (cartItems.length > 0) {
          const latestItem = cartItems[0]

          setOrder({
            id: latestItem.id,
            serviceId: latestItem.service_id,
            serviceName: latestItem.services?.name || 'Printing Order',
            pages: latestItem.pages,
            quantity: latestItem.quantity,
            pricePerPage: Number(latestItem.price_per_page),
            totalPrice: Number(latestItem.total_price),
          })
        } else {
          setOrder(null)
        }
      } catch (error) {
        setPageError(error.message)
      }
    }

    loadCart()
  }, [navigate])

  const checkoutLabel = useMemo(() => {
    if (!order) return 'No order selected'
    return `${order.quantity} set${order.quantity > 1 ? 's' : ''} ready for checkout`
  }, [order])

  const handleCheckout = async () => {
    if (!order?.serviceId) {
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

      await createOrder({
        user_id: data.user.id,
        student_name: data.user.email,
        service_id: order.serviceId,
        pages: order.pages,
        quantity: order.quantity,
        price_per_page: order.pricePerPage,
        notes: 'Created from CampusPrint cart checkout',
        file_urls: [],
      })
      setCheckoutMessage('Order created successfully. You can now review it from the admin dashboard queue.')
      setPageError('')
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(151,149,255,0.18),_transparent_34%),_var(--clr-surface)] font-body text-on-surface antialiased">
      <header className="sticky top-0 z-40 border-b border-white/20 bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 shadow-[0_16px_36px_rgba(32,48,68,0.12)] backdrop-blur-xl">
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
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 sm:pt-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] border border-white/30 bg-surface-container-lowest shadow-[0_24px_48px_rgba(32,48,68,0.08)]">
              <div className="border-b border-outline-variant/20 bg-gradient-to-br from-primary/10 to-secondary-container/25 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShoppingBag size={22} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">
                      Selected Order
                    </p>
                    <h2 className="mt-1 font-headline text-2xl font-bold text-on-surface">
                      {order?.serviceName || 'No item in cart'}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                {pageError && (
                  <div className="rounded-[1.5rem] bg-error-container/10 p-4 text-sm text-error">
                    {pageError}
                  </div>
                )}
                {checkoutMessage && (
                  <div className="rounded-[1.5rem] bg-tertiary-container/25 p-4 text-sm text-on-tertiary-container">
                    {checkoutMessage}
                  </div>
                )}
                {order ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-[1.5rem] bg-surface-container-low p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                          Quantity
                        </p>
                        <p className="mt-2 font-headline text-2xl font-bold text-on-surface">
                          {order.quantity}
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] bg-surface-container-low p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                          Pages
                        </p>
                        <p className="mt-2 font-headline text-2xl font-bold text-on-surface">
                          {order.pages}
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] bg-surface-container-low p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                          Price/Page
                        </p>
                        <p className="mt-2 font-headline text-2xl font-bold text-on-surface">
                          Rs {order.pricePerPage}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] bg-surface-container-low p-5">
                      <p className="text-sm text-on-surface-variant">Cart status</p>
                      <p className="mt-2 font-headline text-lg font-bold text-on-surface">
                        {checkoutLabel}
                      </p>
                      <p className="mt-2 text-sm text-on-surface-variant">
                        Review the summary and continue to complete your printing order.
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

          {order && (
            <aside className="lg:sticky lg:top-28">
              <CartSummary
                pricePerPage={order.pricePerPage}
                pages={order.pages}
                quantity={order.quantity}
                totalPrice={order.totalPrice}
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
