# utils/database_optimizations.py - 數據庫查詢優化工具
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from models import Chat
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class ChatQueryOptimizer:
    """聊天記錄查詢優化器"""
    
    @staticmethod
    def get_paginated_history(
        db: Session,
        user_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        優化的分頁歷史查詢
        使用複合索引和查詢優化技術
        """
        try:
            # 構建基礎查詢
            query = db.query(Chat)
            
            # 添加過濾條件
            filters = []
            if user_id:
                filters.append(Chat.user_id == user_id)
            if session_id:
                filters.append(Chat.session_id == session_id)
            
            if filters:
                query = query.filter(and_(*filters))
            
            # 使用索引優化的排序
            query = query.order_by(desc(Chat.timestamp))
            
            # 計算總數（只在需要時計算）
            total_query = query.with_entities(func.count(Chat.turn_id))
            total = total_query.scalar()
            
            # 執行分頁查詢
            items = query.offset(skip).limit(limit).all()
            
            # 計算是否有下一頁
            has_more = skip + limit < total
            
            logger.info(f"Query executed: user_id={user_id}, skip={skip}, limit={limit}, total={total}")
            
            return {
                "items": items,
                "total": total,
                "page": skip // limit,
                "limit": limit,
                "has_more": has_more
            }
            
        except Exception as e:
            logger.error(f"Error in paginated history query: {e}")
            raise

    @staticmethod
    def get_session_history(
        db: Session,
        session_id: str,
        user_id: Optional[str] = None
    ) -> List[Chat]:
        """
        優化的會話歷史查詢
        使用會話索引
        """
        try:
            query = db.query(Chat).filter(Chat.session_id == session_id)
            
            if user_id:
                query = query.filter(Chat.user_id == user_id)
            
            # 使用索引優化的排序
            items = query.order_by(Chat.timestamp).all()
            
            logger.info(f"Session history query executed: session_id={session_id}, user_id={user_id}, count={len(items)}")
            
            return items
            
        except Exception as e:
            logger.error(f"Error in session history query: {e}")
            raise

    @staticmethod
    def get_recent_conversations(
        db: Session,
        user_id: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        獲取最近的對話列表
        優化的查詢，只獲取每個會話的最新消息
        """
        try:
            # 使用子查詢獲取每個會話的最新時間戳
            subquery = db.query(
                Chat.session_id,
                func.max(Chat.timestamp).label('latest_timestamp')
            )
            
            if user_id:
                subquery = subquery.filter(Chat.user_id == user_id)
            
            subquery = subquery.group_by(Chat.session_id).subquery()
            
            # 主查詢獲取最新消息的詳細信息
            query = db.query(Chat).join(
                subquery,
                and_(
                    Chat.session_id == subquery.c.session_id,
                    Chat.timestamp == subquery.c.latest_timestamp
                )
            ).order_by(desc(Chat.timestamp)).limit(limit)
            
            items = query.all()
            
            logger.info(f"Recent conversations query executed: user_id={user_id}, limit={limit}, count={len(items)}")
            
            return items
            
        except Exception as e:
            logger.error(f"Error in recent conversations query: {e}")
            raise

    @staticmethod
    def search_messages(
        db: Session,
        search_term: str,
        user_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Chat]:
        """
        優化的消息搜索
        使用文本搜索和索引
        """
        try:
            query = db.query(Chat)
            
            # 添加文本搜索條件
            search_filter = or_(
                Chat.user_message.ilike(f'%{search_term}%'),
                Chat.assistant_message.ilike(f'%{search_term}%')
            )
            query = query.filter(search_filter)
            
            if user_id:
                query = query.filter(Chat.user_id == user_id)
            
            # 按相關性排序（最新的優先）
            items = query.order_by(desc(Chat.timestamp)).limit(limit).all()
            
            logger.info(f"Message search executed: term='{search_term}', user_id={user_id}, count={len(items)}")
            
            return items
            
        except Exception as e:
            logger.error(f"Error in message search: {e}")
            raise

    @staticmethod
    def get_user_statistics(
        db: Session,
        user_id: str
    ) -> Dict[str, Any]:
        """
        獲取用戶統計信息
        使用聚合查詢和索引優化
        """
        try:
            # 消息總數
            total_messages = db.query(func.count(Chat.turn_id)).filter(Chat.user_id == user_id).scalar()
            
            # 會話總數
            total_sessions = db.query(func.count(func.distinct(Chat.session_id))).filter(Chat.user_id == user_id).scalar()
            
            # 最近活動時間
            latest_activity = db.query(func.max(Chat.timestamp)).filter(Chat.user_id == user_id).scalar()
            
            # 今日消息數
            from datetime import datetime
            today = datetime.now().date()
            today_messages = db.query(func.count(Chat.turn_id)).filter(
                and_(
                    Chat.user_id == user_id,
                    func.date(Chat.timestamp) == today
                )
            ).scalar()
            
            stats = {
                "total_messages": total_messages,
                "total_sessions": total_sessions,
                "latest_activity": latest_activity,
                "today_messages": today_messages
            }
            
            logger.info(f"User statistics calculated: user_id={user_id}, stats={stats}")
            
            return stats
            
        except Exception as e:
            logger.error(f"Error calculating user statistics: {e}")
            raise