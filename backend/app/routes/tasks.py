from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import Task, User, db

tasks_bp = Blueprint("tasks", __name__)

ALLOWED_STATUSES = {"pending", "in_progress", "completed"}


def current_user():
    user_id = get_jwt_identity()
    return db.session.get(User, int(user_id))


def task_query_for(user):
    query = Task.query
    if user.role != "admin":
        query = query.filter_by(user_id=user.id)
    return query


def _json_body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, (jsonify({"message": "Request body must be JSON"}), 400)
    return data, None


@tasks_bp.get("/tasks")
@jwt_required()
def get_tasks():
    user = current_user()
    tasks = task_query_for(user).order_by(Task.created_at.desc()).all()
    return jsonify([task.to_dict() for task in tasks]), 200


@tasks_bp.post("/tasks")
@jwt_required()
def create_task():
    user = current_user()
    data, error = _json_body()
    if error:
        return error

    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    status = (data.get("status") or "pending").strip()
    owner_id = data.get("user_id") if user.role == "admin" else user.id

    if not title:
        return jsonify({"message": "Title is required"}), 400
    if status not in ALLOWED_STATUSES:
        return jsonify({"message": "Invalid task status"}), 400
    if not db.session.get(User, owner_id):
        return jsonify({"message": "Task owner not found"}), 404

    task = Task(title=title, description=description, status=status, user_id=owner_id)
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@tasks_bp.put("/tasks/<int:task_id>")
@jwt_required()
def update_task(task_id):
    user = current_user()
    task = task_query_for(user).filter_by(id=task_id).first()
    if not task:
        return jsonify({"message": "Task not found"}), 404

    data, error = _json_body()
    if error:
        return error

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"message": "Title cannot be empty"}), 400
        task.title = title
    if "description" in data:
        task.description = (data.get("description") or "").strip()
    if "status" in data:
        status = (data.get("status") or "").strip()
        if status not in ALLOWED_STATUSES:
            return jsonify({"message": "Invalid task status"}), 400
        task.status = status
    if "user_id" in data and user.role == "admin":
        if not db.session.get(User, data["user_id"]):
            return jsonify({"message": "Task owner not found"}), 404
        task.user_id = data["user_id"]

    db.session.commit()
    return jsonify(task.to_dict()), 200


@tasks_bp.delete("/tasks/<int:task_id>")
@jwt_required()
def delete_task(task_id):
    user = current_user()
    task = task_query_for(user).filter_by(id=task_id).first()
    if not task:
        return jsonify({"message": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted successfully"}), 200
