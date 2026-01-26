import Header from './Header'
import Footer from './Footer'
// import CookieConsent from '../CookieConsent'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  // const [showCookieConsent, setShowCookieConsent] = useState(true)

  return (
    <div className="min-h-screen bg-pale-yellow">
      <Header />
      <main className="pt-20">
        {children}
      </main>
      <Footer />
      {/*
      {showCookieConsent && (
        <CookieConsent onAccept={() => setShowCookieConsent(false)} />
      )}
      */}
    </div>
  )
}
