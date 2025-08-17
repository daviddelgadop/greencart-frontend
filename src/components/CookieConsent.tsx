import React from 'react'
import { Cookie, X } from 'lucide-react'

interface CookieConsentProps {
  onAccept: () => void
}

export default function CookieConsent({ onAccept }: CookieConsentProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-brown text-pale-yellow p-4 shadow-lg z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <Cookie className="w-6 h-6 text-orange-beige" />
          <p className="text-sm">
            Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic. 
            En continuant, vous acceptez notre utilisation des cookies.{' '}
            <a href="/privacy" className="underline hover:text-orange-beige transition-colors">
              En savoir plus
            </a>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onAccept}
            className="bg-dark-green text-pale-yellow px-6 py-2 rounded-full text-sm font-medium hover:bg-dark-green/90 transition-colors"
          >
            Accepter
          </button>
          <button
            onClick={onAccept}
            className="p-2 hover:bg-pale-yellow/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}