from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = Field(default="ecommerce-back-python", alias="APP_NAME")
    service_namespace: str = Field(default="tenant-a", alias="SERVICE_NAMESPACE")

    database_url: str | None = Field(default=None, alias="DATABASE_URL")
    database_host: str = Field(default="postgres", alias="DATABASE_HOST")
    database_port: int = Field(default=5432, alias="DATABASE_PORT")
    database_name: str = Field(default="panopticon", alias="DATABASE_NAME")
    database_user: str = Field(default="panopticon", alias="DATABASE_USER")
    database_password: str = Field(default="panopticon", alias="DATABASE_PASSWORD")

    otlp_endpoint: str = Field(
        default="http://otel-collector.tenant-a.svc.cluster.local:4318",
        alias="OTEL_EXPORTER_OTLP_ENDPOINT",
    )

    seed_demo_data: bool = Field(default=True, alias="SEED_DEMO_DATA")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    def build_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        return (
            f"postgresql+psycopg2://{self.database_user}:{self.database_password}"
            f"@{self.database_host}:{self.database_port}/{self.database_name}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
