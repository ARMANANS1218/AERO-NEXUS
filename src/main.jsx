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
 
  <Provider store={store}>
    <NotificationSoundProvider>
      <App />
    </NotificationSoundProvider>
  </Provider>
  // </StrictMode>,
);
