import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token

from ..models import User, db

auth_bp = Blueprint("auth", __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
ALLOWED_ROLES = {"user", "admin"}


def _json_body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, (jsonify({"message": "Request body must be JSON"}), 400)
    return data, None


@auth_bp.post("/register")
def register():
    data, error = _json_body()
    if error:
        return error

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "user").strip().lower()

    if not EMAIL_RE.match(email):
        return jsonify({"message": "Valid email is required"}), 400
    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400
    if role not in ALLOWED_ROLES:
        return jsonify({"message": "Role must be user or admin"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 409

    user = User(email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User registered successfully", "user": user.to_dict()}), 201


@auth_bp.post("/login")
def login():
    data, error = _json_body()
    if error:
        return error

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"message": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({"access_token": token, "user": user.to_dict()}), 200
