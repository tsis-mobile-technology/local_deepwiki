from typing import Dict, Any
import json

from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import Runnable

class LLMService:
    def __init__(self, openai_api_key: str):
        self.llm = ChatOpenAI(
            openai_api_key=openai_api_key,
            model_name="gpt-4o-mini",
            temperature=0.3
        )

    def _get_prompt_template(self, template_str: str) -> PromptTemplate:
        return PromptTemplate.from_template(template_str)

    def _create_chain(self, prompt_template: PromptTemplate) -> Runnable:
        return prompt_template | self.llm

    def run_summarization(self, readme_content: str) -> str:
        template = """
        You are a technical writer. Summarize the following README content to provide a high-level overview of the project.
        Focus on the project's purpose, key features, and target audience.

        README Content:
        {readme_content}

        Summary:
        """
        prompt = self._get_prompt_template(template)
        chain = self._create_chain(prompt)
        response = chain.invoke({"readme_content": readme_content})
        return response.content

    def run_structure_analysis(self, file_analysis: Dict[str, Any]) -> str:
        template = """
        Based on the following file analysis, describe the overall architecture, core components, and key data flows of the project.

        File Analysis:
        {file_analysis_json}

        Architectural Overview:
        """
        prompt = self._get_prompt_template(template)
        chain = self._create_chain(prompt)
        response = chain.invoke({"file_analysis_json": json.dumps(file_analysis, indent=2)})
        return response.content

    def run_draft_generation(self, repo_info: Dict, summary: str, structure_analysis: str) -> str:
        template = """
        You are an expert technical documentation writer creating comprehensive documentation for a GitHub repository in the style of DeepWiki.

        ## Context
        Repository: {repo_name}
        Description: {repo_description}
        Main Language: {main_language}

        ## High-Level Summary
        {summary}

        ## Architectural Analysis
        {structure_analysis}

        ## Your Task
        Create a detailed technical documentation draft following this structure:
        1.  **Overview**: Expand on the summary, including use cases and key differentiators.
        2.  **Architecture & Core Components**: Detail the components based on the analysis.
        3.  **Key Concepts**: Explain fundamental concepts and design principles.
        4.  **Primary Workflows**: Document installation, setup, and basic usage.
        5.  **API Reference (if applicable)**: Outline main classes and functions.

        ## Formatting Requirements
        - Use clear hierarchical headers (##, ###, ####).
        - Include code examples in ```language blocks where appropriate.
        - Keep paragraphs concise and clear.

        Generate the comprehensive Markdown documentation now.
        """
        prompt = self._get_prompt_template(template)
        chain = self._create_chain(prompt)
        response = chain.invoke({
            "repo_name": repo_info.get('name', ''),
            "repo_description": repo_info.get('description', ''),
            "main_language": repo_info.get('main_language', ''),
            "summary": summary,
            "structure_analysis": structure_analysis
        })
        return response.content

    def run_documentation_pipeline(self, repo_info: Dict, readme_content: str, file_analysis: Dict) -> str:
        """Executes the full documentation generation pipeline."""
        # Step 1: Summarize README
        summary = self.run_summarization(readme_content)

        # Step 2: Analyze code structure
        structure_analysis = self.run_structure_analysis(file_analysis)

        # Step 3: Generate the main draft
        final_documentation = self.run_draft_generation(repo_info, summary, structure_analysis)

        return final_documentation