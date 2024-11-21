import { useState, useEffect } from 'react';
import { chatService } from '../../../services/api';

export const useBackendStatus = () => {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        await chatService.checkHealth();
        setBackendStatus('online');
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return backendStatus;
}; 