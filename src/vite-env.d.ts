interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_PASSWORD_CONFIRM_PROFILE: string
  readonly VITE_PASSWORD_CONFIRM_ADDRESSES: string
  readonly VITE_PASSWORD_CONFIRM_COMPANIES: string
  readonly VITE_PASSWORD_CONFIRM_CERTIFICATIONS: string
  readonly VITE_PASSWORD_CONFIRM_PRODUCTS: string
  readonly VITE_PASSWORD_CONFIRM_PRODUCT_BUNDLES: string
  readonly VITE_PASSWORD_CONFIRM_PAYMENT: string
  readonly VITE_PASSWORD_CONFIRM_DELETE: string
  readonly VITE_FREE_SHIPPING_THRESHOLD: string
  readonly VITE_BASE_SHIPPING_COST: string
  readonly VITE_FORECAST_IA: string
  readonly VITE_DASHBOARD_PRODUCER: string
  readonly VITE_DASHBOARD_ADMIN: string
  readonly VITE_PASSWORD_CONFIRM_USERS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}