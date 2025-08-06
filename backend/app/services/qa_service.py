import asyncio
from typing import Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from app.config import settings
from app.services.vector_service import VectorService

class QAService:
    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=settings.OPENAI_API_KEY,
            model="gpt-3.5-turbo",
            temperature=0.1
        )
        self.vector_service = VectorService()
        
        # RAG 프롬프트 템플릿
        self.qa_prompt = PromptTemplate.from_template("""
당신은 GitHub 리포지토리 문서화 전문 AI 어시스턴트입니다. 
주어진 문서 내용을 바탕으로 사용자의 질문에 정확하고 도움이 되는 답변을 제공하세요.

관련 문서 내용:
{context}

사용자 질문: {question}

답변 지침:
1. 주어진 문서 내용을 기반으로만 답변하세요
2. 문서에 명시되지 않은 내용은 추측하지 마세요
3. 코드 예제가 있다면 포함하여 설명하세요
4. 관련 파일명이나 함수명을 언급할 때는 구체적으로 명시하세요
5. 답변을 찾을 수 없는 경우 솔직히 말씀하세요

답변:
""")

    async def answer_question(self, question: str, repo_name: str) -> Dict[str, Any]:
        """사용자 질문에 대해 RAG를 사용하여 답변 생성"""
        try:
            # 1. Vector Store에서 관련 문서 검색
            relevant_docs = await self.vector_service.search_similar_content(
                query=question,
                repo_name=repo_name,
                limit=5
            )
            
            if not relevant_docs:
                return {
                    "success": False,
                    "answer": "해당 리포지토리에 대한 문서를 찾을 수 없습니다. 먼저 리포지토리를 분석해주세요.",
                    "sources": []
                }
            
            # 2. 컨텍스트 구성
            context = "\n\n".join([
                f"문서 {i+1}:\n{doc['content']}" 
                for i, doc in enumerate(relevant_docs)
            ])
            
            # 3. LLM을 사용하여 답변 생성
            formatted_prompt = self.qa_prompt.format(
                context=context,
                question=question
            )
            
            response = await asyncio.to_thread(
                self.llm.invoke, formatted_prompt
            )
            
            answer = response.content if hasattr(response, 'content') else str(response)
            
            return {
                "success": True,
                "answer": answer,
                "sources": [
                    {
                        "content": doc["content"][:200] + "...",  # 첫 200자만 표시
                        "metadata": doc.get("metadata", {})
                    }
                    for doc in relevant_docs
                ]
            }
            
        except Exception as e:
            print(f"Error in answer_question: {e}")
            return {
                "success": False,
                "answer": f"답변 생성 중 오류가 발생했습니다: {str(e)}",
                "sources": []
            }

    async def get_suggested_questions(self, repo_name: str) -> List[str]:
        """리포지토리에 대한 추천 질문들 생성"""
        try:
            # 간단한 추천 질문들 (실제로는 문서 내용을 기반으로 동적 생성 가능)
            suggested_questions = [
                "이 프로젝트는 어떤 기능을 제공하나요?",
                "프로젝트를 설치하고 실행하는 방법은?",
                "주요 API 엔드포인트들은 무엇인가요?",
                "프로젝트의 아키텍처는 어떻게 구성되어 있나요?",
                "어떤 기술 스택을 사용하고 있나요?"
            ]
            
            return suggested_questions
            
        except Exception as e:
            print(f"Error generating suggested questions: {e}")
            return []