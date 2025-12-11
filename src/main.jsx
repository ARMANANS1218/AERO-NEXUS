import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { Provider } from 'react-redux';
import { store } from './apps/store.js';
import { NotificationSoundProvider } from './context/NotificationSoundContext.jsx';

import AOS from 'aos';
import 'aos/dist/aos.css';

// Initialize AOS once at app startup
AOS.init({
  duration: 700,
  easing: 'ease-out',
  once: true,
  mirror: false,
});

createRoot(document.getElementById('root')).render(
  // StrictMode commented out due to WebRTC compatibility issues
  // StrictMode causes double-rendering in dev which conflicts with WebRTC connection setup
  // <StrictMode>
    <Provider store={store}>
      <NotificationSoundProvider>
        <App />
      </NotificationSoundProvider>
    </Provider>
  // </StrictMode>,
);
