import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './assets/index.css';
import Router from "./Router";
import { Web3Provider } from './components/web3'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Web3Provider>
      <Router />
    </Web3Provider>
  </StrictMode>,
)
