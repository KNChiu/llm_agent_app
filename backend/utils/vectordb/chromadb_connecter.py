import chromadb
from chromadb.utils import embedding_functions
from typing import List, Optional, Dict, Any, Union, Tuple
import uuid
import re


class ChromaDBConnecter:
    def __init__(self, path: Optional[str] = None, embedding_model_name: str = "default") -> None:
        """
        初始化 ChromaDBConnecter。

        Args:
            path (Optional[str]): 資料庫持久化儲存的路徑。如果為 None，則使用記憶體客戶端。
                                   預設為 None。
            embedding_model_name (str): 要使用的嵌入模型的名稱（主要用於記錄目的，實際模型在內部設定）。
                                        預設為 "default"。

        Raises:
            Exception: 如果在初始化 ChromaDB 客戶端或嵌入函數時發生錯誤。
        """
        try:
            self.embedding_function = embedding_functions.DefaultEmbeddingFunction()
            # self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(api_key="YOUR_API_KEY", model_name="text-embedding-ada-002")

            if path:
                print(f"Initializing persistent ChromaDB client at: {path}")
                self.client = chromadb.PersistentClient(path=path)
            else:
                print("Initializing in-memory ChromaDB client.")
                self.client = chromadb.Client()

            print(f"Using embedding model: {embedding_model_name}")

        except Exception as e:
            print(f"Error occurred while initializing ChromaDBConnecter: {e}")
            raise

    def create_collection(self, name: str, metadata: Optional[Dict[str, Any]] = None) -> Optional[chromadb.Collection]:
        """
        創建或取得一個指定名稱的 ChromaDB 集合。

        如果具有相同名稱的集合已存在，則返回現有集合。

        Args:
            name (str): 要創建或取得的集合的名稱。
            metadata (Optional[Dict[str, Any]]): 要與集合關聯的元數據。預設為 None。

        Returns:
            Optional[chromadb.Collection]: 成功時返回 Collection 物件，失敗時返回 None。
        """
        try:
            print(f"Attempting to create or retrieve collection: {name}")
            collection = self.client.get_or_create_collection(
                name=name,
                embedding_function=self.embedding_function,
                metadata=metadata
            )
            print(f"Successfully retrieved or created collection: {name}")
            return collection
        except Exception as e:
            print(f"Error occurred while creating or retrieving collection '{name}': {e}")
            return None

    def add_documents(self, collection_name: str, ids: List[str], documents: List[str], metadatas: Optional[List[Dict[str, Any]]] = None) -> bool:
        """
        將多個文件（及其元數據）添加到指定的集合中。

        Args:
            collection_name (str): 目標集合的名稱。
            ids (List[str]): 每個文件的唯一 ID 列表。
            documents (List[str]): 要添加的文件內容列表。
            metadatas (Optional[List[Dict[str, Any]]]): 與每個文件對應的元數據列表。預設為 None。

        Returns:
            bool: 如果文件成功添加則返回 True，否則返回 False。
        """
        try:
            collection = self.client.get_collection(name=collection_name, embedding_function=self.embedding_function)
            print(f"Adding {len(ids)} documents to collection '{collection_name}'...")
            collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            print("Documents added successfully.")
            return True
        except Exception as e:
            print(f"Error occurred while adding documents to collection '{collection_name}': {e}")
            return False

    def get_documents(self, collection_name: str, ids: Optional[List[str]] = None, where: Optional[Dict[str, Any]] = None, where_document: Optional[Dict[str, Any]] = None, limit: Optional[int] = 5, offset: Optional[int] = None, include: List[str] = ['metadatas', 'documents']) -> Optional[Dict[str, Any]]:
        """
        從指定集合中檢索文件。

        可以通過 ID、元數據過濾條件 (`where`) 或文件內容過濾條件 (`where_document`) 來檢索。

        Args:
            collection_name (str): 目標集合的名稱。
            ids (Optional[List[str]]): 要檢索的文件的 ID 列表。預設為 None。
            where (Optional[Dict[str, Any]): 基於元數據的過濾條件。預設為 None。
            where_document (Optional[Dict[str, Any]]): 基於文件內容的過濾條件。預設為 None。
            limit (Optional[int]): 返回的最大文件數量。預設為 5。
            offset (Optional[int]): 返回結果的起始偏移量。預設為 None。
            include (List[str]): 指定返回結果中包含哪些資訊（例如 'metadatas', 'documents', 'embeddings'）。
                                 預設為 ['metadatas', 'documents']。

        Returns:
            Optional[Dict[str, Any]]: 包含檢索結果的字典 (符合 ChromaDB `get` 方法的格式)，
                                      如果發生錯誤則返回 None。
        """
        try:
            collection = self.client.get_collection(name=collection_name, embedding_function=self.embedding_function)
            print(f"Reading documents from collection '{collection_name}'...")
            results = collection.get(
                ids=ids,
                where=where,
                where_document=where_document,
                limit=limit,
                offset=offset,
                include=include
            )
            print("Documents retrieved successfully.")
            return results
        except Exception as e:
            print(f"Error occurred while reading documents from collection '{collection_name}': {e}")
            return None

    def add_document_with_chunking(self, collection_name: str, document: str, document_id: str = None,
                                  chunk_size: int = 1000, chunk_overlap: int = 200,
                                  metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        將單個文件進行分塊處理，然後將這些塊作為獨立的條目添加到指定的 ChromaDB 集合中。

        此方法首先使用提供的參數將輸入的文本文檔分割成多個可能重疊的塊。
        接著，為每個塊生成一個唯一的 ID，並創建包含原始元數據以及塊特定信息
        （例如塊索引、總塊數）的元數據字典。最後，調用 `add_documents` 方法
        將所有塊及其對應的 ID 和元數據批量添加到目標集合。

        Args:
            collection_name (str): 要添加文件塊的目標 ChromaDB 集合的名稱。
            document (str): 需要被分割和添加的原始文本文檔內容。
            document_id (str, optional): 整個原始文件的基礎唯一標識符。
                                         如果提供，塊的 ID 將基於此 ID 生成。
                                         如果為 None，將自動生成一個 UUID 作為基礎 ID。
                                         預設為 None。
            chunk_size (int, optional): 每個文本塊的目標字符數。預設為 1000。
            chunk_overlap (int, optional): 連續文本塊之間重疊的字符數，有助於維持上下文連貫性。
                                         預設為 200。
            metadata (Optional[Dict[str, Any]], optional):
                                         與整個原始文件相關聯的元數據字典。
                                         此字典的內容將被複製到每個塊的元數據中，
                                         並額外補充塊特定的信息（`chunk_index`, `total_chunks`, `base_document_id`）。
                                         如果為 None，則每個塊的元數據只包含塊特定的信息。
                                         預設為 None。

        Returns:
            bool: 如果文件成功分塊並添加到集合中，則返回 True。
                  如果在處理過程中發生任何錯誤（例如分塊或添加至數據庫時），則返回 False。
        """
        if not isinstance(document, str) or not document:
            print("Error: document must be a non-empty string.")
            return False
        if not isinstance(chunk_size, int) or chunk_size <= 0:
            print("Error: chunk_size must be a positive integer.")
            return False
        if not isinstance(chunk_overlap, int) or chunk_overlap < 0:
            print("Error: chunk_overlap must be a non-negative integer.")
            return False
        try:
            base_id = document_id if document_id else str(uuid.uuid4())
            chunks = self._split_text_into_chunks(document, chunk_size, chunk_overlap)
            print(f"Split document into {len(chunks)} chunks")
            ids = [f"{base_id}_chunk_{i}" for i in range(len(chunks))]
            if metadata is None:
                metadata = {}
            metadatas = []
            for i in range(len(chunks)):
                chunk_metadata = metadata.copy()
                chunk_metadata.update({
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "base_document_id": base_id
                })
                metadatas.append(chunk_metadata)
            return self.add_documents(
                collection_name=collection_name,
                ids=ids,
                documents=chunks,
                metadatas=metadatas
            )
        except Exception as e:
            print(f"Error in chunking and adding document: {e}")
            return False

    def _split_text_into_chunks(self, text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
        if len(text) <= chunk_size:
            return [text]
        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            if end < len(text):
                paragraph_break = chunk.rfind('\n\n')
                if paragraph_break != -1 and paragraph_break > chunk_size // 2:
                    end = start + paragraph_break + 2
                    chunk = text[start:end]
                else:
                    sentence_break = re.search(r'[.!?]\s+', chunk[::-1])
                    if sentence_break and sentence_break.start() < chunk_size // 4:
                        break_pos = len(chunk) - sentence_break.start()
                        end = start + break_pos
                        chunk = text[start:end]
            chunks.append(chunk)
            start = end - chunk_overlap

        return chunks

    def retrieve_similar_documents(
        self,
        collection_name: str,
        query: str,
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None,
        where_document: Optional[Dict[str, Any]] = None,
        include: List[str] = ['metadatas', 'documents', 'distances']
    ) -> Optional[Dict[str, Any]]:
        """
        從指定的 ChromaDB 集合中檢索與查詢文本相似的文件片段。

        Args:
            collection_name (str): 要查詢的 ChromaDB 集合名稱。
            query (str): 用於相似性搜索的查詢文本。
            n_results (int, optional): 要返回的最大結果數量。預設為 5。
            where (Optional[Dict[str, Any]], optional): 用於過濾元數據的條件字典。預設為 None。
            where_document (Optional[Dict[str, Any]], optional): 用於過濾文件內容的條件字典。預設為 None。
            include (List[str], optional): 指定查詢結果中要包含的數據列表 ('metadatas', 'documents', 'distances', 'embeddings')。
                                          預設為 ['metadatas', 'documents', 'distances']。

        Returns:
            Optional[Dict[str, Any]]: 包含查詢結果的字典，格式符合 ChromaDB 的 query API 返回值。
                                       如果查詢過程中發生錯誤，則返回 None。
                                       結果字典通常包含 'ids', 'documents', 'metadatas', 'distances' 等鍵。
        """
        try:
            collection = self.client.get_collection(name=collection_name, embedding_function=self.embedding_function)
            print(f"Querying collection '{collection_name}' for content similar to: '{query[:50]}...'")
            results = collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where,
                where_document=where_document,
                include=include
            )
            print(f"Found {len(results['ids'][0])} similar documents")
            return results
        except Exception as e:
            print(f"Error retrieving similar documents: {e}")
            return None

    def retrieve_and_reconstruct_documents(
        self,
        collection_name: str,
        query: str,
        n_chunks_per_doc: int = 5,
        max_docs: int = 3,
        where: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        檢索與查詢相似的文本區塊，將它們按原始基礎文件分組，
        然後重構這些基礎文件的內容（部分或全部，取決於檢索到的區塊），
        計算每個重構文件的相關性分數，並返回最相關的文件列表。

        此方法適用於處理被分割成多個區塊存儲的大型文件。

        Args:
            collection_name (str): 要查詢的 ChromaDB 集合名稱。
            query (str): 用於相似性搜索的查詢文本。
            n_chunks_per_doc (int, optional): 對於每個唯一的基礎文件，最多使用多少個檢索到的區塊來重構其內容。預設為 5。
            max_docs (int, optional): 最終返回的相關性最高的重構文件數量。預設為 3。
            where (Optional[Dict[str, Any]], optional): 傳遞給 `retrieve_similar_documents` 的元數據過濾器。預設為 None。

        Returns:
            List[Dict[str, Any]]: 一個包含重構後文件的字典列表。每個字典代表一個重構文件，包含以下鍵：
                                  'document_id': 基礎文件的原始ID。
                                  'content': 由檢索到的區塊按順序拼接而成的重構內容。
                                  'metadata': 基礎文件的元數據（排除了區塊特定的元數據如 chunk_index, total_chunks, base_document_id）。
                                  'relevance': 計算出的相關性分數（1 - 平均距離），值域通常在 0 到 1 之間，越高越相關。
                                  'chunks_retrieved': 用於重構此文件的區塊數量。
                                  'total_chunks': 此基礎文件原本被分割成的總區塊數量（來自元數據）。
                                  返回的列表按 'relevance' 降序排列，且最多包含 `max_docs` 個文件。
                                  如果在檢索或重構過程中發生錯誤，或未找到相似區塊，則返回空列表 `[]`。
        """
        try:
            # 第一步：檢索足夠數量的相似區塊
            # 乘以 2 是為了增加找到來自不同基礎文件的區塊的機會
            results = self.retrieve_similar_documents(
                collection_name=collection_name,
                query=query,
                n_results=n_chunks_per_doc * max_docs * 2,
                where=where,
                include=['metadatas', 'documents', 'distances']
            )
            if not results or not results['ids'][0]:
                print("No similar chunks found")
                return []

            # 第二步：按基礎文件 ID 將區塊分組
            documents = {}
            # 遍歷檢索到的每個區塊
            for i, doc_id in enumerate(results['ids'][0]):
                metadata = results['metadatas'][0][i]
                content = results['documents'][0][i]
                distance = results['distances'][0][i]
                
                # 從元數據中獲取基礎文件的ID
                base_doc_id = metadata.get('base_document_id')
                if not base_doc_id:
                    continue

                 # 如果這是該基礎文件的第一個被檢索到的區塊
                if base_doc_id not in documents:
                    documents[base_doc_id] = {
                        'chunks': [],
                        # 提取基礎文件的通用元數據（排除區塊特定信息）
                        'metadata': {k: v for k, v in metadata.items()
                                     if k not in ['chunk_index', 'total_chunks', 'base_document_id']},
                        'total_chunks': metadata.get('total_chunks', 1),
                        'distances': [] # 記錄屬於此基礎文件的所有檢索區塊的距離
                    }
                documents[base_doc_id]['chunks'].append({
                    'content': content,
                    'index': metadata.get('chunk_index', 0),
                    'distance': distance
                })
                documents[base_doc_id]['distances'].append(distance)

                # 限制每個基礎文件收集的區塊數量不超過 n_chunks_per_doc
                if len(documents[base_doc_id]['chunks']) >= n_chunks_per_doc:
                    continue

            # 第三步：重構文件內容並計算相關性
            reconstructed_docs = []
            for doc_id, doc_info in documents.items():
                doc_info['chunks'].sort(key=lambda x: x['index'])
                reconstructed_content = '\n'.join([chunk['content'] for chunk in doc_info['chunks']])
                avg_distance = sum(doc_info['distances']) / len(doc_info['distances']) if doc_info['distances'] else 1.0
                relevance = 1.0 - min(avg_distance, 1.0)
                reconstructed_docs.append({
                    'document_id': doc_id,
                    'content': reconstructed_content,
                    'metadata': doc_info['metadata'],
                    'relevance': relevance,
                    'chunks_retrieved': len(doc_info['chunks']),
                    'total_chunks': doc_info['total_chunks']
                })
            
            # 第四步：按相關性排序並返回指定數量的頂級文件
            reconstructed_docs.sort(key=lambda x: x['relevance'], reverse=True)
            return reconstructed_docs[:max_docs]
        except Exception as e:
            print(f"Error in retrieving and reconstructing documents: {e}")
            return []

if __name__ == "__main__":
    connecter = ChromaDBConnecter(path="./data/chromadb_data")
    collection_name = "example_collection"
    collection = connecter.create_collection(name=collection_name)

    if collection:
        ids = ["doc1", "doc2", "doc3"]
        documents = ["Hello, world!", "This is a test.", "Goodbye, world!"]
        metadatas = [{"author": "Alice"}, {"author": "Bob"}, {"author": "Alice"}]
        connecter.add_documents(collection_name=collection_name, ids=ids, documents=documents, metadatas=metadatas)

        long_document = """這是一份很長的文件，我們需要自動分割它。這裡只是示例，實際使用時可能會有更長的文件內容。
        文件可以包含多個段落，每個段落可能有不同的主題和內容。

        這是第二個段落，將與第一個段落分開處理。當我們有足夠長的文本時，它會被分割成多個部分。
        自動分割功能會嘗試在自然的斷點處進行分割，如段落之間或句子結束的地方。

        第三個段落提供了更多的文本來展示分割功能。在實際應用中，您可能會處理非常長的文檔，如研究論文、書籍章節或長篇報告。
        這個功能特別適合那些需要被分割以便更好地處理和分析的大型文檔。"""

        connecter.add_document_with_chunking(
            collection_name=collection_name,
            document=long_document,
            document_id="long_doc_1",
            chunk_size=200,
            chunk_overlap=50,
            metadata={"source": "example", "type": "long_document"}
        )

        query = "文件分割是如何工作的？"
        results = connecter.retrieve_similar_documents(
            collection_name=collection_name,
            query=query,
            n_results=3
        )
        print("\nSimilar chunks:")
        if results:
            for i, doc in enumerate(results['documents'][0]):
                print(f"{i+1}. {doc[:50]}... (Distance: {results['distances'][0][i]:.4f})")

        reconstructed = connecter.retrieve_and_reconstruct_documents(
            collection_name=collection_name,
            query=query,
            n_chunks_per_doc=3
        )
        print("\nReconstructed documents:")
        for i, doc in enumerate(reconstructed):
            print(f"\nDocument {i+1}: {doc['document_id']} (Relevance: {doc['relevance']:.4f})")
            print(f"Metadata: {doc['metadata']}")
            print(f"Content: {doc['content'][:150]}...")
