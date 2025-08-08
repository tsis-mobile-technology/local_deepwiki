from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8')

    GITHUB_TOKEN: str = "YOUR_GITHUB_TOKEN"
    OPENAI_API_KEY: str = "YOUR_OPENAI_API_KEY"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    SUPABASE_URL: str = "YOUR_SUPABASE_URL"
    SUPABASE_ANON_KEY: str = "YOUR_SUPABASE_ANON_KEY"

    PYTHON_EXTERNAL_MODULES: List[str] = [
        'os', 'sys', 'json', 'datetime', 'time', 'requests', 'urllib',
        'fastapi', 'pydantic', 'sqlalchemy', 'redis', 'asyncio',
        'typing', 'logging', 'pathlib', 'collections', 'itertools',
        'functools', 'unittest', 'pytest', 'numpy', 'pandas'
    ]
    JS_EXTERNAL_MODULES: List[str] = [
        'react', 'vue', 'angular', 'lodash', 'moment', 'axios',
        'express', 'koa', 'socket.io', 'jquery', 'bootstrap',
        'typescript', 'webpack', 'babel', 'eslint',
        'mocha', 'chai', 'sinon', 'cypress', 'playwright',
        'next', 'gatsby', 'nuxt', 'svelte', 'solid-js',
        'mermaid', 'chart.js', 'd3', 'three', 'pixi.js'
    ]

settings = Settings()
