from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8')

    GITHUB_TOKEN: str = "YOUR_GITHUB_TOKEN"
    OPENAI_API_KEY: str = "YOUR_OPENAI_API_KEY"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    SUPABASE_URL: str = "YOUR_SUPABASE_URL"
    SUPABASE_ANON_KEY: str = "YOUR_SUPABASE_ANON_KEY"

settings = Settings()
