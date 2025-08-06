import os
import asyncio
from typing import List, Dict, Any
from supabase import create_client, Client
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from app.config import settings

class VectorService:
    def __init__(self):
        self.supabase: Client = create_client(
            settings.SUPABASE_URL, 
            settings.SUPABASE_ANON_KEY
        )
        self.embeddings = OpenAIEmbeddings(
            api_key=settings.OPENAI_API_KEY,
            model="text-embedding-3-small"
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )

    async def store_document(self, repo_name: str, documentation: str, commit_hash: str):
        """문서를 청크로 분할하고 Embedding하여 Supabase Vector Store에 저장"""
        try:
            # 1. 문서를 청크로 분할
            chunks = self.text_splitter.split_text(documentation)
            
            # 2. 각 청크에 대해 임베딩 생성 및 저장
            for i, chunk in enumerate(chunks):
                # 임베딩 생성
                embedding = await asyncio.to_thread(
                    self.embeddings.embed_query, chunk
                )
                
                # Supabase에 저장
                result = self.supabase.table("documents").insert({
                    "repo_name": repo_name,
                    "commit_hash": commit_hash,
                    "chunk_index": i,
                    "content": chunk,
                    "embedding": embedding,
                    "metadata": {
                        "chunk_size": len(chunk),
                        "total_chunks": len(chunks)
                    }
                }).execute()
                
                if not result.data:
                    raise Exception(f"Failed to store chunk {i}")
            
            return {"success": True, "chunks_stored": len(chunks)}
            
        except Exception as e:
            print(f"Error storing document: {e}")
            return {"success": False, "error": str(e)}

    async def search_similar_content(self, query: str, repo_name: str, limit: int = 5) -> List[Dict[str, Any]]:
        """질문과 유사한 문서 내용을 Vector Store에서 검색"""
        try:
            # 1. 쿼리에 대한 임베딩 생성
            query_embedding = await asyncio.to_thread(
                self.embeddings.embed_query, query
            )
            
            # 2. Supabase에서 유사도 검색
            # Note: 실제로는 Supabase의 Vector similarity search 기능을 사용해야 함
            # 여기서는 간소화된 버전을 구현
            result = self.supabase.table("documents")\
                .select("content, metadata, repo_name")\
                .eq("repo_name", repo_name)\
                .limit(limit)\
                .execute()
            
            if result.data:
                return result.data
            else:
                return []
                
        except Exception as e:
            print(f"Error searching similar content: {e}")
            return []

    async def delete_repo_documents(self, repo_name: str, commit_hash: str):
        """특정 리포지토리의 문서들을 삭제"""
        try:
            result = self.supabase.table("documents")\
                .delete()\
                .eq("repo_name", repo_name)\
                .eq("commit_hash", commit_hash)\
                .execute()
            
            return {"success": True, "deleted_count": len(result.data) if result.data else 0}
            
        except Exception as e:
            print(f"Error deleting documents: {e}")
            return {"success": False, "error": str(e)}

    def create_documents_table_sql(self) -> str:
        """documents 테이블 생성을 위한 SQL 스크립트 반환"""
        return """
        -- documents 테이블 생성
        CREATE TABLE IF NOT EXISTS documents (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            repo_name TEXT NOT NULL,
            commit_hash TEXT NOT NULL,
            chunk_index INTEGER NOT NULL,
            content TEXT NOT NULL,
            embedding VECTOR(1536), -- OpenAI text-embedding-3-small의 차원
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- 인덱스
            UNIQUE(repo_name, commit_hash, chunk_index)
        );

        -- Vector 유사도 검색을 위한 인덱스 생성
        CREATE INDEX IF NOT EXISTS documents_embedding_idx 
        ON documents 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);

        -- 일반 검색을 위한 인덱스
        CREATE INDEX IF NOT EXISTS documents_repo_commit_idx 
        ON documents (repo_name, commit_hash);
        
        -- RLS (Row Level Security) 정책 (선택사항)
        ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
        """