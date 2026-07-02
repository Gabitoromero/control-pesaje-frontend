import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './features/auth/context/AuthContext'
import { DialogProvider } from './components/dialogs/DialogProvider'
import { Toaster } from './components/ui/sonner'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DialogProvider>
          <App />
          <Toaster richColors />
        </DialogProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
