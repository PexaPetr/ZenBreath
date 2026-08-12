/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string;
  /** Comma-separated: static, openai, webspeech (order = try order). Default: static,openai */
  readonly VITE_VOICE_PRIORITY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
