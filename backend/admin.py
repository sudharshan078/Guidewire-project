from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from database import get_db
from models import User, Policy, Claim, Payment, EventLog, SystemConfig
from datetime import datetime, timezone, timedelta
from typing import Optional

router = APIRouter(prefix="/admin", tags=["Admin"])


# ---------- USER MANAGEMENT ----------

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.desc()).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "location": u.location,
            "work_type": u.work_type,
            "role": u.role,
            "is_blocked": u.is_blocked,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "policy_count": len(u.policies),
            "claim_count": len(u.claims),
        }
        for u in users
    ]


@router.post("/block-user/{user_id}")
def block_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot block admin users")
    user.is_blocked = True
    db.commit()
    return {"message": f"User {user.username} blocked", "user_id": user.id}


@router.post("/unblock-user/{user_id}")
def unblock_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_blocked = False
    db.commit()
    return {"message": f"User {user.username} unblocked", "user_id": user.id}


# ---------- POLICY MANAGEMENT ----------

@router.get("/policies")
def get_all_policies(db: Session = Depends(get_db)):
    policies = db.query(Policy).order_by(Policy.id.desc()).all()
    return [
        {
            "id": p.id,
            "user_id": p.user_id,
            "username": p.user.username if p.user else "N/A",
            "plan_name": p.plan_name,
            "premium": p.premium,
            "coverage": p.coverage,
            "start_date": p.start_date.isoformat(),
            "end_date": p.end_date.isoformat(),
            "status": p.status,
        }
        for p in policies
    ]


class UpdatePolicyRequest(BaseModel):
    status: Optional[str] = None
    premium: Optional[float] = None
    coverage: Optional[float] = None


