import { useEffect, useState } from 'react'
import AccuracyScreen from './features/about/AccuracyScreen'

// App shell placeholder. Owner: Tanjil (T1) replaces this with the real layout and routing.
export default function App() {
  // F1 router will replace this
  const [hash, setHash] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash : ''
  )

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (hash === '#/accuracy') {
    return <AccuracyScreen />
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold text-leaf-800">AgroLeaf AI</h1>
      <p>ধানপাতার রোগের প্রাথমিক স্ক্রিনিং</p>
      <p className="text-sm text-slate-600">
        এটি প্রাথমিক স্ক্রিনিং, চূড়ান্ত রোগ নির্ণয় নয়। প্রয়োজনে কৃষি কল সেন্টার ১৬১২৩-এ ফোন করুন।
      </p>
    </main>
  )
}
