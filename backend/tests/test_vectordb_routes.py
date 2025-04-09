import os
import uuid
import json
import shutil
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import status

# 導入應用程式
from main import app

client = TestClient(app)

# 測試用的固定 UUID
TEST_SESSION_ID = "12345678-1234-5678-1234-567812345678"
TEST_DB_PATH = f"./data/chromadb_data/{TEST_SESSION_ID}"

@pytest.fixture
def mock_chromadb_connector():
    """模擬 ChromaDBConnecter 的實例"""
    with patch("routes.vectordb_routes.ChromaDBConnecter") as mock_class:
        # 設置返回的 mock 對象
        mock_instance = MagicMock()
        mock_class.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def cleanup_test_data():
    """測試前後清理測試數據"""
    # 測試前確保測試目錄不存在
    if os.path.exists(TEST_DB_PATH):
        shutil.rmtree(TEST_DB_PATH)
    
    yield
    
    # 測試後清理
    if os.path.exists(TEST_DB_PATH):
        shutil.rmtree(TEST_DB_PATH)

class TestVectorDBRoutes:
    def test_deterministic_uuid(self):
        """測試 deterministic_uuid 函數"""
        from routes.vectordb_routes import deterministic_uuid
        
        # 相同輸入應產生相同的 UUID
        uuid1 = deterministic_uuid("test_content")
        uuid2 = deterministic_uuid("test_content")
        assert uuid1 == uuid2
        
        # 不同輸入應產生不同的 UUID
        uuid3 = deterministic_uuid("different_content")
        assert uuid1 != uuid3
        
        # 測試位元組輸入
        uuid4 = deterministic_uuid(b"test_content")
        assert uuid4 == uuid1
        
        # 測試無效輸入類型
        with pytest.raises(ValueError):
            deterministic_uuid(123)

    def test_init_vectordb_success(self, mock_chromadb_connector, cleanup_test_data):
        """測試成功初始化向量資料庫"""
        mock_chromadb_connector.create_collection.return_value = MagicMock()
    
        response = client.post(f"/vectordb/init?session_id={TEST_SESSION_ID}")
    
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "success"
        assert TEST_DB_PATH in response.json()["message"]
        
        # 驗證模擬呼叫
        mock_chromadb_connector.create_collection.assert_called_once_with(name="documents")

    def test_init_vectordb_failure(self, mock_chromadb_connector):
        """測試初始化向量資料庫失敗的情況"""
        # 設置模擬拋出異常
        mock_chromadb_connector.create_collection.side_effect = Exception("Test error")
        
        response = client.post(f"/vectordb/init?session_id={TEST_SESSION_ID}")
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Failed to initialize vector database" in response.json()["detail"]

    def test_add_documents_success(self, mock_chromadb_connector, cleanup_test_data):
        """測試成功添加文件到向量資料庫"""
        mock_chromadb_connector.add_document_with_chunking.return_value = None  # 假設無回傳
        
        payload = {
            "session_id": TEST_SESSION_ID,
            "document": "This is a test document.",
            "chunk_size": 500,
            "chunk_overlap": 100,
            "type": "txt"
        }

        response = client.post("/vectordb/add", params=payload)

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "success"
        assert "Add documents to VectorDB" in response.json()["message"]

        # 驗證呼叫參數是否正確
        mock_chromadb_connector.add_document_with_chunking.assert_called_once()
        args, kwargs = mock_chromadb_connector.add_document_with_chunking.call_args
        assert kwargs["chunk_size"] == 500
        assert kwargs["chunk_overlap"] == 100
        assert kwargs["metadata"]["type"] == "txt"

    def test_add_documents_empty_document(self):
        """測試 document 為空字串的情況"""
        payload = {
            "session_id": TEST_SESSION_ID,
            "document": "",  # 空字串
        }

        response = client.post("/vectordb/add", params=payload)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["detail"] == "Document cannot be empty"

    def test_add_documents_failure(self, mock_chromadb_connector):
        """測試添加文檔失敗（模擬內部錯誤）"""
        mock_chromadb_connector.add_document_with_chunking.side_effect = Exception("Mock insert error")

        payload = {
            "session_id": TEST_SESSION_ID,
            "document": "This is a test document.",
        }

        response = client.post("/vectordb/add", params=payload)

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Failed to add document to vector database" in response.json()["detail"]

    def test_retrieve_documents_success(self, mock_chromadb_connector, cleanup_test_data):
        """測試成功檢索文檔"""
        mock_chromadb_connector.retrieve_similar_documents.return_value = [
            {"id": "doc1", "content": "similar content 1"},
            {"id": "doc2", "content": "similar content 2"}
        ]

        payload = {
            "session_id": TEST_SESSION_ID,
            "query": "test query",
            "n_results": 2
        }

        # 預先建立測試資料夾，模擬存在的資料庫
        os.makedirs(TEST_DB_PATH, exist_ok=True)

        response = client.get("/vectordb/retrieve", params=payload)

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "success"
        assert response.json()["count"] == 2
        assert len(response.json()["results"]) == 2
        assert mock_chromadb_connector.retrieve_similar_documents.called

    def test_retrieve_documents_not_found(self):
        """測試資料庫不存在時的情況"""
        payload = {
            "session_id": TEST_SESSION_ID,
            "query": "test query"
        }

        # 確保資料夾不存在
        if os.path.exists(TEST_DB_PATH):
            shutil.rmtree(TEST_DB_PATH)

        response = client.get("/vectordb/retrieve", params=payload)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert f"VectorDB not found for session: {TEST_SESSION_ID}" in response.json()["detail"]

    def test_retrieve_documents_failure(self, mock_chromadb_connector):
        """測試檢索文檔發生例外"""
        os.makedirs(TEST_DB_PATH, exist_ok=True)
        mock_chromadb_connector.retrieve_similar_documents.side_effect = Exception("Mock retrieval error")

        payload = {
            "session_id": TEST_SESSION_ID,
            "query": "test query"
        }

        response = client.get("/vectordb/retrieve", params=payload)

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Failed to retrieve documents" in response.json()["detail"]

    def test_delete_collection_success(self, cleanup_test_data):
        """測試成功刪除向量資料庫"""
        os.makedirs(TEST_DB_PATH, exist_ok=True)

        response = client.delete(f"/vectordb/delete?session_id={TEST_SESSION_ID}")

        assert response.status_code == status.HTTP_200_OK
        assert "Deleted VectorDB for session" in response.json()["message"]
        assert not os.path.exists(TEST_DB_PATH)

    def test_delete_collection_not_found(self):
        """測試刪除不存在的資料庫"""
        if os.path.exists(TEST_DB_PATH):
            shutil.rmtree(TEST_DB_PATH)

        response = client.delete(f"/vectordb/delete?session_id={TEST_SESSION_ID}")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert f"VectorDB not found for session: {TEST_SESSION_ID}" in response.json()["detail"]

    def test_delete_collection_failure(self, cleanup_test_data):
        """測試刪除過程中發生錯誤"""
        os.makedirs(TEST_DB_PATH, exist_ok=True)

        # 模擬刪除時拋出異常
        with patch("routes.vectordb_routes.shutil.rmtree", side_effect=Exception("Mock delete error")):
            response = client.delete(f"/vectordb/delete?session_id={TEST_SESSION_ID}")

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Failed to delete vector database" in response.json()["detail"]