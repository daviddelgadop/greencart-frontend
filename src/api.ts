// src/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error('Échec de connexion')
  }

  return response.json()
}
