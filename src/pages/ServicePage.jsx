import React from 'react'
import { BookOpenText, FileImage, Layers3, Zap } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import MobileShell from '../components/MobileShell'
import PrimaryButton from '../components/PrimaryButton'
import SectionCard from '../components/SectionCard'

const services = [
  {
    title: 'Document Print',
    subtitle: 'Assignments, notes, dissertations',
    price: 'From Rs 2/page',
    icon: BookOpenText,
    bg: 'rgba(74, 64, 224, 0.08)',
    color: 'var(--primary)',
  },
  {
    title: 'Poster Print',
    subtitle: 'A4 to A1 promotional prints',
    price: 'From Rs 49',
    icon: FileImage,
    bg: 'rgba(199, 52, 52, 0.08)',
    color: '#c73434',
  },
  {
    title: 'Binding',
    subtitle: 'Spiral, hardbound, lamination',
    price: 'From Rs 25',
    icon: Layers3,
    bg: 'rgba(230, 160, 0, 0.08)',
    color: '#b88200',
  },
]

function ServicePage() {
  return (
    <MobileShell bottomNav={<BottomNav />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Header */}
        <div>
          <p className="label-md">Service details</p>
          <h1 className="headline-lg" style={{ marginTop: '0.25rem' }}>
            Choose your print package
          </h1>
        </div>

        {/* Express Banner */}
        <SectionCard
          style={{
            background:
              'linear-gradient(135deg, #1a1440 0%, var(--primary) 70%, var(--primary-container) 100%)',
            color: '#fff',
            borderRadius: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-30%',
              right: '-10%',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: 'var(--radius-card)',
                background: 'rgba(27, 158, 90, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6ff7a8',
              }}
            >
              <Zap size={20} strokeWidth={1.5} />
            </div>
            <div>
              <p
                className="label-md"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                Express printing
              </p>
              <h2 className="title-md" style={{ color: '#fff' }}>
                Ready in under 30 minutes
              </h2>
            </div>
          </div>
          <p
            className="body-md"
            style={{ color: 'rgba(255,255,255,0.7)', marginTop: '1rem' }}
          >
            Select paper size, color mode, and finishing. The estimated total
            updates instantly before checkout.
          </p>
        </SectionCard>

        {/* Service Cards */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {services.map((service) => {
            const Icon = service.icon

            return (
              <SectionCard key={service.title}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div
                    style={{
                      width: '3.5rem',
                      height: '3.5rem',
                      borderRadius: 'var(--radius-card)',
                      background: service.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: service.color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={22} strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            fontWeight: 600,
                            color: 'var(--on-surface)',
                            fontSize: '0.9375rem',
                          }}
                        >
                          {service.title}
                        </h2>
                        <p className="body-md" style={{ marginTop: '0.25rem' }}>
                          {service.subtitle}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: 'var(--on-surface)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {service.price}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginTop: '0.75rem',
                      }}
                    >
                      <span
                        style={{
                          borderRadius: '2rem',
                          background: 'var(--surface-container-low)',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                          color: 'var(--on-surface-variant)',
                        }}
                      >
                        A4 / A3
                      </span>
                      <span
                        style={{
                          borderRadius: '2rem',
                          background: 'var(--surface-container-low)',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                          color: 'var(--on-surface-variant)',
                        }}
                      >
                        Color or B/W
                      </span>
                    </div>
                  </div>
                </div>
              </SectionCard>
            )
          })}
        </div>

        {/* Configuration Summary */}
        <SectionCard>
          <h2 className="title-md">Selected configuration</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginTop: '1rem',
            }}
          >
            {[
              { label: 'Copies', value: '3 sets' },
              { label: 'Pages per set', value: '24 pages' },
              { label: 'Finish', value: 'Spiral binding' },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span className="body-md">{row.label}</span>
                <span
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--on-surface)',
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: '0.25rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--outline-variant)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.9375rem', color: 'var(--on-surface)' }}>
                Total
              </span>
              <span
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--on-surface)',
                }}
              >
                Rs 186
              </span>
            </div>
          </div>
          <div
            style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}
          >
            <PrimaryButton className="flex-1" style={{ flex: 1 }}>
              Add to cart
            </PrimaryButton>
            <PrimaryButton
              variant="outline"
              className="flex-1"
              style={{ flex: 1 }}
            >
              Upload file
            </PrimaryButton>
          </div>
        </SectionCard>
      </div>
    </MobileShell>
  )
}

export default ServicePage
