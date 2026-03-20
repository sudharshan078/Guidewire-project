from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Policy, User
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/policy", tags=["Policy"])


class BuyPolicyRequest(BaseModel):
    user_id: int
    plan_name: str  # "basic", "standard", "premium"


PLANS = {
    "basic": {"coverage": 5000, "premium_multiplier": 1.0},
    "standard": {"coverage": 15000, "premium_multiplier": 1.5},
    "premium": {"coverage": 30000, "premium_multiplier": 2.0},
}


@router.post("/buy")
def buy_policy(req: BuyPolicyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    plan = PLANS.get(req.plan_name.lower())
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan. Choose basic, standard, or premium")

    # Check for existing active policy
    active = db.query(Policy).filter(
        Policy.user_id == req.user_id,
        Policy.status == "ACTIVE",
    ).first()
    if active:
        raise HTTPException(status_code=400, detail="You already have an active policy")

    # Calculate premium from risk engine
    from risk import calculate_risk
    risk = calculate_risk(user.location or "default", user.work_type or "default")
    base_premium = risk["weekly_premium"]
    final_premium = round(base_premium * plan["premium_multiplier"], 2)

    now = datetime.now(timezone.utc)
    policy = Policy(
        user_id=req.user_id,
        plan_name=req.plan_name.lower(),
        premium=final_premium,
        coverage=plan["coverage"],
        start_date=now,
        end_date=now + timedelta(days=7),
        status="ACTIVE",
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)

    return {
        "message": "Policy purchased successfully",
        "policy_id": policy.id,
        "plan_name": policy.plan_name,
        "premium": policy.premium,
        "coverage": policy.coverage,
        "start_date": policy.start_date.isoformat(),
        "end_date": policy.end_date.isoformat(),
        "status": policy.status,
    }


@router.get("/{user_id}")
def get_policies(user_id: int, db: Session = Depends(get_db)):
    policies = db.query(Policy).filter(Policy.user_id == user_id).order_by(Policy.id.desc()).all()
    return [
        {
            "policy_id": p.id,
            "plan_name": p.plan_name,
            "premium": p.premium,
            "coverage": p.coverage,
            "start_date": p.start_date.isoformat(),
            "end_date": p.end_date.isoformat(),
            "status": p.status,
        }
        for p in policies
    ]
