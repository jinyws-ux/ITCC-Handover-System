from datetime import datetime
from flask import jsonify, request
from auth import current_user
from extensions import db
from models import Task, TaskLog, TaskExternalLink
from serializers import serialize_task_card, serialize_task_detail
from services.task_service import apply_task_filters, next_task_no


def register_task_routes(app):
    @app.get('/api/tasks')
    def list_tasks():
        tasks = apply_task_filters(Task.query).order_by(Task.updated_at.desc()).all()
        return jsonify({'items': [serialize_task_card(x) for x in tasks], 'total': len(tasks)})

    @app.post('/api/tasks')
    def create_task():
        user = current_user(); payload = request.get_json(silent=True) or {}
        title = str(payload.get('title','')).strip()
        if not title: return jsonify({'message':'Title is required.'}), 400
        task = Task(task_no=next_task_no(), title=title, task_type=str(payload.get('taskType','Internal')).strip() or 'Internal', source_type=str(payload.get('sourceType','Manual')).strip() or 'Manual', priority=str(payload.get('priority','None')).strip() or 'None', status=str(payload.get('status','Open')).strip() or 'Open', handover_category=str(payload.get('handoverCategory','Notice')).strip() or 'Notice', description=str(payload.get('description','')).strip(), next_action=str(payload.get('nextAction','')).strip(), factory_id=payload.get('factoryId') or None, system_id=payload.get('systemId') or None, target_shift_id=payload.get('targetShiftId') or None, target_group_id=payload.get('targetGroupId') or None, is_monitoring=bool(payload.get('isMonitoring',False)), need_ack=bool(payload.get('needAck',False)), is_e_to_d1=bool(payload.get('isED1',False)), created_by=user.id if user else None, updated_by=user.id if user else None)
        db.session.add(task); db.session.add(TaskLog(task=task, log_type='Create', content='Task created from handover system.', new_status=task.status, created_by=user.id if user else None)); db.session.commit(); return jsonify(serialize_task_detail(task)), 201

    @app.get('/api/tasks/<int:task_id>')
    def get_task(task_id): return jsonify(serialize_task_detail(Task.query.get_or_404(task_id)))
    

    @app.post('/api/tasks/<int:task_id>/external-links')
    def add_external_link(task_id):
        user = current_user(); task = Task.query.get_or_404(task_id); payload = request.get_json(silent=True) or {}
        et = str(payload.get('externalType','')).strip(); eid = str(payload.get('externalId','')).strip(); etitle = str(payload.get('externalTitle','')).strip(); eurl = str(payload.get('externalUrl','')).strip()
        if not et: return jsonify({'message':'External type is required.'}), 400
        db.session.add(TaskExternalLink(task=task, external_type=et, external_id=eid, external_title=etitle, external_url=eurl, external_status=str(payload.get('externalStatus','')).strip(), created_by=user.id if user else None))
        db.session.add(TaskLog(task=task, log_type='External Link', content=f'Added {et} reference {eid or etitle or eurl}.', created_by=user.id if user else None))
        db.session.commit(); return jsonify(serialize_task_detail(task))

    @app.post('/api/tasks/<int:task_id>/status')
    def update_task_status(task_id):
        user = current_user(); task = Task.query.get_or_404(task_id); payload = request.get_json(silent=True) or {}; ns = str(payload.get('status','')).strip()
        if not ns: return jsonify({'message':'Status is required.'}), 400
        old = task.status; task.status = ns; task.updated_by = user.id if user else task.updated_by
        db.session.add(TaskLog(task=task, log_type='Status', content=f'Status changed from {old} to {ns}.', old_status=old, new_status=ns, created_by=user.id if user else None)); db.session.commit(); return jsonify(serialize_task_detail(task))

    @app.post('/api/tasks/<int:task_id>/logs')
    def add_task_log(task_id):
        user=current_user(); task=Task.query.get_or_404(task_id); c=str((request.get_json(silent=True) or {}).get('content','')).strip();
        if not c: return jsonify({'message':'Content is required.'}),400
        db.session.add(TaskLog(task=task, log_type='Note', content=c, created_by=user.id if user else None)); db.session.commit(); return jsonify(serialize_task_detail(task))
