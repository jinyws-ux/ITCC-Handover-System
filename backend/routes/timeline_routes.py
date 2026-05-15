from flask import jsonify
from models import Task
from serializers import serialize_task_card
from services.task_service import apply_task_filters


def register_timeline_routes(app):
    @app.get('/api/timeline')
    def timeline():
        tasks = apply_task_filters(Task.query).order_by(Task.updated_at.desc()).all()
        return jsonify({'items': [serialize_task_card(x) for x in tasks], 'total': len(tasks)})
