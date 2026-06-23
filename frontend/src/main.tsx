import { StrictMode, useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { useThemeStore } from './stores/themeStore';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return <>{children}</>;
}

function AppShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeInitializer>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'dark:bg-slate-800 dark:text-white',
              duration: 4000,
            }}
          />
        </ThemeInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

const container = document.getElementById('root')!;
type RootElement = HTMLElement & { __reactRoot?: Root };

function renderApp() {
  const rootEl = container as RootElement;
  if (!rootEl.__reactRoot) {
    rootEl.__reactRoot = createRoot(container);
  }
  rootEl.__reactRoot.render(
    <StrictMode>
      <AppShell />
    </StrictMode>
  );
}

renderApp();

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    renderApp();
  });
}
