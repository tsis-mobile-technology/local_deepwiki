# DeepWiki Style Documentation Generation Prompts

## 1. 메인 문서 생성 프롬프트

```markdown
You are an expert technical documentation writer creating comprehensive documentation for a GitHub repository in the style of DeepWiki.

## Context
Repository: {repository_name}
Description: {repository_description}
Main Language: {main_language}
Topics: {topics}

## Code Analysis Results
{code_analysis}

## Your Task
Create detailed technical documentation following this EXACT structure:

### 1. Overview Section
Write a comprehensive overview that includes:
- What the library/project does (2-3 paragraphs)
- Core value proposition
- Target audience and use cases
- Key differentiators

Include source references in format: `Sources: [filename.ext:L{start}-L{end}]`

### 2. Architecture & Core Components
Document the main architectural components:
- Component name and purpose
- How components interact
- Key design patterns used
- Important data flows

For each component, include:
```
**Component Name**
Description of what this component does and its role in the system.
Key classes/modules: `ClassName`, `ModuleName`
Sources: [src/path/file.py:L10-L50]
```

### 3. Key Concepts
Explain fundamental concepts users need to understand:
- Core abstractions
- Important terminology
- Design principles
- Configuration philosophy

### 4. Primary Workflows
Document the main usage patterns:

#### Installation/Setup
- Requirements
- Installation steps
- Basic configuration

#### Basic Usage
Show the simplest working example with code

#### Advanced Features
Document more complex use cases

### 5. API Reference (if applicable)
For main classes and functions:
- Purpose and description
- Parameters with types
- Return values
- Usage examples
- Source references

## Formatting Requirements
1. Use clear hierarchical headers (##, ###, ####)
2. Include code examples in ```language blocks
3. Add source references after each major claim
4. Use tables for structured data
5. Bold important terms on first use
6. Keep paragraphs concise (3-5 sentences)
7. Include "Sources:" lines with GitHub file references

## Source Reference Format
Always include source references in this format:
- Single file: `[path/to/file.ext:L{start}-L{end}]`
- Multiple files: `[file1.py:L10-L20] [file2.py:L30-L40]`
- Entire file: `[path/to/file.ext]`

Generate comprehensive, accurate documentation that helps users understand and use the repository effectively.
```

## 2. 코드 분석 프롬프트

```markdown
Analyze the following code structure and identify key components for documentation:

## Repository Structure
{file_tree}

## File Content to Analyze
{file_content}

## Tasks
1. **Identify Main Components**
   - Core classes and their responsibilities
   - Key functions and their purposes
   - Important constants and configurations
   - Module organization pattern

2. **Trace Code Relationships**
   - How do the main classes interact?
   - What are the key dependencies?
   - What's the initialization flow?
   - What are the main data pipelines?

3. **Extract Documentation Elements**
   - Existing docstrings and comments
   - Function signatures and type hints
   - Configuration options
   - Example usage in tests or examples

4. **Determine Architecture Pattern**
   - Is it MVC, layered, microservices, etc?
   - What design patterns are used?
   - How is the code organized?

Output a structured analysis with:
- Component list with descriptions
- Relationship diagram (in text)
- Key code locations (file:line references)
- Notable patterns and practices
```

## 3. 섹션별 상세 프롬프트

### 3.1 Overview 생성

```markdown
Create a comprehensive overview section for {repository_name}.

Based on:
- README content: {readme_content}
- Main files: {main_files}
- Package description: {package_info}

Write an overview that:
1. Starts with a compelling one-sentence description
2. Explains the problem it solves (1 paragraph)
3. Describes the solution approach (1 paragraph)
4. Lists key features (bullet points)
5. Mentions supported platforms/frameworks
6. Includes installation quickstart

Add source references for all technical claims.
Format: Professional yet accessible technical writing.
```

### 3.2 API Documentation 생성

```markdown
Document the following API component:

Class/Function: {component_name}
File Location: {file_path}:{line_number}
Source Code:
```python
{source_code}
```

Generate documentation including:

## {component_name}
**Purpose**: [One sentence description]

