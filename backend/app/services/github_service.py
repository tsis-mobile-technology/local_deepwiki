import asyncio
import base64
import re
from typing import Dict, Any, List
from pathlib import Path
import httpx

class GitHubService:
    BASE_URL = "https://api.github.com"

    def __init__(self, github_token: str):
        self.headers = {
            "Authorization": f"Bearer {github_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        self.client = httpx.AsyncClient(headers=self.headers, timeout=30.0)

    async def get_repository_structure(self, repo_name: str) -> Dict[str, Any]:
        try:
            # 1. Get repo details
            repo_url = f"{self.BASE_URL}/repos/{repo_name}"
            repo_res = await self.client.get(repo_url)
            repo_res.raise_for_status()
            print(f"DEBUG: Type of repo_res: {type(repo_res)}")
            json_result = repo_res.json()
            if asyncio.iscoroutine(json_result):
                print("DEBUG: repo_res.json() returned a coroutine. Awaiting...")
                repo_data = await json_result
            else:
                print("DEBUG: repo_res.json() returned a dict directly. Not awaiting.")
                repo_data = json_result
            print(f"DEBUG: Type of repo_data: {type(repo_data)}")

            default_branch = repo_data["default_branch"]

            # 2. Get commit hash
            branch_url = f"{self.BASE_URL}/repos/{repo_name}/branches/{default_branch}"
            branch_res = await self.client.get(branch_url)
            print(f"DEBUG: Type of branch_res: {type(branch_res)}")
            branch_res.raise_for_status()
            json_result = branch_res.json()
            if asyncio.iscoroutine(json_result):
                print("DEBUG: branch_res.json() returned a coroutine. Awaiting...")
                branch_data = await json_result
            else:
                print("DEBUG: branch_res.json() returned a dict directly. Not awaiting.")
                branch_data = json_result
            print(f"DEBUG: Type of branch_data: {type(branch_data)}")
            commit_hash = branch_data["commit"]["sha"]

            # 3. Get file tree
            tree_url = f"{self.BASE_URL}/repos/{repo_name}/git/trees/{commit_hash}?recursive=1"
            tree_res = await self.client.get(tree_url)
            print(f"DEBUG: Type of tree_res: {type(tree_res)}")
            tree_res.raise_for_status()
            json_result = tree_res.json()
            if asyncio.iscoroutine(json_result):
                print("DEBUG: tree_res.json() returned a coroutine. Awaiting...")
                tree_data = await json_result
            else:
                print("DEBUG: tree_res.json() returned a dict directly. Not awaiting.")
                tree_data = json_result
            print(f"DEBUG: Type of tree_data: {type(tree_data)}")

            files = {
                item["path"]: {
                    "size": item.get("size", 0),
                    "type": self._get_file_type(item["path"]),
                    "sha": item["sha"]
                }
                for item in tree_data["tree"] if item["type"] == "blob"
            }

            return {
                "name": repo_data["name"],
                "description": repo_data["description"],
                "main_language": repo_data["language"],
                "topics": repo_data.get("topics", []),
                "default_branch": default_branch,
                "files": files,
                "commit_hash": commit_hash
            }
        except httpx.HTTPStatusError as e:
            print(f"HTTP error fetching repository structure for {repo_name}: {e}")
            raise
        except Exception as e:
            print(f"An unexpected error occurred in get_repository_structure: {e}")
            raise

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
        try:
            file_url = f"{self.BASE_URL}/repos/{repo_name}/contents/{file_path}"
            response = await self.client.get(file_url)
            response.raise_for_status()
            
            content_b64 = response.json()['content']
            return base64.b64decode(content_b64).decode('utf-8')
        except httpx.HTTPStatusError as e:
            print(f"HTTP error fetching file content for {repo_name}/{file_path}: {e}")
            return f"Error: Could not fetch file content. Status: {e.response.status_code}"
        except Exception as e:
            print(f"An unexpected error occurred in get_file_content: {e}")
            return "Error: An unexpected error occurred while fetching file content."

    def get_priority_files(self, files: Dict[str, Any]) -> List[str]:
        priority_patterns = [
            (r'README\.md', 100),
            (r'package\.json', 90),
            (r'requirements\.txt', 90),
            (r'setup\.py', 90),
            (r'pom\.xml', 90),
            (r'build\.gradle', 90),
            (r'(src|app|lib)/main\.(py|js|ts|java)', 80),
            (r'(src|app|lib)/index\.(js|ts)', 80),
            (r'(src|app|lib)/__init__\.py', 70),
            (r'(src|app|lib)/.*\.(py|js|ts|java|go|rs)', 50),
        ]
        
        scored_files = []
        for file_path, file_info in files.items():
            score = 0
            for pattern, value in priority_patterns:
                if re.search(pattern, file_path, re.IGNORECASE):
                    score = value
                    break
            
            if score > 0:
                if 1000 < file_info["size"] < 50000:
                    score += 5
                scored_files.append((file_path, score))
        
        scored_files.sort(key=lambda x: x[1], reverse=True)
        return [f[0] for f in scored_files]
