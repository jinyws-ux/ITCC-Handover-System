from datetime import datetime
from flask import request
from models import Task


def next_task_no() -> str:
    today = datetime.utcnow().strftime('%Y%m%d')
    prefix = f'TASK-{today}-'
    count = Task.query.filter(Task.task_no.like(f'{prefix}%')).count() + 1
    return f'{prefix}{count:03d}'


def apply_task_filters(query):
    keyword = request.args.get('q')
    task_type = request.args.get('type')
    status = request.args.get('status')
    priority = request.args.get('priority')
    if keyword:
        like = f'%{keyword}%'
        query = query.filter(Task.title.ilike(like) | Task.task_no.ilike(like) | Task.description.ilike(like) | Task.next_action.ilike(like))
    if task_type:
        query = query.filter(Task.task_type == task_type)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    return query
