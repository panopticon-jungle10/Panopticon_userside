import logging
import os
import sys
from typing import Any, Dict

import structlog
from opentelemetry import trace


def add_standard_fields(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Add standard fields required by Panopticon"""
    # Add type
    event_dict["type"] = "log"

    # Rename timestamp field
    if "timestamp" in event_dict:
        event_dict["timestamp"] = event_dict.pop("timestamp")

    # Add service_name from environment
    event_dict["service_name"] = os.getenv("APP_NAME", "ecommerce-back-python")

    # Add environment
    event_dict["environment"] = os.getenv("ENVIRONMENT", "production")

    # Rename level to uppercase
    if "level" in event_dict:
        event_dict["level"] = event_dict["level"].upper()

    # Rename event to message
    if "event" in event_dict:
        event_dict["message"] = event_dict.pop("event")

    # Add OpenTelemetry trace context if available
    span = trace.get_current_span()
    if span and span.is_recording():
        span_context = span.get_span_context()
        event_dict["trace_id"] = format(span_context.trace_id, "032x")
        event_dict["span_id"] = format(span_context.span_id, "016x")
    else:
        event_dict["trace_id"] = None
        event_dict["span_id"] = None

    return event_dict


def configure_logging() -> None:
    timestamper = structlog.processors.TimeStamper(fmt="iso", key="timestamp")

    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            timestamper,
            structlog.processors.add_log_level,
            add_standard_fields,
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)
