from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Claim
import random

router = APIRouter(prefix="/fraud", tags=["Fraud Detection"])

# Simulated "real" weather data for validation
VALID_EVENT_TYPES = ["heavy_rain", "flood", "heatwave", "storm", "cyclone"]


def run_fraud_check(claim: Claim) -> dict:
    """
    Rule-based fraud detection:
    1. Verify event type is valid
    2. Check claim amount vs reasonable range
    3. Random deep-analysis score
    """
    flags = []
    is_fraud = False

    # Check 1: Valid event type
    if claim.event_type not in VALID_EVENT_TYPES:
        flags.append(f"Unknown event type: {claim.event_type}")
        is_fraud = True

    # Check 2: Claim amount sanity (max 30000 coverage)
    if claim.amount > 30000:
        flags.append(f"Claim amount ₹{claim.amount} exceeds max coverage")
        is_fraud = True

    if claim.amount <= 0:
        flags.append("Claim amount is zero or negative")
        is_fraud = True

    # Check 3: Simulated AI confidence score
    confidence = round(random.uniform(0.3, 1.0), 2)
    if confidence < 0.4:
        flags.append(f"Low AI confidence score: {confidence}")
        is_fraud = True

    return {
        "is_fraud": is_fraud,
        "confidence": confidence,
        "flags": flags,
    }


@router.post("/check/{claim_id}")
def check_fraud(claim_id: int, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    result = run_fraud_check(claim)

    if result["is_fraud"]:
        claim.fraud_flag = True
        claim.status = "REJECTED"
    else:
        claim.fraud_flag = False
        claim.status = "APPROVED"

    db.commit()
    db.refresh(claim)

    return {
        "claim_id": claim.id,
        "status": claim.status,
        "fraud_flag": claim.fraud_flag,
        "fraud_details": result,
    }
