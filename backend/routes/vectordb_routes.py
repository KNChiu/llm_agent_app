import os
import uuid
import shutil
import hashlib
from typing import List, Optional, Dict, Any, Union
from fastapi import APIRouter, Query, HTTPException, status, Body
from utils.vectordb.chromadb_connecter import ChromaDBConnecter
from utils.backend_logger import BackendLogger

router = APIRouter()
backend_logger = BackendLogger().logger

def deterministic_uuid(content: Union[str, bytes]) -> str:
    """Creates deterministic UUID on hash value of string or byte content.

    Args:
        content: String or byte representation of data.

    Returns:
        UUID of the content.
    """
    if isinstance(content, str):
        content_bytes = content.encode("utf-8")
    elif isinstance(content, bytes):
        content_bytes = content
    else:
        raise ValueError(f"Content type {type(content)} not supported !")

    hash_object = hashlib.sha256(content_bytes)
    hash_hex = hash_object.hexdigest()
    namespace = uuid.UUID("00000000-0000-0000-0000-000000000000")
    content_uuid = str(uuid.uuid5(namespace, hash_hex))

    return content_uuid

def get_db_path(session_id: uuid.UUID) -> str:
    """獲取向量數據庫路徑並確保目錄存在

    Args:
        session_id: 會話ID

    Returns:
        數據庫路徑
    """
    path = f"./data/chromadb_data/{session_id}"
    if not os.path.exists(path):
        os.makedirs(path)
    return path

@router.post("/init")
async def init_vectordb(session_id: uuid.UUID):
    """
    初始化向量數據庫
    """
    try:
        path = get_db_path(session_id)
        connecter = ChromaDBConnecter(path)
        collection_name = "documents"
        connecter.create_collection(name=collection_name)

        backend_logger.info(f"Init VectorDB for session: {session_id}")
        
        return {"status": "success", "message": f"Init VectorDB at {path}"}

    except Exception as e:
        backend_logger.error(f"Error initializing VectorDB: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize vector database: {str(e)}"
        )
    
@router.post("/add")
async def add_documents(
    session_id: uuid.UUID,
    document: str = Body(...), 
    document_id: Optional[str] = Body(None),
    chunk_size: int = Body(1000), 
    chunk_overlap: int = Body(200),
    type: str = Body("txt")
):
    """
    添加數據到向量數據庫
    """
    if not document:
        backend_logger.warning(f"Document cannot be empty for session: {session_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document cannot be empty for session: {session_id}"
        )
        
    try:
        path = get_db_path(session_id)
        connecter = ChromaDBConnecter(path)
        collection_name = "documents"

        document_id = document_id or deterministic_uuid(document[:10])

        connecter.add_document_with_chunking(collection_name, document, document_id,
                                            chunk_size=chunk_size, chunk_overlap=chunk_overlap,
                                            metadata={"source": "API", "type": type})
        
        backend_logger.info(f"Add documents to VectorDB | session: {session_id} | document_id: {document_id} | chunk_size: {chunk_size} | chunk_overlap: {chunk_overlap}")
        
        return {"status": "success", "message": f"Add documents to VectorDB | session: {session_id} | document_id: {document_id} | chunk_size: {chunk_size} | chunk_overlap: {chunk_overlap}"}

    except Exception as e:
        backend_logger.error(f"Failed to add document to VectorDB: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add document to VectorDB: {str(e)}"
        )

@router.get("/retrieve")
async def retrieve_documents(
    session_id: uuid.UUID,
    query: str = Query(..., description="查詢文本"),
    n_results: int = Query(5, description="返回的最大文檔數")
):
    """
    從向量數據庫檢索與查詢相似的文檔
    """
    if not query:
        backend_logger.warning(f"Query text cannot be empty for session: {session_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Query text cannot be empty for session: {session_id}"
        )
    path = f"./data/chromadb_data/{session_id}"
    if not os.path.exists(path):
        backend_logger.warning(f"VectorDB not found for session: {session_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"VectorDB not found for session: {session_id}"
        )
    try:            
        connecter = ChromaDBConnecter(path)
        collection_name = "documents"
        
        results = connecter.retrieve_similar_documents(
            collection_name=collection_name,
            query=query,
            n_results=n_results
        )
        
        backend_logger.info(f"Retrieved documents from VectorDB | session: {session_id} | query: {query[:50]}")
        
        return {
            "status": "success",
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        backend_logger.error(f"Failed to retrieve documents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve documents: {str(e)}"
        )
    
@router.delete("/delete")
async def delete_collection(session_id: uuid.UUID):
    """
    刪除向量數據庫
    """
    path = f"./data/chromadb_data/{session_id}"
    if not os.path.exists(path):
        backend_logger.warning(f"VectorDB not found for session: {session_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"VectorDB not found for session: {session_id}"
        )
    try:
        
        shutil.rmtree(path)
        
        backend_logger.info(f"Deleted VectorDB | session: {session_id}")
        
        return {"status": "success", "message": f"Deleted VectorDB for session: {session_id}"}
    
    except Exception as e:
        backend_logger.error(f"Failed to delete vector database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete vector database: {str(e)}"
        )
