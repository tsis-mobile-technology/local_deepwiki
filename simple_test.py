#!/usr/bin/env python3
"""
Simple test to verify our fallback analysis works
"""

import re

def fallback_analysis(content, language):
    """Simple regex-based analysis"""
    analysis = {
        "imports": [],
        "classes": [],
        "functions": []
    }
    
    lines = content.split('\n')
    
    if language == 'python':
        # Find imports
        for i, line in enumerate(lines):
            if re.match(r'^\s*(import|from)\s+', line.strip()):
                analysis["imports"].append(line.strip())
        
        # Find classes
        for i, line in enumerate(lines):
            match = re.match(r'^\s*class\s+(\w+)', line)
            if match:
                analysis["classes"].append({
                    "name": match.group(1),
                    "line": i + 1
                })
        
        # Find functions (including async def)
        for i, line in enumerate(lines):
            match = re.match(r'^\s*(?:async\s+)?def\s+(\w+)', line)
            if match:
                analysis["functions"].append({
                    "name": match.group(1),
                    "line": i + 1
                })
    
    return analysis

# Test with a sample Python file
with open('backend/app/main.py', 'r') as f:
    content = f.read()

result = fallback_analysis(content, 'python')
print(f"Analysis results:")
print(f"Imports found: {len(result['imports'])}")
print(f"Classes found: {len(result['classes'])}")  
print(f"Functions found: {len(result['functions'])}")

print(f"\nImports:")
for imp in result['imports'][:5]:  # Show first 5
    print(f"  - {imp}")

print(f"\nFunctions:")
for func in result['functions'][:5]:  # Show first 5  
    print(f"  - {func['name']} (line {func['line']})")