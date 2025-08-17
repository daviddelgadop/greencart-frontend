// src/components/PrivateRoute.tsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface PrivateRouteProps {
  children: JSX.Element
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="text-center mt-10 text-dark-green">Chargement...</div>
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}
