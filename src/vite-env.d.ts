/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OCR_ENDPOINT?: string
  readonly VITE_OCR_API_KEY?: string
  readonly VITE_PLACA_ENDPOINT?: string
  readonly VITE_PLACA_API_KEY?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
