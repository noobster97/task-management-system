import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from .config import Config
from .models import db
from .routes.auth import auth_bp
from .routes.tasks import tasks_bp
from .routes.users import users_bp

jwt = JWTManager()


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    CORS(app, resources={r"/*": {"origins": app.config["CORS_ORIGINS"]}})
    db.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(tasks_bp)
    app.register_blueprint(users_bp)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"message": getattr(error, "description", "Bad request")}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"message": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"message": "Internal server error"}), 500

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"message": "Authentication required"}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"message": "Invalid token"}), 422

    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):
        return jsonify({"message": "Token expired"}), 401

    with app.app_context():
        if os.getenv("AUTO_CREATE_TABLES", "true").lower() == "true":
            db.create_all()

    return app
