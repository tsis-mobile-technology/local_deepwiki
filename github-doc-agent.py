"""
GitHub Repository Documentation Agent
GitHub 리포지토리를 분석하여 DeepWiki 스타일의 문서를 자동 생성하는 에이전트
"""

import os
import re
import ast
import json
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from pathlib import Path
import asyncio
import aiohttp
from datetime import datetime
import hashlib

# GitHub API 관련
import requests
from github import Github
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate

@dataclass
class CodeReference:
    """코드 참조 정보"""
    file_path: str
    start_line: int
    end_line: int
    commit_hash: str = ""
    
    def to_link(self, repo_url: str) -> str:
        """GitHub 링크 생성"""
        return f"{repo_url}/blob/{self.commit_hash}/{self.file_path}#L{self.start_line}-L{self.end_line}"

@dataclass
class DocumentSection:
    """문서 섹션"""
    title: str
    level: int
    content: str
    references: List[CodeReference] = field(default_factory=list)
    subsections: List['DocumentSection'] = field(default_factory=list)

class GitHubAnalyzer:
    """GitHub 리포지토리 분석기"""
    
    def __init__(self, github_token: str):
        self.github = Github(github_token)
        self.file_cache = {}
        
    def get_repository_structure(self, repo_name: str) -> Dict[str, Any]:
        """리포지토리 구조 분석"""
        repo = self.github.get_repo(repo_name)
        
        structure = {
            "name": repo.name,
            "description": repo.description,
            "main_language": repo.language,
            "topics": repo.get_topics(),
            "default_branch": repo.default_branch,
            "files": {},
            "commit_hash": repo.get_branch(repo.default_branch).commit.sha
        }
        
        # 파일 트리 구성
        contents = repo.get_contents("")
        while contents:
            file_content = contents.pop(0)
            if file_content.type == "dir":
                contents.extend(repo.get_contents(file_content.path))
            else:
                structure["files"][file_content.path] = {
                    "size": file_content.size,
                    "type": self._get_file_type(file_content.path),
                    "sha": file_content.sha
                }
        
        return structure
    
    def _get_file_type(self, file_path: str) -> str:
        """파일 타입 결정"""
        ext = Path(file_path).suffix.lower()
        
        type_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.go': 'go',
            '.rs': 'rust',
            '.md': 'markdown',
            '.yml': 'yaml',
            '.yaml': 'yaml',
            '.json': 'json',
            '.txt': 'text',
            '.sh': 'shell',
            '.dockerfile': 'dockerfile'
        }
        
        return type_map.get(ext, 'unknown')
    
    def get_file_content(self, repo_name: str, file_path: str) -> str:
        """파일 내용 가져오기"""
        cache_key = f"{repo_name}:{file_path}"
        
        if cache_key in self.file_cache:
            return self.file_cache[cache_key]
        
        repo = self.github.get_repo(repo_name)
        content = repo.get_contents(file_path).decoded_content.decode('utf-8')
        self.file_cache[cache_key] = content
        
        return content
    
    def analyze_python_file(self, content: str) -> Dict[str, Any]:
        """Python 파일 분석"""
        try:
            tree = ast.parse(content)
            
            analysis = {
                "imports": [],
                "classes": [],
                "functions": [],
                "constants": []
            }
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        analysis["imports"].append(alias.name)
                        
                elif isinstance(node, ast.ImportFrom):
                    module = node.module or ""
                    for alias in node.names:
                        analysis["imports"].append(f"{module}.{alias.name}")
                        
                elif isinstance(node, ast.ClassDef):
                    class_info = {
                        "name": node.name,
                        "line": node.lineno,
                        "methods": [],
                        "docstring": ast.get_docstring(node)
                    }
                    
                    for item in node.body:
                        if isinstance(item, ast.FunctionDef):
                            class_info["methods"].append({
                                "name": item.name,
                                "line": item.lineno,
                                "docstring": ast.get_docstring(item)
                            })
                    
                    analysis["classes"].append(class_info)
                    
                elif isinstance(node, ast.FunctionDef) and node.col_offset == 0:
                    analysis["functions"].append({
                        "name": node.name,
                        "line": node.lineno,
                        "docstring": ast.get_docstring(node)
                    })
            
            return analysis
            
        except SyntaxError:
            return {"error": "Failed to parse Python file"}

