from typing import Optional

from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from .config import get_settings


def setup_telemetry(app: FastAPI, engine) -> None:
    settings = get_settings()
    resource = Resource.create(
        {
            "service.name": settings.app_name,
            "service.namespace": settings.service_namespace,
            "service.version": "1.0.0",
        }
    )
    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter(endpoint=f"{settings.otlp_endpoint}/v1/traces", timeout=10)
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)

    FastAPIInstrumentor.instrument_app(app, tracer_provider=provider)
    Psycopg2Instrumentor().instrument()
    SQLAlchemyInstrumentor().instrument(engine=engine, tracer_provider=provider)
