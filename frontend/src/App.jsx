import React, { useEffect, useState } from 'react';
import ChatInterface from './components/ChatInterface';
import { getUserId } from './utils/cookies';

export const App = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // 初始化用戶 ID
    const id = getUserId();
    setUserId(id);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {userId && <ChatInterface userId={userId} />}
    </div>
  );
};

export default App; 