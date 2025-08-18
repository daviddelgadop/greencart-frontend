// src/contexts/CartContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  ReactNode,
} from 'react'
import { http } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { CartItem as UITypesCartItem } from '../types/CartItem'

const DEBUG_MEDIA = true
const logMedia = (...args: any[]) => {
  if (DEBUG_MEDIA) console.log('[CartContext][media]', ...args)
}

type CartItem = UITypesCartItem & {
  serverItemId?: number
  total_avoided_waste_kg: number
  total_avoided_co2_kg: number
}

interface CartState {
  items: CartItem[]
  total: number
}

type Action =
  | { type: 'REPLACE_CART'; payload: { items: CartItem[] } }
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'CLEAR_CART' }

const initialState: CartState = { items: [], total: 0 }

function calcTotal(items: CartItem[]) {
  return items.reduce((s, it) => s + Number(it.price) * it.quantity, 0)
}

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'REPLACE_CART': {
      const items = action.payload.items
      return { items, total: calcTotal(items) }
    }
    case 'ADD_TO_CART': {
      const exists = state.items.find(i => i.id === action.payload.id)
      const items = exists
        ? state.items.map(i =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          )
        : [...state.items, action.payload]
      return { items, total: calcTotal(items) }
    }
    case 'UPDATE_QUANTITY': {
      const items = state.items
        .map(i => (i.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i))
        .filter(i => i.quantity > 0)
      return { items, total: calcTotal(items) }
    }
    case 'REMOVE_FROM_CART': {
      const items = state.items.filter(i => i.id !== action.payload)
      return { items, total: calcTotal(items) }
    }
    case 'CLEAR_CART':
      return initialState
    default:
      return state
  }
}

type CartContextType = {
  state: CartState
  add: (
    bundleId: number,
    quantity?: number,
    impact?: { avoided_waste_kg?: number; avoided_co2_kg?: number }
  ) => Promise<void>
  addToCart: (item: CartItem, impact?: { avoided_waste_kg?: number; avoided_co2_kg?: number }) => Promise<void>
  updateQuantity: (
    bundleId: number,
    quantity: number,
    impact?: { avoided_waste_kg?: number; avoided_co2_kg?: number }
  ) => Promise<void>
  removeFromCart: (bundleId: number) => Promise<void>
  clearCart: () => Promise<void>
  reload: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

//function resolveImage(url?: string | null): string {
//  if (DEBUG_MEDIA) console.groupCollapsed('[resolveImage] in:', url)
//  if (!url) {
//    if (DEBUG_MEDIA) console.groupEnd()
//    return ''
//  }
//  if (/^https?:\/\//i.test(url)) {
//    if (DEBUG_MEDIA) {
//      console.log('absolute passthrough:', url)
//      console.groupEnd()
//    }
//    return url
//  }
//
//  let u = url.startsWith('/') ? url : `/${url}`
//  u = u.replace(/\/media\/media\//g, '/media/')
//  if (!/^\/media\//.test(u)) {
//    u = u.startsWith('/media')
//      ? u.replace(/^\/media(?!\/)/, '/media/')
//      : `/media${u}`
//  }

//  const base = http.defaults?.baseURL || ''
//  const finalUrl = `${base.replace(/\/+$/, '')}${u}`
//
//  if (DEBUG_MEDIA) {
//    if (/\/media\/media\//.test(finalUrl)) {
//      console.warn('DOUBLE MEDIA DETECTED after resolve:', finalUrl)
//    }
//    console.log('out:', finalUrl)
//    console.groupEnd()
//  }
//  return finalUrl
//  }

function getGuestKey() {
  let key = localStorage.getItem('guest_session_key')
  if (!key) {
    key = crypto.randomUUID()
    localStorage.setItem('guest_session_key', key)
  }
  return key
}

function withCartHeaders(): { headers?: Record<string, string> } {
  const token = localStorage.getItem('access')
  if (token) return {}
  return { headers: { 'X-Session-Key': getGuestKey() } }
}

function isFiniteNumber(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x)
}

