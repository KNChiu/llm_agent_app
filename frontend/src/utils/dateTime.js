export const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  const taiwanDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  
  return taiwanDate.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}; 