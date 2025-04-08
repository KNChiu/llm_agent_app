import os
import uuid
from fastapi import APIRouter
from utils.vectordb.chromadb_connecter import ChromaDBConnecter

router = APIRouter()

@router.post("/init")
async def init_vector_db(session_id: uuid.UUID):
    """
    初始化向量數據庫
    """
    try:
        path = f"./data/chromadb_data/{session_id}"
        if not os.path.exists(path):
            os.makedirs(path)

        connecter = ChromaDBConnecter(path)
        collection_name = "documents"
        connecter.create_collection(name=collection_name)
        
        return {"status": "success", "message": f"Vector DB initialized at {path}"}

    except Exception as e:
        return {"status": "error", "message": str(e)}