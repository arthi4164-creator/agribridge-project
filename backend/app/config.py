"""
AgriBridge AI - Configuration
"""
import os
from pydantic import BaseModel

SECRET_KEY = os.getenv("SECRET_KEY", "agribridge_super_secure_jwt_secret_sih26033_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agribridge.db")
