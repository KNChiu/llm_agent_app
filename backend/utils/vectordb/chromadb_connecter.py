import re
import uuid
from typing import List, Optional, Dict, Any
import chromadb
from chromadb.utils import embedding_functions
from typing import List, Optional, Dict, Any, Union, Tuple
import uuid
import re


class ChromaDBConnecter:
    def __init__(self, path: Optional[str] = None, embedding_model_name: str = "default") -> None:
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
        try:
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

            documents = {}
            for i, doc_id in enumerate(results['ids'][0]):
                metadata = results['metadatas'][0][i]
                content = results['documents'][0][i]
                distance = results['distances'][0][i]
                base_doc_id = metadata.get('base_document_id')
                if not base_doc_id:
                    continue
                if base_doc_id not in documents:
                    documents[base_doc_id] = {
                        'chunks': [],
                        'metadata': {k: v for k, v in metadata.items()
                                     if k not in ['chunk_index', 'total_chunks', 'base_document_id']},
                        'total_chunks': metadata.get('total_chunks', 1),
                        'distances': []
                    }
                documents[base_doc_id]['chunks'].append({
                    'content': content,
                    'index': metadata.get('chunk_index', 0),
                    'distance': distance
                })
                documents[base_doc_id]['distances'].append(distance)

                if len(documents[base_doc_id]['chunks']) >= n_chunks_per_doc:
                    continue

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
