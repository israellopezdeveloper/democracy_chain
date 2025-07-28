import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './assets/index.css';
import Router from "./Router";
import { Web3Provider } from './components/web3'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Web3Provider>
      <Router />
      <ToastContainer position="bottom-right" autoClose={3000} />
    </Web3Provider>
  </StrictMode>,
)