class DocumentGenerator:
    """문서 생성기"""
    
    def __init__(self, openai_api_key: str):
        self.llm = ChatOpenAI(
            openai_api_key=openai_api_key,
            model_name="gpt-4-turbo-preview",
            temperature=0.3
        )
        self.embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
        
    def create_documentation_prompt(self) -> PromptTemplate:
        """문서 생성 프롬프트 템플릿"""
        template = """
        You are an expert technical documentation writer analyzing a GitHub repository.
        Your task is to create comprehensive, well-structured documentation similar to DeepWiki.

        Repository Information:
        {repo_info}

        Code Structure:
        {code_structure}

        File Analysis:
        {file_analysis}

        Create documentation with the following structure:
        
        1. **Overview**: High-level description of the repository/library
           - What it does
           - Key features
           - Target audience
           
        2. **Core Components**: Main architectural components
           - List and describe each major component
           - How they interact
           - Include code references
           
        3. **Key Concepts**: Important concepts and patterns
           - Design patterns used
           - Architecture decisions
           - Best practices
           
        4. **Workflows**: Common usage patterns
           - Installation/Setup
           - Basic usage examples
           - Advanced usage patterns
           
        5. **API Reference**: If applicable
           - Main classes/functions
           - Parameters and return values
           - Usage examples

        For each section:
        - Include specific code references in format: [filename.ext:line_start-line_end]
        - Provide clear, concise explanations
        - Use code examples where appropriate
        - Maintain technical accuracy

        Generate the documentation in Markdown format with proper hierarchical structure.
        """
        
        return PromptTemplate(
            input_variables=["repo_info", "code_structure", "file_analysis"],
            template=template
        )
    
    def generate_section(self, 
                        repo_info: Dict,
                        code_structure: Dict,
                        file_analysis: Dict) -> str:
        """문서 섹션 생성"""
        
        prompt = self.create_documentation_prompt()
        
        chain = prompt | self.llm
        
        response = chain.invoke({
            "repo_info": json.dumps(repo_info, indent=2),
            "code_structure": json.dumps(code_structure, indent=2),
            "file_analysis": json.dumps(file_analysis, indent=2)
        })
        
        return response.content
    
    def extract_code_references(self, content: str) -> List[Tuple[str, CodeReference]]:
        """문서에서 코드 참조 추출"""
        pattern = r'\[([^:]+):(\d+)-(\d+)\]'
        references = []
        
        for match in re.finditer(pattern, content):
            file_path = match.group(1)
            start_line = int(match.group(2))
            end_line = int(match.group(3))
            
            ref = CodeReference(
                file_path=file_path,
                start_line=start_line,
                end_line=end_line
            )
            
            references.append((match.group(0), ref))
        
        return references

