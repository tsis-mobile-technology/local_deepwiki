#!/usr/bin/env python3
"""
Create sample architecture data for testing the frontend visualization
"""

import json

def create_sample_architecture():
    """Create sample architecture data that mimics your project structure"""
    
    sample_architecture = {
        "project_info": {
            "name": "local_deepwiki",
            "description": "Documentation Generator with Architecture Visualization",
            "main_language": "python"
        },
        "components": {
            "main": {
                "name": "main",
                "file_path": "backend/app/main.py",
                "type": "main",
                "classes": [],
                "functions": [
                    {"name": "analyze_repository", "line": 45},
                    {"name": "get_architecture_data", "line": 277}
                ],
                "imports": [
                    "from fastapi import FastAPI",
                    "from app.services.analysis_service import AnalysisService",
                    "from app.services.github_service import GitHubService"
                ],
                "lines_count": 15
            },
            "AnalysisService": {
                "name": "AnalysisService", 
                "file_path": "backend/app/services/analysis_service.py",
                "type": "service",
                "classes": [
                    {"name": "AnalysisService", "line": 16}
                ],
                "functions": [
                    {"name": "analyze_code", "line": 49},
                    {"name": "analyze_project_architecture", "line": 122}
                ],
                "imports": [
                    "from typing import Dict, Any, List",
                    "from app.services.github_service import GitHubService"
                ],
                "lines_count": 20
            },
            "GitHubService": {
                "name": "GitHubService",
                "file_path": "backend/app/services/github_service.py", 
                "type": "service",
                "classes": [
                    {"name": "GitHubService", "line": 12}
                ],
                "functions": [
                    {"name": "get_repo_structure", "line": 45},
                    {"name": "get_file_content", "line": 78}
                ],
                "imports": [
                    "import requests",
                    "from typing import Dict, Any"
                ],
                "lines_count": 18
            },
            "VectorService": {
                "name": "VectorService",
                "file_path": "backend/app/services/vector_service.py",
                "type": "service",
                "classes": [
                    {"name": "VectorService", "line": 8}
                ],
                "functions": [
                    {"name": "store_document", "line": 25},
                    {"name": "search_documents", "line": 45}
                ],
                "imports": [
                    "from qdrant_client import QdrantClient",
                    "from sentence_transformers import SentenceTransformer"
                ],
                "lines_count": 12
            },
            "LLMService": {
                "name": "LLMService",
                "file_path": "backend/app/services/llm_service.py",
                "type": "service", 
                "classes": [
                    {"name": "LLMService", "line": 10}
                ],
                "functions": [
                    {"name": "run_documentation_pipeline", "line": 30},
                    {"name": "generate_documentation", "line": 55}
                ],
                "imports": [
                    "import google.generativeai as genai",
                    "from typing import Dict"
                ],
                "lines_count": 16
            },
            "ArchitectureDiagram": {
                "name": "ArchitectureDiagram",
                "file_path": "frontend/src/components/ArchitectureDiagram.tsx",
                "type": "component",
                "classes": [],
                "functions": [
                    {"name": "ArchitectureDiagram", "line": 40},
                    {"name": "generateFlowchartDiagram", "line": 95},
                    {"name": "generateGraphDiagram", "line": 131}
                ],
                "imports": [
                    "import React from 'react'",
                    "import mermaid from 'mermaid'",
                    "import { Box, Typography } from '@mui/material'"
                ],
                "lines_count": 22
            },
            "DocumentationPage": {
                "name": "DocumentationPage",
                "file_path": "frontend/src/pages/DocumentationPage.tsx",
                "type": "component",
                "classes": [],
                "functions": [
                    {"name": "DocumentationPage", "line": 15}
                ],
                "imports": [
                    "import React from 'react'",
                    "import { Container, Typography } from '@mui/material'"
                ],
                "lines_count": 8
            },
            "RepoInputForm": {
                "name": "RepoInputForm",
                "file_path": "frontend/src/components/RepoInputForm.tsx",
                "type": "component",
                "classes": [],
                "functions": [
                    {"name": "RepoInputForm", "line": 20}
                ],
                "imports": [
                    "import React from 'react'",
                    "import { TextField, Button } from '@mui/material'"
                ],
                "lines_count": 10
            }
        },
        "dependencies": [
            {
                "from": "main",
                "to": "AnalysisService", 
                "type": "internal",
                "import_statement": "from app.services.analysis_service import AnalysisService"
            },
            {
                "from": "main", 
                "to": "GitHubService",
                "type": "internal",
                "import_statement": "from app.services.github_service import GitHubService"
            },
            {
                "from": "AnalysisService",
                "to": "GitHubService",
                "type": "internal", 
                "import_statement": "from app.services.github_service import GitHubService"
            },
            {
                "from": "main",
                "to": "VectorService",
                "type": "internal",
                "import_statement": "from app.services.vector_service import VectorService"
            },
            {
                "from": "main",
                "to": "LLMService", 
                "type": "internal",
                "import_statement": "from app.services.llm_service import LLMService"
            },
            {
                "from": "DocumentationPage",
                "to": "ArchitectureDiagram",
                "type": "internal",
                "import_statement": "import ArchitectureDiagram from '../components/ArchitectureDiagram'"
            },
            {
                "from": "DocumentationPage", 
                "to": "RepoInputForm",
                "type": "internal",
                "import_statement": "import RepoInputForm from '../components/RepoInputForm'"
            }
        ],
        "structure": {
            "layers": ["main", "service", "component"],
            "patterns": ["Service Layer", "Component Architecture"], 
            "complexity": "medium"
        },
        "metrics": {
            "total_components": 8,
            "total_dependencies": 7,
            "dependency_density": 0.88,
            "most_depended_component": "GitHubService",
            "max_dependency_count": 2
        }
    }
    
    # Save to file
    with open('/home/proidea/Programming/local_deepwiki/sample_architecture.json', 'w', encoding='utf-8') as f:
        json.dump(sample_architecture, f, indent=2, ensure_ascii=False)
    
    print("Sample architecture data created!")
    print(f"Components: {len(sample_architecture['components'])}")
    print(f"Dependencies: {len(sample_architecture['dependencies'])}")
    print("Saved to: sample_architecture.json")
    
    return sample_architecture

if __name__ == "__main__":
    create_sample_architecture()