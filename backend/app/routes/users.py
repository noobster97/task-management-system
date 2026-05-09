from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import User, db

users_bp = Blueprint("users", __name__)


@users_bp.get("/users")
@jwt_required()
def get_users():
    current_user = db.session.get(User, int(get_jwt_identity()))
    if not current_user or current_user.role != "admin":
        return jsonify({"message": "Admin access required"}), 403

    users = User.query.order_by(User.email.asc()).all()
    return jsonify([user.to_dict() for user in users]), 200
