import React from 'react'

function CartSummary({
  pricePerPage,
  pages,
  quantity,
  totalPrice,
  summaryRows = [],
  priceNote,
  buttonLabel = 'Add to Cart',
  onAction,
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-outline-variant/20 bg-surface-container-highest/85 shadow-[0_24px_48px_rgba(32,48,68,0.10)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <div className="border-b border-outline-variant/20 bg-gradient-to-br from-primary/12 to-secondary-container/30 p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
          Order Summary
        </p>
        <p className="mt-2 font-headline text-3xl font-extrabold text-primary">
          Rs {totalPrice.toFixed(2)}
        </p>
        <p className="mt-2 text-sm text-on-surface-variant">
          Simple pricing with instant live calculation.
        </p>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {[
          { label: 'Price per page', value: `Rs ${pricePerPage}` },
          { label: 'Pages', value: `${pages}` },
          { label: 'Quantity', value: `${quantity}` },
          ...summaryRows,
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <span className="text-sm text-on-surface-variant">{item.label}</span>
            <span className="font-semibold text-on-surface">{item.value}</span>
          </div>
        ))}

        <div className="border-t border-outline-variant/20 pt-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-headline text-base font-bold text-on-surface">Total</span>
            <span className="font-headline text-2xl font-extrabold text-primary">
              Rs {totalPrice.toFixed(2)}
            </span>
          </div>
          <p className="mt-2 text-xs text-on-surface-variant">
            {priceNote || `Rs ${pricePerPage} x ${pages} pages x ${quantity} qty`}
          </p>
        </div>

        <button
          type="button"
          onClick={onAction}
          className="mt-2 flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 font-headline font-bold text-white shadow-[0_10px_20px_rgba(74,64,224,0.3)] transition-all hover:shadow-[0_14px_28px_rgba(74,64,224,0.35)] active:scale-95"
        >
          <span className="material-symbols-outlined">
            {buttonLabel === 'Checkout' ? 'payments' : 'shopping_cart'}
          </span>
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}

export default CartSummary
