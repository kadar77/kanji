/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the hayaoshi-server Worker, e.g. https://hayaoshi-server.<sub>.workers.dev */
  readonly VITE_HAYAOSHI_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
