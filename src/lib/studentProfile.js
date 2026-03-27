const STORAGE_KEY = 'campus_print_student_profile'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getStudentProfile() {
  if (!canUseStorage()) {
    return {
      name: '',
      usn: '',
      department: '',
    }
  }

  const savedProfile = window.localStorage.getItem(STORAGE_KEY)
  if (!savedProfile) {
    return {
      name: '',
      usn: '',
      department: '',
    }
  }

  try {
    const parsed = JSON.parse(savedProfile)
    return {
      name: parsed?.name || '',
      usn: parsed?.usn || '',
      department: parsed?.department || '',
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return {
      name: '',
      usn: '',
      department: '',
    }
  }
}

export function saveStudentProfile(profile) {
  if (!canUseStorage()) return

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      name: profile?.name || '',
      usn: profile?.usn || '',
      department: profile?.department || '',
    }),
  )
}
