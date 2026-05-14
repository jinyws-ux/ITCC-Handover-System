from __future__ import annotations

from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db
from seed import seed_database
from auth import current_user
from services.dashboard_service import dashboard_payload
from routes.auth_routes import register_auth_routes
from routes.task_routes import register_task_routes
from routes.calendar_routes import register_calendar_routes
from routes.timeline_routes import register_timeline_routes
from routes.admin_routes import register_admin_routes
from routes.hypercare_routes import register_hypercare_routes


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, supports_credentials=True)
    db.init_app(app)

    @app.get('/api/health')
    def health():
        return jsonify({'status': 'ok', 'time': datetime.utcnow().isoformat() + 'Z'})

    @app.post('/api/init-db')
    def init_db():
        db.drop_all(); db.create_all(); seed_database(); return jsonify({'status': 'ok', 'message': 'Database initialized with seed data.'})

    @app.get('/api/dashboard')
    def dashboard():
        return jsonify(dashboard_payload(current_user()))

    @app.get('/')
    def index():
        return jsonify({'name': 'ITCC Handover System API', 'status': 'running'})

    register_auth_routes(app)
    register_task_routes(app)
    register_calendar_routes(app)
    register_timeline_routes(app)
    register_admin_routes(app)
    register_hypercare_routes(app)
    return app


app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all(); seed_database()
    app.run(debug=True, host='127.0.0.1', port=5000)
