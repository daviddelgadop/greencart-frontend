import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL as string

const getAccessToken = () => localStorage.getItem('access') || ''
const getRefreshToken = () => localStorage.getItem('refresh') || ''
export const setTokens = (access: string, refresh?: string) => {
  localStorage.setItem('access', access)
  if (typeof refresh === 'string') localStorage.setItem('refresh', refresh)
}
export const clearTokens = () => {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
}
export const isAuthenticated = () => Boolean(getAccessToken())

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
})

function ensureSessionKey() {
  const k = localStorage.getItem('guest_session_key')
  if (k) return k
  const gen = (crypto as any)?.randomUUID?.() || (Math.random().toString(36).slice(2) + Date.now().toString(36))
  localStorage.setItem('guest_session_key', gen)
  return gen
}

// Attach Authorization and X-Session-Key
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  config.headers = config.headers || {}
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else if (config.headers.Authorization) {
    delete (config.headers as any).Authorization
  }
  const sk = ensureSessionKey()
  config.headers['X-Session-Key'] = sk
  return config
})

let isRefreshing = false
let pendingQueue: Array<(token: string) => void> = []

const enqueue = (cb: (token: string) => void) => pendingQueue.push(cb)
const flushQueue = (token: string) => {
  pendingQueue.forEach(cb => cb(token))
  pendingQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean })
    const status = error.response?.status

    if (status === 401 && !original?._retry) {
      original._retry = true
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const refresh = getRefreshToken()
          if (!refresh) {
            clearTokens()
            return Promise.reject(error)
          }
          const { data } = await axios.post<{ access: string }>(
            `${API_URL}/api/token/refresh/`,
            { refresh }
          )
          const newAccess = data.access
          setTokens(newAccess)
          isRefreshing = false
          flushQueue(newAccess)
        } catch (e) {
          isRefreshing = false
          pendingQueue = []
          clearTokens()
          return Promise.reject(e)
        }
      }
      return new Promise((resolve, reject) => {
        enqueue((newToken: string) => {
          if (!original.headers) original.headers = {}
          ;(original.headers as any).Authorization = `Bearer ${newToken}`
          resolve(api(original))
        })
        setTimeout(() => reject(error), 15000)
      })
    }

    return Promise.reject(error)
  }
)

type HttpMethod = 'get' | 'post' | 'patch' | 'put' | 'delete'

async function request<T>(method: HttpMethod, url: string, body?: any, config?: AxiosRequestConfig) {
  const cfg: AxiosRequestConfig = { url, method, ...config }
  if (body !== undefined) cfg.data = body
  const res: AxiosResponse<T> = await api.request<T>(cfg)
  return res.data
}

export const http = {
  get:   <T = any>(url: string, config?: AxiosRequestConfig) => request<T>('get', url, undefined, config),
  post:  <T = any>(url: string, body?: any, config?: AxiosRequestConfig) => request<T>('post', url, body, config),
  patch: <T = any>(url: string, body?: any, config?: AxiosRequestConfig) => request<T>('patch', url, body, config),
  put:   <T = any>(url: string, body?: any, config?: AxiosRequestConfig) => request<T>('put', url, body, config),
  delete:<T = any>(url: string, config?: AxiosRequestConfig) => request<T>('delete', url, undefined, config),

  upload: <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig) =>
    request<T>('post', url, formData, {
      ...config,
      headers: { ...(config?.headers || {}) },
    }),

  login: async (username: string, password: string) => {
    const data = await axios.post<{ access: string; refresh: string }>(`${API_URL}/api/token/`, { username, password })
    setTokens(data.data.access, data.data.refresh)
    return data.data
  },
  refresh: async () => {
    const refresh = getRefreshToken()
    const { data } = await axios.post<{ access: string }>(`${API_URL}/api/token/refresh/`, { refresh })
    setTokens(data.access)
    return data
  },
  logout: () => clearTokens(),
}
