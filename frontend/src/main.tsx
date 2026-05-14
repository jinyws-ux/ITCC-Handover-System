import React from 'react'
import ReactDOM from 'react-dom/client'
import StableApp from './StableApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StableApp />
  </React.StrictMode>
)
