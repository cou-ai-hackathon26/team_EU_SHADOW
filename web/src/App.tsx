import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import { matchRoute } from './app/router'

export default function App() {
  const [currentHash, setCurrentHash] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash : ''
  )

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  const currentRoute = matchRoute(currentHash)
  const CurrentComponent = currentRoute.component

  return (
    <Layout currentHash={currentHash}>
      <CurrentComponent />
    </Layout>
  )
}