**Details**: [1-2 paragraph explanation of what it does and why]

### Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| {param} | {type} | {description} | {default} |

### Returns
- **Type**: {return_type}
- **Description**: {return_description}

### Raises
- `{ExceptionType}`: {when_raised}

### Example Usage
```python
# Basic usage example
{example_code}
```

### Implementation Notes
- [Any important implementation details]
- [Performance considerations]
- [Common pitfalls]

Sources: [{file_path}:L{start}-L{end}]
```

## 4. 코드 참조 추출 프롬프트

```markdown
Extract and format code references from the repository {repository_name}.

For the following documentation section:
{documentation_text}

Find the exact source locations for each technical claim and format them as:

1. Claim: "{claim_text}"
   Source: {file_path}:L{start_line}-L{end_line}
   Commit: {commit_hash}

2. Claim: "{claim_text}"
   Source: {file_path}:L{start_line}-L{end_line}
   Commit: {commit_hash}

Ensure:
- Line numbers are accurate
- File paths are relative to repository root
- Only include references for factual/technical claims
- Group related claims with multiple sources
```

## 5. 검증 및 품질 체크 프롬프트

```markdown
Review and improve the following documentation:

{generated_documentation}

Check for:
1. **Accuracy**: Are all technical claims correct?
2. **Completeness**: Are all major components covered?
3. **Clarity**: Is the language clear and unambiguous?
4. **Structure**: Is the hierarchy logical?
5. **References**: Are source references accurate and sufficient?
6. **Examples**: Are code examples correct and runnable?
7. **Consistency**: Is terminology used consistently?

Provide:
- List of issues found
- Suggested corrections
- Missing important topics
- Improved version of problematic sections
```

## 6. 사용 예시 프롬프트

```markdown
Create practical usage examples for {component_name} from {repository_name}.

Component Details:
{component_details}

Generate:

### Basic Example
Show the simplest possible working example.

### Intermediate Example
Show common use case with configuration options.

### Advanced Example  
Show complex scenario with error handling and optimization.

Each example should:
- Be complete and runnable
- Include necessary imports
- Have inline comments
- Show expected output
- Reference source files

Format:
```python
# Example: {example_title}
# This example shows how to {purpose}

# Required imports
import ...

# Setup
...

# Main usage
...

# Expected output:
# ...
```

Sources: [examples/file.py:L1-L50]
```

## 7. 인터랙티브 Q&A 프롬프트

```markdown
You are a documentation assistant for {repository_name}. 
Available documentation:
{documentation_index}

User Question: {user_question}

Provide a helpful answer that:
1. Directly addresses the question
2. Includes relevant code examples
3. References specific documentation sections
4. Links to source code when applicable
5. Suggests related topics

Format the response with:
- Clear answer first
- Code example (if applicable)
- Source references
- Related documentation links
```

## 사용 가이드

### 프롬프트 조합 전략

1. **초기 분석**: 프롬프트 2 → 코드 구조 파악
2. **메인 문서 생성**: 프롬프트 1 → 전체 문서 생성  
3. **섹션별 상세화**: 프롬프트 3.1-3.2 → 각 섹션 개선
4. **참조 추가**: 프롬프트 4 → 소스 코드 링크
5. **품질 검증**: 프롬프트 5 → 최종 검토
6. **예제 보강**: 프롬프트 6 → 실용적 예제 추가
7. **인터랙티브**: 프롬프트 7 → Q&A 기능

### 프롬프트 커스터마이징

각 프롬프트의 변수들을 프로젝트에 맞게 조정:
- `{repository_name}`: 실제 저장소 이름
- `{main_language}`: 주 프로그래밍 언어
- `{code_analysis}`: 코드 분석 결과
- `{file_content}`: 분석할 파일 내용

### 모델 선택 권장사항

- **GPT-4 Turbo**: 복잡한 코드 분석, 메인 문서 생성
- **GPT-3.5 Turbo**: 간단한 섹션, 예제 생성
- **Claude 3**: 긴 컨텍스트 처리, 상세 분석
- **Local LLMs**: 민감한 코드, 오프라인 처리