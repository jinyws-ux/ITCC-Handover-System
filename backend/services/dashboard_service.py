from datetime import date, datetime
from auth import serialize_user
from models import HypercareCheck, Task
from serializers import serialize_task_card


def dashboard_payload(user=None):
    tasks = Task.query.order_by(Task.updated_at.desc()).all()
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    completed = [x for x in tasks if x.status == 'Closed' and x.updated_at and today_start <= x.updated_at <= today_end]
    active_tasks = [x for x in tasks if x.status != 'Closed']

    waiting_next_shift = [x for x in active_tasks if x.status == 'Waiting Next Shift' or x.handover_category == 'Action Required']
    monitoring = [x for x in active_tasks if x.is_monitoring or x.status == 'Monitoring']

    hypercare_ids = {x.task_id for x in HypercareCheck.query.filter(HypercareCheck.check_time >= today_start, HypercareCheck.check_time <= today_end).all()}
    today_hypercare = [x for x in active_tasks if x.id in hypercare_ids]

    return {
        'currentDate': today.isoformat(),
        'currentShift': {'code': 'D2', 'time': '09:30 - 18:00', 'group': 'Group B'},
        'nextShift': {'code': 'E', 'time': '17:00 - 03:00', 'group': 'Group C'},
        'user': serialize_user(user) if user else {'displayName': 'Guest', 'role': 'guest', 'group': '-'},
        'sections': {
            'waitingNextShift': [serialize_task_card(x) for x in waiting_next_shift],
            'monitoring': [serialize_task_card(x) for x in monitoring],
            'todayHypercare': [serialize_task_card(x) for x in today_hypercare],
            'completed': [serialize_task_card(x) for x in completed],
        },
    }
