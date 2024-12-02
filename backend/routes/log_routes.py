import os
import logging

from datetime import datetime
from fastapi import APIRouter, HTTPException

from utils.logging import setup_logging


setup_logging()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
async def get_logs(
    lines: int = 100,
    start_date: str = None,
    end_date: str = None,
    keyword: str = None
):
    """
    獲取最新的日誌記錄，並按對話分組
    
    - **lines**: 要返回的日誌行數
    - **start_date**: 開始日期 (YYYY-MM-DD)
    - **end_date**: 結束日期 (YYYY-MM-DD)
    - **keyword**: 搜尋關鍵字
    - 返回: 按對話分組的日誌記錄
    """
    try:
        if not os.path.exists('app.log'):
            return {"conversations": [], "total_conversations": 0}
            
        # 只在有提供日期時才解析日期
        start_datetime = None
        end_datetime = None
        if start_date and start_date.strip():  # 檢查是否為空字符串
            try:
                start_datetime = datetime.strptime(start_date, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                logger.warning(f"無效的開始日期格式: {start_date}")
                
        if end_date and end_date.strip():  # 檢查是否為空字符串
            try:
                end_datetime = datetime.strptime(end_date, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                logger.warning(f"無效的結束日期格式: {end_date}")
            
        # 清理關鍵字
        keyword = keyword.strip() if keyword else None
            
        with open('app.log', 'r', encoding='utf-8') as file:
            logs = file.readlines()[-lines:]
            
        conversations = []
        current_conversation = []
        should_include_conversation = False
        
        for log in logs:
            try:
                log_datetime = datetime.strptime(log.split(" - ")[0], "%Y-%m-%d %H:%M:%S,%f")
                
                # 日期和關鍵字檢查
                passes_date_filter = (
                    (not start_datetime or log_datetime >= start_datetime) and
                    (not end_datetime or log_datetime <= end_datetime)
                )
                
                passes_keyword_filter = not keyword or keyword.lower() in log.lower()
                
                # 解析日誌行
                if "User:" in log:
                    # 如果有前一個對話且需要被包含，則加入結果中
                    if current_conversation and should_include_conversation:
                        conversations.append(current_conversation)
                    # 重置對話和過濾標記
                    current_conversation = [log.strip()]
                    should_include_conversation = passes_date_filter and passes_keyword_filter
                elif any(marker in log for marker in ["Params:", "Context:", "Assistant:", "Chat error:"]):
                    if current_conversation:
                        current_conversation.append(log.strip())
                        # 更新過濾標記
                        should_include_conversation = should_include_conversation or (passes_date_filter and passes_keyword_filter)
            except ValueError as e:
                logger.error(f"解析日誌時間出錯: {str(e)}")
                continue
        
        # 處理最後一個對話
        if current_conversation and should_include_conversation:
            conversations.append(current_conversation)
            
        # 只返回實際使用的過濾條件
        active_filters = {}
        if start_datetime:
            active_filters["start_date"] = start_date
        if end_datetime:
            active_filters["end_date"] = end_date
        if keyword:
            active_filters["keyword"] = keyword
            
        return {
            "conversations": conversations,
            "total_conversations": len(conversations),
            "active_filters": active_filters  # 只返回實際使用的過濾條件
        }
        
    except Exception as e:
        logger.error(f"讀取日誌出錯: {str(e)}")
        raise HTTPException(status_code=500, detail="無法讀取日誌文件")
