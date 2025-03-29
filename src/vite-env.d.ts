
/// <reference types="vite/client" />

import { TemplateType } from "./components/x-templates/XTemplateCard";

declare global {
  interface Window {
    __selectedTemplate: TemplateType;
  }
}
