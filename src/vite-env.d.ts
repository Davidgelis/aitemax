
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Add proper typing for the window.__selectedTemplate
interface Window {
  __selectedTemplate?: {
    id: string;
    name: string;
    role: string;
    pillars: Array<{
      id: string;
      title: string;
      description: string;
    }>;
    temperature: number;
    characterLimit?: number;
    isDefault?: boolean;
    createdAt: string;
  };
}
