from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import User

router = APIRouter(prefix="/user", tags=["User Profile"])


class ProfileUpdate(BaseModel):
    location: str
    work_type: str


@router.get("/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "location": user.location,
        "work_type": user.work_type,
    }


@router.put("/profile/{user_id}")
def update_profile(user_id: int, req: ProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.location = req.location
    user.work_type = req.work_type
    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated",
        "user_id": user.id,
        "location": user.location,
        "work_type": user.work_type,
    }
