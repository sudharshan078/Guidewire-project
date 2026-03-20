from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User

router = APIRouter(prefix="/ai", tags=["AI Risk Engine"])

# ---------- Rule-based risk tables ----------

LOCATION_RISK = {
    "mumbai": 0.85,
    "delhi": 0.70,
    "chennai": 0.80,
    "bangalore": 0.45,
    "kolkata": 0.75,
    "hyderabad": 0.50,
    "pune": 0.55,
    "ahmedabad": 0.40,
    "jaipur": 0.35,
    "lucknow": 0.60,
}

WORK_TYPE_RISK = {
    "zomato": 0.70,
    "swiggy": 0.70,
    "amazon": 0.60,
    "flipkart": 0.60,
    "uber": 0.65,
    "ola": 0.65,
    "dunzo": 0.55,
    "blinkit": 0.50,
    "rapido": 0.75,
    "porter": 0.45,
}

BASE_PREMIUM = 49.0   # ₹49 base weekly
MAX_PREMIUM = 199.0   # ₹199 cap


def calculate_risk(location: str, work_type: str):
    loc_score = LOCATION_RISK.get(location.lower(), 0.50)
    work_score = WORK_TYPE_RISK.get(work_type.lower(), 0.50)

    # Weighted combination
    risk_score = round(loc_score * 0.6 + work_score * 0.4, 2)

    if risk_score >= 0.70:
        risk_level = "HIGH"
    elif risk_score >= 0.45:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    weekly_premium = round(BASE_PREMIUM + (risk_score * (MAX_PREMIUM - BASE_PREMIUM)), 2)

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "weekly_premium": weekly_premium,
        "location_factor": loc_score,
        "work_type_factor": work_score,
    }


@router.get("/risk/{user_id}")
def get_risk(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.location or not user.work_type:
        raise HTTPException(status_code=400, detail="Please complete your profile first")

    result = calculate_risk(user.location, user.work_type)
    result["user_id"] = user.id
    result["location"] = user.location
    result["work_type"] = user.work_type
    return result
