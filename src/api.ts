// src/api.ts
const RAW = import.meta.env.VITE_API_URL || '';
const BASE = RAW.replace(/\/+$/, '') || 'https://mcyd2zywpj.eu-west-3.awsapprunner.com';

const url = (path: string) => `${BASE}/${path.replace(/^\/+/, '')}`;

// ---------- Auth ----------
export async function loginUser(email: string, password: string) {
  const res = await fetch(url('api/auth/token/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`Échec de connexion (${res.status}) ${msg}`);
  }
  return res.json();
}

export async function registerUser(
  email: string,
  password: string,
  type: 'customer' | 'producer'
) {
  const res = await fetch(url('api/auth/register/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, type }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`Échec d'inscription (${res.status}) ${msg}`);
  }
  return res.json();
}

export async function getPosts() {
  const res = await fetch(url('api/blog/posts/'));
  if (!res.ok) throw new Error(`Erreur chargement posts (${res.status})`);
  return res.json();
}
