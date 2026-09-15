from functools import wraps
from flask import request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta, timezone
from .models import User


def make_token(user):
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def verify_token():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None, (jsonify({"error": "Authorization token is required"}), 401)
    token = header.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
        user = User.query.get(payload["sub"])
        if not user:
            raise ValueError("User not found")
        return user, None
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
        return None, (jsonify({"error": "Invalid or expired token"}), 401)


def login_user(email, password):
    user = User.query.filter_by(email=email.lower().strip()).first()
    if not user or not check_password_hash(user.password_hash, password):
        return None
    return user


def create_password_hash(password):
    return generate_password_hash(password)


def token_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user, error = verify_token()
        if error:
            return error
        return fn(user, *args, **kwargs)
    return wrapper


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        @token_required
        def wrapper(user, *args, **kwargs):
            if user.role not in roles:
                return jsonify({"error": "You do not have permission for this action"}), 403
            return fn(user, *args, **kwargs)
        return wrapper
    return decorator
