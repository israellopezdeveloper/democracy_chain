import { useAccount } from 'wagmi';
import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Modal } from './Modal';

export function ConnectedRoute() {
  const { isConnected } = useAccount();
  const [showNoWalletModal, setShowNoWalletModal] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setShowNoWalletModal(true);
    }
  }, [isConnected]);

  if (isConnected) {
    return <Outlet />;
  }

  return showNoWalletModal ? (
    <Modal
      title="🔐 Wallet no conectada"
      message="Serás redirigido al Home..."
      onClose={() => setShowNoWalletModal(false)}
      redirectTo="/"
      autoCloseDelay={4000} />
  ) : null;
}
