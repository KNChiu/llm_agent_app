import { v4 as uuidv4 } from 'uuid';

/**
 * 設置 cookie
 * @param {string} name cookie 名稱
 * @param {string} value cookie 值
 * @param {number} days cookie 過期天數
 */
export const setCookie = (name, value, days = 365) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
};

/**
 * 獲取 cookie 值
 * @param {string} name cookie 名稱
 * @returns {string|null} cookie 值，不存在時返回 null
 */
export const getCookie = (name) => {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  return null;
};

/**
 * 檢查 cookie 是否存在
 * @param {string} name cookie 名稱
 * @returns {boolean} cookie 是否存在
 */
export const checkCookie = (name) => {
  return getCookie(name) !== null;
};

/**
 * 獲取或創建使用者 ID
 * @returns {string} 使用者 ID
 */
export const getUserId = () => {
  const cookieName = 'user_id';
  let userId = getCookie(cookieName);
  
  if (!userId) {
    userId = uuidv4();
    setCookie(cookieName, userId);
  }
  
  return userId;
}; 