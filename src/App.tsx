import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import PrivateRoute from './components/PrivateRoute'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Toaster } from 'react-hot-toast'
import ScrollToTop from './components/ScrollToTop'

// 🍪 Bandeau cookies
import CookieBanner from './components/CookieBanner'
import CookieManager from './components/CookieManager'

// Pages
import Home from './pages/Home'
import About from './pages/About'
import Shop from './pages/Shop'
import Cart from './pages/Cart'
import Blog from './pages/Blog'
import Contact from './pages/Contact'
import Account from './pages/Account'
import ProducerSpace from './pages/ProducerSpace'
import AdminSpace from './pages/AdminSpace'
import Login from './pages/Login'
import Register from './pages/Register'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Legal from './pages/Legal'
import FAQ from './pages/FAQ'
import NotFound from './pages/NotFound'
import SiteMap from './pages/SiteMap'
import BundleDetail from './pages/BundleDetail'
import Checkout from './pages/Checkout'
import Confirmation from './pages/Confirmation'
import ProducerPublic from './pages/ProducerPublic'
import ProducersCatalog from './pages/ProducersCatalog'
import BlogArticleDetail from './pages/BlogArticleDetail'
import ForgotPassword from './pages/ForgotPassword'

// 🌿 Nouvelle page Producteurs
import BecomeProducer from './pages/BecomeProducer'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop behavior="instant">
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/bundle/:id" element={<BundleDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/confirmation" element={<Confirmation />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogArticleDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/sitemap" element={<SiteMap />} />
                <Route path="/producers/:id" element={<ProducerPublic />} />
                <Route path="/producers" element={<ProducersCatalog />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ForgotPassword />} />

                {/* 🌿 Nouvelle page publique Producteurs */}
                <Route path="/devenir-producteur" element={<BecomeProducer />} />

                {/* 🔐 Espaces protégés */}
                <Route
                  path="/account/*"
                  element={
                    <PrivateRoute>
                      <Account />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/producer/*"
                  element={
                    <PrivateRoute>
                      <ProducerSpace />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/*"
                  element={
                    <PrivateRoute>
                      <AdminSpace />
                    </PrivateRoute>
                  }
                />

                {/* 🍪 Page de gestion des cookies */}
                <Route path="/cookies-settings" element={<CookieManager />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>

            {/* Notifications */}
            <Toaster position="top-center" />
            <ToastContainer
              position="top-center"
              autoClose={3000}
              hideProgressBar={true}
              newestOnTop={true}
              closeOnClick
              pauseOnFocusLoss={false}
              draggable={false}
              pauseOnHover={false}
              toastClassName="rounded-xl bg-[#F5FBEF] text-[#245A1F] font-medium shadow-md"
              className="text-sm"
            />

            {/* 🍪 Bandeau cookies */}
            <CookieBanner />
          </ScrollToTop>
        </Router>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
