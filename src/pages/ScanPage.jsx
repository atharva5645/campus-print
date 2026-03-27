import { useState } from 'react'
import { QrReader } from 'react-qr-reader'

function ScanPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const handleResult = (result) => {
    if (!result?.text) {
      return
    }

    try {
      const parsed = JSON.parse(result.text)
      setData(parsed)
      setError('')
    } catch {
      setData(null)
      setError('Invalid QR Code')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-white">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-3xl font-bold">Scan Order QR</h1>
        <div className="overflow-hidden rounded-2xl bg-black">
          <QrReader
            constraints={{ facingMode: 'environment' }}
            onResult={(result, scanError) => {
              if (result) {
                handleResult(result)
              }

              if (scanError && !data) {
                setError('')
              }
            }}
            containerStyle={{ width: '100%' }}
            videoStyle={{ width: '100%' }}
          />
        </div>

        {error && <p className="mt-4 text-center font-semibold text-red-400">{error}</p>}

        {data && (
          <div className="mt-6 space-y-3 rounded-2xl bg-slate-800 p-5 text-base">
            <p><span className="font-semibold">Name:</span> {data.name}</p>
            <p><span className="font-semibold">Department:</span> {data.dept}</p>
            <p><span className="font-semibold">File:</span> {data.file}</p>
            <p><span className="font-semibold">Code:</span> {data.code}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScanPage
