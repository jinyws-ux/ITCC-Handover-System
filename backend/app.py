from __future__ import annotations

from datetime import date, datetime
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db
from models import HypercareCheck, Task
from seed import seed_database
from serializers import serialize_task_card, serialize_task_detail


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)
    db.init_app(app)

    register_routes(app)
    return app


def register_routes(app: Flask) -> None:
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "time": datetime.utcnow().isoformat() + "Z"})

    @app.post("/api/init-db")
    def init_db():
        db.drop_all()
        db.create_all()
        seed_database()
        return jsonify({"status": "ok", "message": "Database initialized with seed data."})

    @app.get("/api/dashboard")
    def dashboard():
        tasks = Task.query.order_by(Task.updated_at.desc()).all()
        waiting_next_shift = [task for task in tasks if task.status == "Waiting Next Shift"]
        monitoring = [task for task in tasks if task.is_monitoring or task.status == "Monitoring"]
        notice_only = [task for task in tasks if task.handover_category == "Notice"]
        need_confirmation = [task for task in tasks if task.need_ack or task.is_e_to_d1]

        today_start = datetime.combine(date(2026, 5, 14), datetime.min.time())
        today_end = datetime.combine(date(2026, 5, 14), datetime.max.time())
        hypercare_task_ids = {
            check.task_id
            for check in HypercareCheck.query.filter(
                HypercareCheck.check_time >= today_start,
                HypercareCheck.check_time <= today_end,
            ).all()
        }
        today_hypercare = [task for task in tasks if task.id in hypercare_task_ids]

        return jsonify(
            {
                "currentDate": "2026-05-14",
                "currentShift": {"code": "D2", "time": "09:30 - 18:00", "group": "Group B"},
                "nextShift": {"code": "E", "time": "17:00 - 03:00", "group": "Group C"},
                "user": {"displayName": "Demo User", "role": "admin", "group": "Group B"},
                "sections": {
                    "waitingNextShift": [serialize_task_card(task) for task in waiting_next_shift],
                    "monitoring": [serialize_task_card(task) for task in monitoring],
                    "noticeOnly": [serialize_task_card(task) for task in notice_only],
                    "todayHypercare": [serialize_task_card(task) for task in today_hypercare],
                    "needConfirmation": [serialize_task_card(task) for task in need_confirmation],
                    "recentlyUpdated": [serialize_task_card(task) for task in tasks],
                },
            }
        )

    @app.get("/api/tasks")
    def list_tasks():
        tasks = Task.query.order_by(Task.updated_at.desc()).all()
        return jsonify({"items": [serialize_task_card(task) for task in tasks], "total": len(tasks)})

    @app.get("/api/tasks/<int:task_id>")
    def get_task(task_id: int):
        task = Task.query.get_or_404(task_id)
        return jsonify(serialize_task_detail(task))

    @app.get("/")
    def index():
        return jsonify({"name": "ITCC Handover System API", "status": "running"})


app = create_app()


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        seed_database()
    app.run(debug=True, host="127.0.0.1", port=5000)
