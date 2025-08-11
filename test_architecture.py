#!/usr/bin/env python3
"""
Test script to generate architecture analysis for the local project
"""

import sys
import os
# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.services.analysis_service import AnalysisService
from app.services.github_service import GitHubService
import json

def main():
    # Initialize services
    github_service = GitHubService("dummy_token")  # We don't need GitHub for local analysis
    analysis_service = AnalysisService(github_service)
    
    # Define project files to analyze
    project_files = [
        '/home/proidea/Programming/local_deepwiki/backend/app/main.py',
        '/home/proidea/Programming/local_deepwiki/backend/app/services/analysis_service.py',
        '/home/proidea/Programming/local_deepwiki/backend/app/services/github_service.py',
        '/home/proidea/Programming/local_deepwiki/backend/app/services/llm_service.py',
        '/home/proidea/Programming/local_deepwiki/backend/app/services/vector_service.py',
        '/home/proidea/Programming/local_deepwiki/frontend/src/components/ArchitectureDiagram.tsx',
        '/home/proidea/Programming/local_deepwiki/frontend/src/pages/DocumentationPage.tsx',
        '/home/proidea/Programming/local_deepwiki/frontend/src/components/RepoInputForm.tsx'
    ]
    
    # Analyze files
    file_analysis = {}
    
    for file_path in project_files:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Determine language
            if file_path.endswith('.py'):
                language = 'python'
            elif file_path.endswith(('.ts', '.tsx')):
                language = 'typescript'
            elif file_path.endswith('.js'):
                language = 'javascript'
            else:
                continue
                
            print(f"Analyzing: {file_path}")
            analysis = analysis_service.analyze_code(content, language)
            file_analysis[os.path.basename(file_path)] = analysis
            
            # Print analysis for debugging
            print(f"  Classes: {len(analysis.get('classes', []))}")
            print(f"  Functions: {len(analysis.get('functions', []))}")
            print(f"  Imports: {len(analysis.get('imports', []))}")
            print()
    
    # Generate architecture analysis
    repo_info = {
        "name": "local_deepwiki",
        "description": "Local DeepWiki Documentation Generator",
        "main_language": "python"
    }
    
    print("Generating architecture analysis...")
    architecture = analysis_service.analyze_project_architecture(file_analysis, repo_info)
    
    # Pretty print the architecture analysis
    print("\n" + "="*50)
    print("ARCHITECTURE ANALYSIS RESULT")
    print("="*50)
    print(json.dumps(architecture, indent=2, ensure_ascii=False))
    
    # Save to file for testing
    with open('/home/proidea/Programming/local_deepwiki/architecture_test.json', 'w', encoding='utf-8') as f:
        json.dump(architecture, f, indent=2, ensure_ascii=False)
    
    print("\nArchitecture data saved to: architecture_test.json")
    print(f"Components found: {len(architecture.get('components', {}))}")
    print(f"Dependencies found: {len(architecture.get('dependencies', []))}")

if __name__ == "__main__":
    main()