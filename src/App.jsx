import React, { useEffect, useMemo, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MainRoutes from "./routes/MainRoutes";
import { CssBaseline, ThemeProvider } from "@mui/material";
import AppTheme from "./theme/AppTheme";
import { connectSocket } from "./hooks/socket";

import ColorModeContext from './context/ColorModeContext';
import { SuperAdminProvider } from './context/SuperAdminContext';

const App = () => {
  // Initialize theme from localStorage immediately
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved && (saved === 'dark' || saved === 'light')) {
        // Also set the class immediately to avoid flash
        if (saved === 'dark') {
          document.documentElement.classList.add('dark');
        }
        return saved;
      }
    } catch {
      // ignore in non-browser envs
    }
    return "light";
  });

  // Memoized toggle function
  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prev) => (prev === "light" ? "dark" : "light"));
      },
    }),
    [mode]
  );

  const theme = useMemo(() => AppTheme(mode), [mode]);

  useEffect(() => {
    // Initialize socket on app mount (no params here; individual login will re-init with token/id)
    connectSocket();
  }, []);

  // Sync HTML data-theme attribute for global CSS theming
  useEffect(() => {
    try {
      // Temporarily disable transitions for instant theme change
      document.documentElement.classList.add('theme-transitioning');

      // write both data-theme and class-based dark mode for Tailwind
      document.documentElement.setAttribute('data-theme', mode);
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Force immediate repaint
      document.documentElement.offsetHeight;

      // Re-enable transitions after theme change completes
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove('theme-transitioning');
        });
      });

      // persist preference
      localStorage.setItem('theme', mode);
    } catch {
      // ignore in non-browser envs
    }
  }, [mode]);

  return (
    <SuperAdminProvider>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToastContainer
            position="bottom-right"
            autoClose={3500}
            hideProgressBar={false}
            newestOnTop={false}
            stacked
            limit={6}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={mode === 'dark' ? 'dark' : 'light'}
          />
          <MainRoutes />
        </ThemeProvider>
      </ColorModeContext.Provider>
    </SuperAdminProvider>
  );
};

export default App;
