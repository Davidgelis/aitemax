
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  __selectedTemplate?: any;
}

// Add PillarType definition for global access
interface PillarType {
  id: string;
  title: string;
  description: string;
}
