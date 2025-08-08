# 🔍 DeepWiki - AI-Powered GitHub Documentation Generator

[![CI/CD Pipeline](https://github.com/tsis-mobile-technology/local_deepwiki/actions/workflows/ci.yml/badge.svg)](https://github.com/tsis-mobile-technology/local_deepwiki/actions/workflows/ci.yml)
[![Python 3.12](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/release/python-3120/)
[![React 18](https://img.shields.io/badge/react-18.0+-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 Overview

DeepWiki is an AI-powered web application that automatically generates comprehensive, interactive documentation from GitHub repositories. Simply provide a GitHub repository URL, and DeepWiki will analyze the codebase using advanced AI techniques to create wiki-style documentation with architecture diagrams, Q&A functionality, and intelligent code insights.

### ✨ Key Features

- 🤖 **AI-Powered Analysis**: Uses OpenAI GPT models with LangChain for intelligent code analysis
- 🏗️ **Architecture Visualization**: Generates interactive Mermaid.js diagrams showing project structure
- 💬 **Interactive Q&A**: RAG-based question answering using Supabase vector database
- 🔍 **Multi-Language Support**: Supports Python, JavaScript, TypeScript, and more via Tree-sitter
- ⚡ **Real-time Updates**: WebSocket integration for live analysis progress
- 🗄️ **Smart Caching**: Redis-based caching to reduce API costs and improve performance
- 🗑️ **Analysis Management**: Select and delete analysis results with bulk operations
- 🐳 **Containerized**: Full Docker support for easy deployment
- 📊 **Comprehensive Testing**: TDD approach with 90%+ test coverage

## 🏛️ Architecture

```
DeepWiki/
├── 🖥️  Frontend (React + TypeScript)
│   ├── Interactive UI with Markdown rendering
│   ├── Real-time WebSocket communication
│   ├── Analysis history management with delete functionality
│   └── Architecture visualization with Mermaid.js
│
├── 🔧 Backend (FastAPI + Python)
│   ├── GitHub API integration
│   ├── Tree-sitter code analysis
│   ├── LangChain LLM pipeline
│   ├── Analysis CRUD operations
│   └── Vector database operations
│
└── 🗃️  Data Layer
    ├── Supabase (PostgreSQL + Vector Store)
    ├── Redis (Caching + Task Queue)
    └── OpenAI Embeddings
```

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Python 3.12+** (for local development)
- **Node.js 18+** (for local development)
- **OpenAI API Key**
- **Supabase Project** (with Vector extension enabled)

### 🐳 Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/tsis-mobile-technology/local_deepwiki.git
   cd local_deepwiki
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Setup Supabase Database**
   ```bash
   # Run the SQL script in your Supabase dashboard
   cat supabase_setup.sql
   ```

4. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### 💻 Local Development Setup

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY="your-openai-api-key"
export SUPABASE_URL="your-supabase-url"
export SUPABASE_ANON_KEY="your-supabase-anon-key"

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# GitHub Configuration (optional, for higher rate limits)
GITHUB_TOKEN=your_github_token_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Development Configuration
ENVIRONMENT=development
```

### Supabase Setup

1. Create a new Supabase project
2. Enable the Vector extension:
   ```sql
   CREATE EXTENSION vector;
   ```
3. Run the provided `supabase_setup.sql` script to create required tables

## 📋 API Documentation

### Core Endpoints

- **POST /api/analyze** - Start repository analysis
  ```json
  {
    "repo_url": "https://github.com/user/repo"
  }
  ```

- **GET /api/result/{task_id}** - Get analysis results
- **GET /api/analyses** - Get analysis history
- **DELETE /api/analyses** - Delete multiple analyses (bulk operation)
- **DELETE /api/analyses/{task_id}** - Delete single analysis
- **GET /api/architecture/{task_id}** - Get architecture data
- **POST /api/ask** - Ask questions about the repository
- **GET /api/suggestions/{repo_name}** - Get suggested questions
- **WebSocket /ws/status/{task_id}** - Real-time analysis updates

### Analysis Management

The application now supports comprehensive analysis management:

#### Delete Single Analysis
```bash
curl -X DELETE "http://localhost:8000/api/analyses/task-id-here"
```

#### Delete Multiple Analyses (Bulk Operation)
```bash
curl -X DELETE "http://localhost:8000/api/analyses" \
  -H "Content-Type: application/json" \
  -d '{"task_ids": ["task-1", "task-2", "task-3"]}'
```

## 🛠️ User Interface Features

### Analysis History Management

- **📊 Analysis History View**: See all your analyzed repositories with status indicators
- **✏️ Edit Mode**: Toggle selection mode to manage multiple analyses
- **☑️ Batch Selection**: Select individual items or use "Select All" for bulk operations
- **🗑️ Delete Functionality**: Remove unwanted analysis results with confirmation dialog
- **📈 Status Tracking**: Visual status indicators (Completed, Pending, Analyzing, Failed)
- **⏰ Time Stamps**: See when each analysis was created and last updated
- **🔗 Commit References**: View associated Git commit hashes

### Interactive Features

1. **Single Click**: View analysis results in normal mode
2. **Edit Mode**: Switch to selection mode for management tasks
3. **Checkbox Selection**: Multi-select analyses for bulk operations
4. **Confirmation Dialog**: Safety prompt before deletion
5. **Real-time Feedback**: Loading states and success/error messages

## 🧪 Testing

### Run All Tests

```bash
# Backend tests
cd backend
python -m pytest tests/ -v --cov=app

# Frontend tests
cd frontend
npm run test:coverage

# Integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Test Structure

```
tests/
├── backend/
│   ├── test_github_service.py      # GitHub API integration tests
│   ├── test_analysis_service.py    # Code analysis tests
│   ├── test_vector_service.py      # Vector database tests
│   ├── test_qa_service.py          # Q&A functionality tests
│   ├── test_delete_api.py          # Delete functionality tests
│   └── test_integration.py         # End-to-end API tests
└── frontend/
    ├── components/                  # Component unit tests
    ├── integration/                 # Integration tests
    ├── store-delete.test.ts        # Delete functionality store tests
    └── e2e/                        # End-to-end tests
```

## 🚀 Deployment

### Production Docker Deployment

1. **Build production images**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Deploy with production configuration**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Configure reverse proxy** (Nginx example included in `/nginx/`)

### Cloud Deployment

The application is ready for deployment on:
- **AWS** (ECS, EC2)
- **Google Cloud** (Cloud Run, Compute Engine)
- **Azure** (Container Instances, App Service)

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **LangChain** - LLM application framework
- **Tree-sitter** - Multi-language code parsing
- **Supabase** - PostgreSQL with Vector extensions
- **Redis** - Caching and task queue
- **PyGithub** - GitHub API integration

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Zustand** - Lightweight state management
- **Material-UI** - Component library with dark theme
- **Mermaid.js** - Diagram generation
- **React Testing Library** - Testing utilities

### DevOps
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Nginx** - Reverse proxy
- **pytest** - Python testing
- **Vitest** - JavaScript testing

## 📊 Performance & Monitoring

- **Caching Strategy**: Redis-based caching reduces LLM API calls by ~80%
- **Rate Limiting**: Built-in protection against API abuse
- **Error Tracking**: Comprehensive error logging and monitoring
- **Test Coverage**: 90%+ code coverage across all components
- **Resource Cleanup**: Automatic cleanup of deleted analyses from cache and vector store

## 🗑️ Data Management

### Cache Management
- Automatic cache cleanup when analyses are deleted
- Repository-specific cache invalidation
- Cache statistics and health monitoring

### Vector Store Cleanup
- Automatic deletion of embeddings when analyses are removed
- Commit-hash based cleanup for precise data management
- Performance optimized bulk operations

### Database Operations
- ACID-compliant deletion operations
- Cascade cleanup of related data
- Comprehensive error handling and rollback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Run the test suite (`npm run test` and `pytest`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow TDD (Test-Driven Development) practices
- Maintain test coverage above 90%
- Use conventional commit messages
- Update documentation for new features
- Ensure all CI/CD checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/tsis-mobile-technology/local_deepwiki/issues)
- **Documentation**: [Wiki](https://github.com/tsis-mobile-technology/local_deepwiki/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/tsis-mobile-technology/local_deepwiki/discussions)

## 🎯 Roadmap

- [x] **Analysis Management**: Select and delete analysis results ✅
- [ ] **Multi-Repository Analysis** - Analyze multiple repositories at once
- [ ] **Custom Prompt Templates** - User-defined analysis prompts
- [ ] **Export Functionality** - PDF, Confluence, Notion exports
- [ ] **Team Collaboration** - Shared workspaces and annotations
- [ ] **Enterprise Features** - SSO, audit logs, custom deployments

---

<div align="center">

**Made with ❤️ by the TSIS Mobile Technology Team**

[⭐ Star us on GitHub](https://github.com/tsis-mobile-technology/local_deepwiki) | [🐛 Report Bug](https://github.com/tsis-mobile-technology/local_deepwiki/issues) | [✨ Request Feature](https://github.com/tsis-mobile-technology/local_deepwiki/issues)

</div>
