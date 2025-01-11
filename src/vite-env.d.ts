/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SEQUENCE_PROJECT_ACCESS_KEY: string;
  readonly VITE_WAAS_CONFIG_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
