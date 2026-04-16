import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/AuthContext.jsx'

// EMERGENCY DEBUGGING: Catch global errors
window.onerror = function (msg, url, lineNo, columnNo, error) {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = `
            <div style="padding: 40px; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; font-family: sans-serif; border-radius: 12px; margin: 20px;">
                <h1 style="margin-top:0">Wait, something went wrong!</h1>
                <p><strong>Error:</strong> ${msg}</p>
                <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 12px; word-break: break-all;">
                    ${error?.stack || 'No stack trace'}
                </div>
                <p style="font-size: 14px; opacity: 0.8;">Possible causes: DOM conflicts from browser extensions (like Google Translate or Dashlane) or a race condition in the UI transition.</p>
                <button onclick="location.reload()" style="padding: 12px 24px; background: #721c24; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Reload Page</button>
            </div>
        `;
    }
    return false;
};

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    </React.StrictMode>,
)
