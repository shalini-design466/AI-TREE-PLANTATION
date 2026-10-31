from datetime import datetime, timedelta, timezone
import base64
import hashlib
import hmac
import os
import secrets
import time
import uuid
from pathlib import Path
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from database import User, get_db

def _load_secret_key() -> str:
    """Use ARANYA_SECRET_KEY if set; otherwise create a random key once and keep it
    in a local file, so there is never a hardcoded/public secret and logins still
    survive a restart."""
    env_key = os.environ.get("ARANYA_SECRET_KEY")
    if env_key:
        return env_key
    key_file = Path(__file__).parent / ".aranya_secret"
    try:
        if key_file.exists():
            saved = key_file.read_text(encoding="utf-8").strip()
            if len(saved) >= 32:
                return saved
        new_key = secrets.token_urlsafe(48)
        key_file.write_text(new_key, encoding="utf-8")
        return new_key
    except OSError:
        return secrets.token_urlsafe(48)  # read-only folder: random per run

SECRET_KEY = _load_secret_key()
ALGORITHM = "HS256"
TOKEN_MINUTES = 120
bearer = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return "scrypt$16384$8$1$" + base64.urlsafe_b64encode(salt).decode() + "$" + base64.urlsafe_b64encode(digest).decode()

def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, n, r, p, salt_b64, digest_b64 = encoded.split("$")
        if algorithm != "scrypt":
            return False
        salt = base64.urlsafe_b64decode(salt_b64.encode())
        expected = base64.urlsafe_b64decode(digest_b64.encode())
        actual = hashlib.scrypt(password.encode(), salt=salt, n=int(n), r=int(r), p=int(p))
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False

# Tokens that were logged out (token id -> expiry time). Kept in memory, so it
# resets when the server restarts; entries are dropped once the token expires.
_REVOKED = {}

def _purge_revoked() -> None:
    now = time.time()
    for jti in [j for j, exp in _REVOKED.items() if exp <= now]:
        _REVOKED.pop(jti, None)

def create_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": str(user_id), "jti": uuid.uuid4().hex, "iat": now, "exp": now + timedelta(minutes=TOKEN_MINUTES)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def revoke_token(credentials: HTTPAuthorizationCredentials | None) -> None:
    """Invalidate the token used for this request (called on logout)."""
    if not credentials:
        return
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return
    jti = payload.get("jti")
    if jti:
        _purge_revoked()
        _REVOKED[jti] = float(payload.get("exp", time.time() + TOKEN_MINUTES * 60))

def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
        if payload.get("jti") in _REVOKED:
            raise ValueError("revoked")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
