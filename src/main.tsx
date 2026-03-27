import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initTheme } from './store/themeStore'
import './i18n'
import './index.css'

// Unregister all service workers — avoid stale caches during development and post-deploy.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister())
  })
  // Also clear any workbox/precache caches.
  caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
}

// Show any uncaught runtime errors directly in the page instead of a blank screen.
window.addEventListener('error', (e) => {
  document.body.innerHTML = `<div style="font-family:monospace;padding:24px;color:#dc2626;background:#fef2f2;min-height:100vh"><h2 style="margin:0 0 8px">Runtime error</h2><pre style="white-space:pre-wrap">${e.message}\n${e.filename}:${e.lineno}\n\n${e.error?.stack ?? ''}</pre></div>`
})
window.addEventListener('unhandledrejection', (e) => {
  document.body.innerHTML = `<div style="font-family:monospace;padding:24px;color:#dc2626;background:#fef2f2;min-height:100vh"><h2 style="margin:0 0 8px">Unhandled promise rejection</h2><pre style="white-space:pre-wrap">${String(e.reason?.stack ?? e.reason)}</pre></div>`
})

// Applique le thème avant le premier rendu pour éviter le flash
try { initTheme() } catch {}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
