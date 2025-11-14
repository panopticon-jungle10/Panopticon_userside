import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from opentelemetry import trace

from .config import get_settings
from .database import Base, engine, session_scope
from .logger import configure_logging, get_logger
from .routers import cart, orders, products, users
from .seed import seed_data
from .telemetry import setup_telemetry

configure_logging()
settings = get_settings()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ecommerce Python Backend", version="1.0.0", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(users.router)
app.include_router(orders.router)
app.include_router(cart.router)

logger = get_logger("app")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000

    # Log with HTTP details (trace_id/span_id added automatically by logger)
    logger.info(
        f"{request.method} {request.url.path}",
        http_method=request.method,
        http_path=str(request.url.path),
        http_status_code=response.status_code,
        duration_ms=round(duration_ms, 2),
    )

    return response


# Setup telemetry AFTER middleware registration
setup_telemetry(app, engine)


@app.on_event("startup")
def startup_event():
    if settings.seed_demo_data:
        with session_scope() as session:
            seed_data(session)
    logger.info("Python backend started", service=settings.app_name)


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.app_name}
