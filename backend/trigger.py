import asyncio
import random
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Policy, Claim, EventLog, SystemConfig
from fraud import run_fraud_check

logger = logging.getLogger("trigger_engine")

WEATHER_EVENTS = [
    {"type": "heavy_rain", "description": "Heavy rainfall detected", "severity": 0.7},
    {"type": "flood", "description": "Flood warning issued", "severity": 0.9},
    {"type": "heatwave", "description": "Extreme heatwave detected", "severity": 0.6},
    {"type": "storm", "description": "Severe storm approaching", "severity": 0.8},
    {"type": "cyclone", "description": "Cyclone alert issued", "severity": 1.0},
]


def get_config(db: Session) -> dict:
    """Read system config from DB, return defaults if missing."""
    configs = db.query(SystemConfig).all()
    result = {c.key: c.value for c in configs}
    return {
        "trigger_enabled": result.get("trigger_enabled", "true") == "true",
        "event_probability": float(result.get("event_probability", "0.25")),
        "trigger_interval": int(result.get("trigger_interval", "30")),
    }


def simulate_weather(probability: float):
    """Simulate weather — returns an event dict or None."""
    if random.random() < probability:
        return random.choice(WEATHER_EVENTS)
    return None


def process_event(event: dict, db: Session):
    """If weather event detected, auto-create claims for active policies."""
    active_policies = db.query(Policy).filter(Policy.status == "ACTIVE").all()

    claims_created = 0
    for policy in active_policies:
        # Check if a similar claim already exists for this policy today
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        existing = db.query(Claim).filter(
            Claim.policy_id == policy.id,
            Claim.event_type == event["type"],
            Claim.created_at >= today_start,
        ).first()

        if existing:
            continue

        # Calculate claim amount based on severity and coverage
        claim_amount = round(policy.coverage * event["severity"] * random.uniform(0.3, 0.7), 2)

        claim = Claim(
            user_id=policy.user_id,
            policy_id=policy.id,
            event_type=event["type"],
            event_details=event["description"],
            amount=claim_amount,
            status="PENDING",
        )
        db.add(claim)
        db.commit()
        db.refresh(claim)

        # Auto-run fraud check
        fraud_result = run_fraud_check(claim)
        if fraud_result["is_fraud"]:
            claim.fraud_flag = True
            claim.status = "REJECTED"
        else:
            claim.fraud_flag = False
            claim.status = "APPROVED"
        db.commit()

        # Auto-process payment for approved claims
        if claim.status == "APPROVED":
            from models import Payment
            payment = Payment(
                claim_id=claim.id,
                amount=claim.amount,
                status="PROCESSED",
                paid_at=datetime.now(timezone.utc),
            )
            db.add(payment)
            claim.status = "PAID"
            db.commit()

        claims_created += 1

    # Log the event
    event_log = EventLog(
        event_type=event["type"],
        description=event["description"],
        severity=event["severity"],
        claims_triggered=claims_created,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(event_log)
    db.commit()

    return claims_created


async def trigger_loop():
    """Background loop — runs on configurable interval."""
    logger.info("🚀 Trigger engine started")
    while True:
        try:
            db = SessionLocal()
            try:
                config = get_config(db)

                if not config["trigger_enabled"]:
                    logger.info("⏸️ Trigger engine paused (disabled by admin)")
                else:
                    event = simulate_weather(config["event_probability"])
                    if event:
                        logger.info(f"⚡ Weather event detected: {event['type']} — {event['description']}")
                        count = process_event(event, db)
                        logger.info(f"✅ Created {count} claim(s) for event: {event['type']}")
                    else:
                        logger.info("☀️ No weather event this cycle")

                interval = config["trigger_interval"]
            finally:
                db.close()
        except Exception as e:
            logger.error(f"❌ Trigger engine error: {e}")
            interval = 30

        await asyncio.sleep(interval)
