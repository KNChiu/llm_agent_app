# utils/security_middleware.py
import time
from collections import defaultdict
from fastapi import Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

# 簡單的內存速率限制器（生產環境建議使用 Redis）
class InMemoryRateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
        self.max_requests = 100  # 每分鐘最大請求數
        self.window = 60  # 時間窗口（秒）
    
    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        # 清理過期的請求記錄
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip] 
            if now - req_time < self.window
        ]
        
        # 檢查是否超過限制
        if len(self.requests[client_ip]) >= self.max_requests:
            return False
        
        # 記錄當前請求
        self.requests[client_ip].append(now)
        return True

# 全局速率限制器實例
rate_limiter = InMemoryRateLimiter()

async def rate_limit_middleware(request: Request, call_next):
    """速率限制中間件"""
    client_ip = request.client.host
    
    # 排除健康檢查端點
    if request.url.path in ["/health", "/docs", "/openapi.json"]:
        response = await call_next(request)
        return response
    
    if not rate_limiter.is_allowed(client_ip):
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        return JSONResponse(
            status_code=429,
            content={"detail": "請求頻率過高，請稍後再試"}
        )
    
    response = await call_next(request)
    return response

async def security_headers_middleware(request: Request, call_next):
    """添加安全頭部的中間件"""
    response = await call_next(request)
    
    # 添加安全頭部
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    
    return response

def validate_request_size(max_size: int = 10 * 1024 * 1024):  # 10MB 默認
    """請求大小限制裝飾器"""
    async def middleware(request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > max_size:
            return JSONResponse(
                status_code=413,
                content={"detail": f"請求體過大，最大允許 {max_size // (1024*1024)}MB"}
            )
        
        response = await call_next(request)
        return response
    
    return middleware

async def request_logging_middleware(request: Request, call_next):
    """請求日誌中間件"""
    start_time = time.time()
    client_ip = request.client.host
    method = request.method
    url = str(request.url)
    
    logger.info(f"Request started: {method} {url} from {client_ip}")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(
            f"Request completed: {method} {url} - "
            f"Status: {response.status_code} - "
            f"Time: {process_time:.3f}s"
        )
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"Request failed: {method} {url} - "
            f"Error: {str(e)} - "
            f"Time: {process_time:.3f}s"
        )
        raise