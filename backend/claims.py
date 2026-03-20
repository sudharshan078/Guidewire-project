from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Claim

router = APIRouter(prefix="/claims", tags=["Claims"])


@router.get("/{user_id}")
def get_claims(user_id: int, db: Session = Depends(get_db)):
    claims = db.query(Claim).filter(Claim.user_id == user_id).order_by(Claim.id.desc()).all()
    return [
        {
            "claim_id": c.id,
            "policy_id": c.policy_id,
            "event_type": c.event_type,
            "event_details": c.event_details,
            "amount": c.amount,
            "status": c.status,
            "fraud_flag": c.fraud_flag,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in claims
    ]