@router.post("/update-policy/{policy_id}")
def update_policy(policy_id: int, req: UpdatePolicyRequest, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    if req.status:
        policy.status = req.status
    if req.premium is not None:
        policy.premium = req.premium
    if req.coverage is not None:
        policy.coverage = req.coverage
    db.commit()
    return {"message": "Policy updated", "policy_id": policy.id}


# ---------- CLAIM MANAGEMENT ----------

@router.get("/claims")
def get_all_claims(db: Session = Depends(get_db)):
    claims = db.query(Claim).order_by(Claim.id.desc()).all()
    return [
        {
            "id": c.id,
            "user_id": c.user_id,
            "username": c.user.username if c.user else "N/A",
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


@router.post("/approve/{claim_id}")
def approve_claim(claim_id: int, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    claim.status = "APPROVED"
    claim.fraud_flag = False
    db.commit()
    return {"message": "Claim approved", "claim_id": claim.id}


@router.post("/reject/{claim_id}")
def reject_claim(claim_id: int, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    claim.status = "REJECTED"
    db.commit()
    return {"message": "Claim rejected", "claim_id": claim.id}


@router.post("/pay/{claim_id}")
def pay_claim(claim_id: int, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status not in ("APPROVED",):
        raise HTTPException(status_code=400, detail=f"Claim is {claim.status}, must be APPROVED")
    existing = db.query(Payment).filter(Payment.claim_id == claim_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already paid")
    payment = Payment(
        claim_id=claim.id,
        amount=claim.amount,
        status="PROCESSED",
        paid_at=datetime.now(timezone.utc),
    )
    db.add(payment)
    claim.status = "PAID"
    db.commit()
    return {"message": "Payment processed", "claim_id": claim.id, "amount": payment.amount}


# ---------- ANALYTICS ----------

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    total_users = db.query(func.count(User.id)).filter(User.role == "user").scalar()
    active_policies = db.query(func.count(Policy.id)).filter(Policy.status == "ACTIVE").scalar()
    total_claims = db.query(func.count(Claim.id)).scalar()
    total_payout = db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar()
    fraud_count = db.query(func.count(Claim.id)).filter(Claim.fraud_flag == True).scalar()
    fraud_rate = round((fraud_count / total_claims * 100) if total_claims > 0 else 0, 1)

    paid_claims = db.query(func.count(Claim.id)).filter(Claim.status == "PAID").scalar()
    pending_claims = db.query(func.count(Claim.id)).filter(Claim.status == "PENDING").scalar()
    rejected_claims = db.query(func.count(Claim.id)).filter(Claim.status == "REJECTED").scalar()
    approved_claims = db.query(func.count(Claim.id)).filter(Claim.status == "APPROVED").scalar()

    total_premium = db.query(func.coalesce(func.sum(Policy.premium), 0)).scalar()
    total_coverage = db.query(func.coalesce(func.sum(Policy.coverage), 0)).scalar()

    # Claims by event type
    event_dist = (
        db.query(Claim.event_type, func.count(Claim.id))
        .group_by(Claim.event_type)
        .all()
    )
    claims_by_event = {row[0]: row[1] for row in event_dist}

    # Claims by status
    status_dist = (
        db.query(Claim.status, func.count(Claim.id))
        .group_by(Claim.status)
        .all()
    )
    claims_by_status = {row[0]: row[1] for row in status_dist}

    # Risk distribution (by location)
    loc_dist = (
        db.query(User.location, func.count(User.id))
        .filter(User.role == "user", User.location != "")
        .group_by(User.location)
        .all()
    )
    users_by_location = {row[0]: row[1] for row in loc_dist}

    # Platform distribution
    work_dist = (
        db.query(User.work_type, func.count(User.id))
        .filter(User.role == "user", User.work_type != "")
        .group_by(User.work_type)
        .all()
    )
    users_by_platform = {row[0]: row[1] for row in work_dist}

    return {
        "total_users": total_users,
        "active_policies": active_policies,
        "total_claims": total_claims,
        "total_payout": round(float(total_payout), 2),
        "fraud_count": fraud_count,
        "fraud_rate": fraud_rate,
        "paid_claims": paid_claims,
        "pending_claims": pending_claims,
        "rejected_claims": rejected_claims,
        "approved_claims": approved_claims,
        "total_premium_collected": round(float(total_premium), 2),
        "total_coverage_liability": round(float(total_coverage), 2),
        "claims_by_event": claims_by_event,
        "claims_by_status": claims_by_status,
        "users_by_location": users_by_location,
        "users_by_platform": users_by_platform,
    }


# ---------- FRAUD MONITORING ----------

@router.get("/fraud-alerts")
def get_fraud_alerts(db: Session = Depends(get_db)):
    flagged = (
        db.query(Claim)
        .filter(Claim.fraud_flag == True)
        .order_by(Claim.id.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "user_id": c.user_id,
            "username": c.user.username if c.user else "N/A",
            "event_type": c.event_type,
            "amount": c.amount,
            "status": c.status,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in flagged
    ]


# ---------- EVENT MONITORING ----------

@router.get("/events")
def get_events(db: Session = Depends(get_db)):
    events = db.query(EventLog).order_by(EventLog.id.desc()).limit(100).all()
    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "description": e.description,
            "severity": e.severity,
            "claims_triggered": e.claims_triggered,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
        }
        for e in events
    ]


# ---------- SYSTEM CONTROL ----------

@router.get("/system-config")
def get_system_config(db: Session = Depends(get_db)):
    configs = db.query(SystemConfig).all()
    result = {c.key: c.value for c in configs}
    # Defaults if missing
    defaults = {
        "trigger_enabled": "true",
        "event_probability": "0.25",
        "trigger_interval": "30",
        "rain_threshold": "50",
    }
    for k, v in defaults.items():
        if k not in result:
            result[k] = v
    return result


class ConfigUpdate(BaseModel):
    key: str
    value: str


@router.post("/system-config")
def update_system_config(req: ConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(SystemConfig).filter(SystemConfig.key == req.key).first()
    if config:
        config.value = req.value
        config.updated_at = datetime.now(timezone.utc)
    else:
        config = SystemConfig(key=req.key, value=req.value)
        db.add(config)
    db.commit()
    return {"message": f"Config '{req.key}' updated to '{req.value}'"}


# ---------- PAYMENT MONITORING ----------

@router.get("/payments")
def get_all_payments(db: Session = Depends(get_db)):
    payments = db.query(Payment).order_by(Payment.id.desc()).all()
    return [
        {
            "id": p.id,
            "claim_id": p.claim_id,
            "amount": p.amount,
            "status": p.status,
            "paid_at": p.paid_at.isoformat() if p.paid_at else None,
        }
        for p in payments
    ]