function mapServerItems(serverItems: any[]): CartItem[] {
  return (serverItems || []).map((it: any) => {
    const bundleId = Number(it.bundle_id ?? it.bundle)
    const serverItemId = Number(it.id)

    const title =
      it.title_snapshot ??
      it.bundle_title ??
      it.bundle_snapshot?.title ??
      ''

    const price = Number(
      it.price_snapshot ??
        it.bundle_snapshot?.discounted_price ??
        it.bundle_snapshot?.original_price ??
        0
    )

    const rawA = it.bundle_image
    const rawB = it.bundle_image_url
    const rawC = it.bundle_snapshot?.image
    const rawArray0 = Array.isArray(it.bundle_snapshot?.images)
      ? it.bundle_snapshot.images[0]?.image
      : undefined

    const imageRaw = rawA ?? rawB ?? rawC ?? rawArray0 ?? ''
    //const image = resolveImage(imageRaw)
    const image = imageRaw

    const qty = Math.max(1, Number(it.quantity ?? 1))
    const avoidedWaste = Number(it.avoided_waste_kg ?? 0)
    const avoidedCO2 = Number(it.avoided_co2_kg ?? 0)

    const dluoText = String(it.dluo_snapshot ?? it.dluo ?? '')
    const producerNameVal = String(
      it.company_name_snapshot ?? it.company_name ?? it.producerName ?? ''
    )

    return {
      id: bundleId,
      serverItemId,
      title,
      price,
      image,
      dluo: dluoText,
      producerName: producerNameVal || undefined,
      quantity: qty,
      items: [],
      total_avoided_waste_kg: isNaN(avoidedWaste) ? 0 : avoidedWaste,
      total_avoided_co2_kg: isNaN(avoidedCO2) ? 0 : avoidedCO2,
    }
  })
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(reducer, initialState)

  const reload = async () => {
    const data = await http.get<{ items: any[] }>('api/cart/', withCartHeaders())
    dispatch({ type: 'REPLACE_CART', payload: { items: mapServerItems(data.items) } })
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await http.get<{ items: any[] }>('api/cart/', withCartHeaders())
        if (!alive) return
        dispatch({ type: 'REPLACE_CART', payload: { items: mapServerItems(data.items) } })
      } catch {}
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!DEBUG_MEDIA) return
    //console.groupCollapsed('[state] items images after update')
    state.items.forEach(it => {
    //  console.log(`item bundle=${it.id} serverItemId=${it.serverItemId} image=`, it.image)
    })
    //console.groupEnd()
  }, [state.items])

  const mergedOnceRef = useRef(false)

  useEffect(() => {
    if (!user) mergedOnceRef.current = false
  }, [user])

  useEffect(() => {
    ;(async () => {
      if (!user || mergedOnceRef.current) return
      try {
        await http.post(
          'api/cart/merge/',
          {},
          { headers: { 'Content-Type': 'application/json', 'X-Session-Key': getGuestKey() } }
        )
        await reload()
      } catch {
      } finally {
        mergedOnceRef.current = true
      }
    })()
  }, [user])

  useEffect(() => {
    const onReset = () => dispatch({ type: 'CLEAR_CART' })
    window.addEventListener('cart:reset', onReset as EventListener)
    return () => window.removeEventListener('cart:reset', onReset as EventListener)
  }, [])

  const add: CartContextType['add'] = async (bundleId, quantity = 1, impact) => {
    const optimistic: CartItem = {
      id: bundleId,
      title: '',
      price: 0,
      image: '',
      dluo: '',
      quantity,
      items: [],
      total_avoided_waste_kg: Number(impact?.avoided_waste_kg ?? 0),
      total_avoided_co2_kg: Number(impact?.avoided_co2_kg ?? 0),
    }
    dispatch({ type: 'ADD_TO_CART', payload: optimistic })
    try {
      const payload: Record<string, unknown> = { bundle: bundleId, quantity }
      if (isFiniteNumber(impact?.avoided_waste_kg)) payload.avoided_waste_kg = impact!.avoided_waste_kg
      if (isFiniteNumber(impact?.avoided_co2_kg)) payload.avoided_co2_kg = impact!.avoided_co2_kg
      await http.post('api/cart/items/', payload, {
        headers: { 'Content-Type': 'application/json', ...(withCartHeaders().headers || {}) },
      })
      await reload()
    } catch {
      await reload()
    }
  }

  const addToCart: CartContextType['addToCart'] = async (item, impact) => {
    dispatch({ type: 'ADD_TO_CART', payload: item })
    try {
      const payload: Record<string, unknown> = { bundle: item.id, quantity: item.quantity }
      if (isFiniteNumber(impact?.avoided_waste_kg)) payload.avoided_waste_kg = impact!.avoided_waste_kg
      if (isFiniteNumber(impact?.avoided_co2_kg)) payload.avoided_co2_kg = impact!.avoided_co2_kg
      if (item.producerName) payload.producer_name = item.producerName
      await http.post('api/cart/items/', payload, {
        headers: { 'Content-Type': 'application/json', ...(withCartHeaders().headers || {}) },
      })
      await reload()
    } catch {
      await reload()
    }
  }

  const updateQuantity: CartContextType['updateQuantity'] = async (bundleId, quantity, impact) => {
    const next = Math.max(1, quantity)
    const prev = state.items.find(i => i.id === bundleId)?.quantity ?? 1
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: bundleId, quantity: next } })

    try {
      let serverItemId = state.items.find(i => i.id === bundleId)?.serverItemId
      if (!serverItemId) {
        const data = await http.get<{ items: any[] }>('api/cart/', withCartHeaders())
        const fresh = mapServerItems(data.items)
        dispatch({ type: 'REPLACE_CART', payload: { items: fresh } })
        serverItemId = fresh.find(i => i.id === bundleId)?.serverItemId
      }
      if (serverItemId) {
        const current = state.items.find(i => i.id === bundleId)
        const body: Record<string, unknown> = { quantity: next }
        if (isFiniteNumber(impact?.avoided_waste_kg)) body.avoided_waste_kg = impact!.avoided_waste_kg
        if (isFiniteNumber(impact?.avoided_co2_kg)) body.avoided_co2_kg = impact!.avoided_co2_kg
        if (current?.producerName) body.producer_name = current.producerName
        await http.patch(`api/cart/item/${serverItemId}/`, body, {
          headers: { 'Content-Type': 'application/json', ...(withCartHeaders().headers || {}) },
        })
      } else {
        const payload: Record<string, unknown> = { bundle: bundleId, quantity: next }
        if (isFiniteNumber(impact?.avoided_waste_kg)) payload.avoided_waste_kg = impact!.avoided_waste_kg
        if (isFiniteNumber(impact?.avoided_co2_kg)) payload.avoided_co2_kg = impact!.avoided_co2_kg
        await http.post('api/cart/items/', payload, {
          headers: { 'Content-Type': 'application/json', ...(withCartHeaders().headers || {}) },
        })
      }
      await reload()
    } catch {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: bundleId, quantity: prev } })
      try { await reload() } catch {}
    }
  }

  const removeFromCart = async (bundleId: number) => {
    const backup = state.items
    dispatch({ type: 'REMOVE_FROM_CART', payload: bundleId })
    try {
      const serverItemId = backup.find(i => i.id === bundleId)?.serverItemId
      if (serverItemId) await http.delete(`api/cart/item/${serverItemId}/`, withCartHeaders())
      await reload()
    } catch {
      dispatch({ type: 'REPLACE_CART', payload: { items: backup } })
    }
  }

  const clearCart = async () => {
    const backup = state.items
    dispatch({ type: 'CLEAR_CART' })
    try {
      await http.delete('api/cart/clear/', withCartHeaders())
      await reload()
    } catch {
      dispatch({ type: 'REPLACE_CART', payload: { items: backup } })
    }
  }

  const value = useMemo(
    () => ({ state, add, addToCart, updateQuantity, removeFromCart, clearCart, reload }),
    [state]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
