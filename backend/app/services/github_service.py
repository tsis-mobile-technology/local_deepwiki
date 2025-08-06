import os
import re
import asyncio
from github import Github, Auth
from typing import Dict, Any, List
from pathlib import Path

class GitHubService:
    def __init__(self, github_token: str):
        self.auth = Auth.Token(github_token)
        self.github = Github(auth=self.auth)
        self.file_cache = {}

    async def get_repository_structure(self, repo_name: str) -> Dict[str, Any]:
        return await asyncio.to_thread(self._get_repository_structure_sync, repo_name)

    def _get_repository_structure_sync(self, repo_name: str) -> Dict[str, Any]:
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
        contents = repo.get_contents("")
        while contents:
            file_content = contents.pop(0)
            if file_content.type == "dir":
                try:
                    contents.extend(repo.get_contents(file_content.path))
                except Exception:
                    pass # Ignore folders that can't be accessed
            else:
                structure["files"][file_content.path] = {
                    "size": file_content.size,
                    "type": self._get_file_type(file_content.path),
                    "sha": file_content.sha
                }
        return structure

    def _get_file_type(self, file_path: str) -> str:
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

    async def get_file_content(self, repo_name: str, file_path: str) -> str:
        return await asyncio.to_thread(self._get_file_content_sync, repo_name, file_path)

    def _get_file_content_sync(self, repo_name: str, file_path: str) -> str:
        cache_key = f"{repo_name}:{file_path}"
        if cache_key in self.file_cache:
            return self.file_cache[cache_key]

        repo = self.github.get_repo(repo_name)
        content = repo.get_contents(file_path).decoded_content.decode('utf-8')
        self.file_cache[cache_key] = content
        return content

    def get_priority_files(self, files: Dict[str, Any]) -> List[str]:
        priority_patterns = [
            (r'README\.md$', 100),
            (r'package\.json$', 90),
            (r'requirements\.txt$', 90),
            (r'setup\.py$', 90),
            (r'pom\.xml$', 90),
            (r'build\.gradle$', 90),
            (r'(src|app|lib)/main\.(py|js|ts|java)$', 80),
            (r'(src|app|lib)/index\.(js|ts)$', 80),
            (r'(src|app|lib)/__init__\.py$', 70),
            (r'(src|app|lib)/.*\.(py|js|ts|java|go|rs)$', 50),
        ]
        
        scored_files = []
        for file_path, file_info in files.items():
            score = 0
            for pattern, value in priority_patterns:
                if re.search(pattern, file_path, re.IGNORECASE):
                    score = value
                    break
            
            if score > 0:
                # Add a factor for file size (favoring medium-sized files)
                if 1000 < file_info["size"] < 50000:
                    score += 5
                scored_files.append((file_path, score))
        
        scored_files.sort(key=lambda x: x[1], reverse=True)
        return [f[0] for f in scored_files]