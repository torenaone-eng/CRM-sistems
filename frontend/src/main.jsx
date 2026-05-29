import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Polyfill storage for development (without Claude's storage API)
if (!window.storage) {
  const prefix = 'crm-storage:'
  window.storage = {
    get: async (key) => {
      const value = localStorage.getItem(prefix + key)
      return value === null ? null : { key, value }
    },
    set: async (key, value) => {
      if (value === null || value === undefined) localStorage.removeItem(prefix + key)
      else localStorage.setItem(prefix + key, value)
      return { key, value }
    },
    delete: async (key) => { localStorage.removeItem(prefix + key); return { key, deleted: true } },
    list: async (keyPrefix) => ({
      keys: Object.keys(localStorage)
        .filter(k => k.startsWith(prefix))
        .map(k => k.slice(prefix.length))
        .filter(k => !keyPrefix || k.startsWith(keyPrefix)),
    }),
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
