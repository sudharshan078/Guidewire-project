from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import User
import bcrypt
import jwt
import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])

SECRET_KEY = "guidewares-secret-key-2024"
ALGORITHM = "HS256"


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


def create_token(user_id: int, username: str, role: str = "user") -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def seed_admin(db: Session):
    """Create default admin user if not exists."""
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        hashed = bcrypt.hashpw("admin123".encode("utf-8"), bcrypt.gensalt())
        admin = User(
            username="admin",
            email="admin@guidewares.com",
            password_hash=hashed.decode("utf-8"),
            role="admin",
            location="mumbai",
            work_type="admin",
        )
        db.add(admin)
        db.commit()


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.username == req.username) | (User.email == req.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    hashed = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt())
    user = User(
        username=req.username,
        email=req.email,
        password_hash=hashed.decode("utf-8"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id, user.username, user.role)
    return {
        "message": "Registration successful",
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "token": token,
    }


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Account is blocked. Contact admin.")

    if not bcrypt.checkpw(req.password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user.id, user.username, user.role)
    return {
        "message": "Login successful",
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "token": token,
    }
