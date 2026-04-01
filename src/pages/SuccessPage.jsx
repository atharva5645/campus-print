import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { QRCode } from 'react-qr-code'
import NotificationBell from '../components/NotificationBell'
import { supabase } from '../lib/supabase'

function SuccessPage() {
  const { state } = useLocation()
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    let mounted = true

    async function loadUser() {
      try {
        const { data } = await supabase.auth.getUser()
        if (!mounted) return
        setCurrentUser(data.user || null)
      } catch {
        if (!mounted) return
        setCurrentUser(null)
      }
    }

    loadUser()
    return () => {
      mounted = false
    }
  }, [])

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <p className="text-xl font-semibold">No Order Data Found</p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-white">
      <div className="absolute right-6 top-6">
        <NotificationBell audience="student" userId={currentUser?.id} variant="dark" />
      </div>
      <div className="w-full max-w-md rounded-3xl bg-slate-900 p-8 text-center shadow-2xl">
        <h1 className="text-3xl font-bold">Order Placed Successfully</h1>
        <div className="mt-8 flex justify-center rounded-2xl bg-white p-4">
          <QRCode value={JSON.stringify(state)} size={200} />
        </div>
        <div className="mt-8 space-y-3 text-left text-base">
          <p><span className="font-semibold">Name:</span> {state.name}</p>
          <p><span className="font-semibold">Department:</span> {state.dept}</p>
          <p><span className="font-semibold">File:</span> {state.file}</p>
          <p><span className="font-semibold">Code:</span> {state.code}</p>
        </div>
      </div>
    </div>
  )
}

export default SuccessPage
