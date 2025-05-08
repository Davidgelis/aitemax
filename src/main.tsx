
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { TemplateManagementProvider } from './hooks/useTemplateManagement'

createRoot(document.getElementById("root")!).render(
  <TemplateManagementProvider>
    <App />
  </TemplateManagementProvider>
);