class GitHubDocAgent:
    """메인 문서화 에이전트"""
    
    def __init__(self, github_token: str, openai_api_key: str):
        self.analyzer = GitHubAnalyzer(github_token)
        self.generator = DocumentGenerator(openai_api_key)
        self.vector_store = None
        
    async def analyze_repository(self, repo_name: str) -> Dict[str, Any]:
        """리포지토리 전체 분석"""
        print(f"Analyzing repository: {repo_name}")
        
        # 1. 리포지토리 구조 분석
        structure = self.analyzer.get_repository_structure(repo_name)
        
        # 2. 주요 파일 분석
        file_analyses = {}
        priority_files = self._get_priority_files(structure["files"])
        
        for file_path in priority_files[:20]:  # 상위 20개 파일만 분석
            print(f"Analyzing file: {file_path}")
            content = self.analyzer.get_file_content(repo_name, file_path)
            
            if file_path.endswith('.py'):
                analysis = self.analyzer.analyze_python_file(content)
                file_analyses[file_path] = analysis
        
        # 3. 벡터 스토어 생성 (검색 가능한 인덱스)
        await self._create_vector_store(repo_name, structure, file_analyses)
        
        return {
            "structure": structure,
            "file_analyses": file_analyses
        }
    
    def _get_priority_files(self, files: Dict[str, Any]) -> List[str]:
        """우선순위 파일 선택"""
        priority_patterns = [
            r'__init__\.py$',
            r'main\.py$',
            r'app\.py$',
            r'index\.(js|ts)$',
            r'src/.*\.(py|js|ts|java|go)$',
            r'lib/.*\.py$',
            r'README\.md$',
            r'setup\.py$',
            r'package\.json$'
        ]
        
        scored_files = []
        
        for file_path, file_info in files.items():
            score = 0
            
            # 우선순위 패턴 매칭
            for i, pattern in enumerate(priority_patterns):
                if re.search(pattern, file_path):
                    score += (len(priority_patterns) - i) * 10
            
            # 파일 크기 고려 (적당한 크기 선호)
            if 1000 < file_info["size"] < 50000:
                score += 5
            
            scored_files.append((file_path, score))
        
        # 점수 기준 정렬
        scored_files.sort(key=lambda x: x[1], reverse=True)
        
        return [f[0] for f in scored_files]
    
    async def _create_vector_store(self, 
                                   repo_name: str,
                                   structure: Dict,
                                   file_analyses: Dict):
        """벡터 스토어 생성"""
        documents = []
        
        # README 파일 처리
        if "README.md" in structure["files"]:
            readme_content = self.analyzer.get_file_content(repo_name, "README.md")
            documents.append({
                "content": readme_content,
                "metadata": {"type": "readme", "file": "README.md"}
            })
        
        # 분석된 파일들 처리
        for file_path, analysis in file_analyses.items():
            if "classes" in analysis:
                for class_info in analysis["classes"]:
                    doc_content = f"Class: {class_info['name']}\n"
                    if class_info.get('docstring'):
                        doc_content += f"Description: {class_info['docstring']}\n"
                    doc_content += f"Methods: {', '.join([m['name'] for m in class_info['methods']])}"
                    
                    documents.append({
                        "content": doc_content,
                        "metadata": {
                            "type": "class",
                            "file": file_path,
                            "name": class_info['name'],
                            "line": class_info['line']
                        }
                    })
        
        # 텍스트 분할 및 임베딩
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        
        texts = []
        metadatas = []
        
        for doc in documents:
            chunks = text_splitter.split_text(doc["content"])
            texts.extend(chunks)
            metadatas.extend([doc["metadata"]] * len(chunks))
        
        if texts:
            self.vector_store = FAISS.from_texts(
                texts=texts,
                embedding=self.generator.embeddings,
                metadatas=metadatas
            )
    
    def generate_documentation(self, 
                              repo_name: str,
                              analysis: Dict[str, Any]) -> str:
        """최종 문서 생성"""
        
        # 기본 정보 준비
        repo_info = {
            "name": repo_name,
            "description": analysis["structure"]["description"],
            "language": analysis["structure"]["main_language"],
            "topics": analysis["structure"]["topics"]
        }
        
        # 코드 구조 요약
        code_structure = {
            "total_files": len(analysis["structure"]["files"]),
            "file_types": self._summarize_file_types(analysis["structure"]["files"]),
            "main_components": self._identify_main_components(analysis["file_analyses"])
        }
        
        # 문서 생성
        documentation = self.generator.generate_section(
            repo_info=repo_info,
            code_structure=code_structure,
            file_analysis=analysis["file_analyses"]
        )
        
        # 코드 참조 링크 생성
        commit_hash = analysis["structure"]["commit_hash"]
        documentation = self._add_github_links(
            documentation, 
            repo_name, 
            commit_hash
        )
        
        return documentation
    
    def _summarize_file_types(self, files: Dict) -> Dict[str, int]:
        """파일 타입 요약"""
        type_count = {}
        
        for file_info in files.values():
            file_type = file_info["type"]
            type_count[file_type] = type_count.get(file_type, 0) + 1
        
        return type_count
    
    def _identify_main_components(self, file_analyses: Dict) -> List[str]:
        """주요 컴포넌트 식별"""
        components = []
        
        for file_path, analysis in file_analyses.items():
            if isinstance(analysis, dict) and "classes" in analysis:
                for class_info in analysis["classes"]:
                    components.append(f"{class_info['name']} ({file_path})")
        
        return components[:10]  # 상위 10개만
    
    def _add_github_links(self, 
                         documentation: str,
                         repo_name: str,
                         commit_hash: str) -> str:
        """GitHub 링크 추가"""
        
        # 코드 참조 패턴 찾기
        references = self.generator.extract_code_references(documentation)
        
        # 링크로 변환
        repo_url = f"https://github.com/{repo_name}"
        
        for match_text, ref in references:
            ref.commit_hash = commit_hash
            link = ref.to_link(repo_url)
            
            # Markdown 링크 형식으로 변환
            markdown_link = f"[{match_text}]({link})"
            documentation = documentation.replace(match_text, markdown_link)
        
        return documentation

# 사용 예제
async def main():
    # 설정
    GITHUB_TOKEN = "your_github_token"
    OPENAI_API_KEY = "your_openai_api_key"
    REPO_NAME = "huggingface/transformers"
    
    # 에이전트 초기화
    agent = GitHubDocAgent(GITHUB_TOKEN, OPENAI_API_KEY)
    
    # 리포지토리 분석
    analysis = await agent.analyze_repository(REPO_NAME)
    
    # 문서 생성
    documentation = agent.generate_documentation(REPO_NAME, analysis)
    
    # 결과 저장
    output_path = f"{REPO_NAME.replace('/', '_')}_documentation.md"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(documentation)
    
    print(f"Documentation saved to {output_path}")
    
    return documentation

if __name__ == "__main__":
    asyncio.run(main())
