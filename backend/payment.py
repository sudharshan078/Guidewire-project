from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Claim, Payment
from datetime import datetime, timezone

router = APIRouter(prefix="/payment", tags=["Payment"])


@router.post("/process/{claim_id}")
def process_payment(claim_id: int, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.status != "APPROVED":
        raise HTTPException(status_code=400, detail=f"Claim is {claim.status}, not APPROVED")

    # Check if already paid
    existing_payment = db.query(Payment).filter(Payment.claim_id == claim_id).first()
    if existing_payment:
        raise HTTPException(status_code=400, detail="Payment already processed")

    payment = Payment(
        claim_id=claim.id,
        amount=claim.amount,
        status="PROCESSED",
        paid_at=datetime.now(timezone.utc),
    )
    db.add(payment)

    claim.status = "PAID"
    db.commit()
    db.refresh(payment)

    return {
        "message": "Payment processed successfully",
        "payment_id": payment.id,
        "claim_id": claim.id,
        "amount": payment.amount,
        "status": payment.status,
        "paid_at": payment.paid_at.isoformat(),
    }
