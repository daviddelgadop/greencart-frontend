type HttpOptions = RequestInit & { headers?: Record<string, string> }

const RAW_BASE = import.meta.env.VITE_API_URL || ""
const BASE = RAW_BASE.replace(/\/+$/, "") 

function resolve(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const p = path.startsWith("/") ? path : `/${path}`
  return BASE ? `${BASE}${p}` : p
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = ""
    try { msg = await res.text() } catch {}
    throw new Error(msg || `HTTP ${res.status}`)
  }
  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/json")) {
    return (await res.json()) as T
  }
  return undefined as unknown as T
}

export const http = {
  base: BASE,
  url: resolve,

  async get<T>(path: string, options: HttpOptions = {}) {
    const res = await fetch(resolve(path), {
      ...options,
      method: "GET",
      headers: { Accept: "application/json", ...(options.headers || {}) },
      credentials: options.credentials ?? "omit",
      cache: options.cache ?? "no-store",
    })
    return handle<T>(res)
  },

  async post<T = any>(path: string, body?: any, options: HttpOptions = {}) {
    const isForm = typeof FormData !== "undefined" && body instanceof FormData
    const res = await fetch(resolve(path), {
      ...options,
      method: "POST",
      body: isForm ? body : JSON.stringify(body ?? {}),
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        Accept: "application/json",
        ...(options.headers || {}),
      },
      credentials: options.credentials ?? "omit",
    })
    return handle<T>(res)
  },

  async put<T = any>(path: string, body?: any, options: HttpOptions = {}) {
    const isForm = typeof FormData !== "undefined" && body instanceof FormData
    const res = await fetch(resolve(path), {
      ...options,
      method: "PUT",
      body: isForm ? body : JSON.stringify(body ?? {}),
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        Accept: "application/json",
        ...(options.headers || {}),
      },
      credentials: options.credentials ?? "omit",
    })
    return handle<T>(res)
  },

  async patch<T = any>(path: string, body?: any, options: HttpOptions = {}) {
    const isForm = typeof FormData !== "undefined" && body instanceof FormData
    const res = await fetch(resolve(path), {
      ...options,
      method: "PATCH",
      body: isForm ? body : JSON.stringify(body ?? {}),
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        Accept: "application/json",
        ...(options.headers || {}),
      },
      credentials: options.credentials ?? "omit",
    })
    return handle<T>(res)
  },

  async del<T = any>(path: string, options: HttpOptions = {}) {
    const res = await fetch(resolve(path), {
      ...options,
      method: "DELETE",
      headers: { Accept: "application/json", ...(options.headers || {}) },
      credentials: options.credentials ?? "omit",
    })
    return handle<T>(res)
  },
}
