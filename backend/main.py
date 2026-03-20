import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, SessionLocal
from auth import router as auth_router, seed_admin
from profile import router as profile_router
from risk import router as risk_router
from policy import router as policy_router
from claims import router as claims_router
from fraud import router as fraud_router
from payment import router as payment_router
from admin import router as admin_router
from trigger import trigger_loop

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    logging.info("✅ Database initialized")
    # Seed admin user
    db = SessionLocal()
    try:
        seed_admin(db)
        logging.info("✅ Admin user seeded")
    finally:
        db.close()
    task = asyncio.create_task(trigger_loop())
    logging.info("✅ Trigger engine started")
    yield
    # Shutdown
    task.cancel()
    logging.info("🛑 Trigger engine stopped")


app = FastAPI(
    title="Guidewares — AI Insurance Platform",
    description="AI-powered insurance for gig workers",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(risk_router)
app.include_router(policy_router)
app.include_router(claims_router)
app.include_router(fraud_router)
app.include_router(payment_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "app": "Guidewares",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
    }
