from datetime import date, datetime
from auth import serialize_user
from models import HypercareCheck, Task
from serializers import serialize_task_card


def dashboard_payload(user=None):
    tasks = Task.query.order_by(Task.updated_at.desc()).all()
    waiting_next_shift = [x for x in tasks if x.status == 'Waiting Next Shift']
    monitoring = [x for x in tasks if x.is_monitoring or x.status == 'Monitoring']
    notice_only = [x for x in tasks if x.handover_category == 'Notice']
    need_confirmation = [x for x in tasks if x.need_ack or x.is_e_to_d1]
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())
    hypercare_ids = {x.task_id for x in HypercareCheck.query.filter(HypercareCheck.check_time >= today_start, HypercareCheck.check_time <= today_end).all()}
    today_hypercare = [x for x in tasks if x.id in hypercare_ids]
    return {'currentDate': date.today().isoformat(), 'currentShift': {'code': 'D2', 'time': '09:30 - 18:00', 'group': 'Group B'}, 'nextShift': {'code': 'E', 'time': '17:00 - 03:00', 'group': 'Group C'}, 'user': serialize_user(user) if user else {'displayName': 'Guest', 'role': 'guest', 'group': '-'}, 'sections': {'waitingNextShift': [serialize_task_card(x) for x in waiting_next_shift], 'monitoring': [serialize_task_card(x) for x in monitoring], 'noticeOnly': [serialize_task_card(x) for x in notice_only], 'todayHypercare': [serialize_task_card(x) for x in today_hypercare], 'needConfirmation': [serialize_task_card(x) for x in need_confirmation], 'recentlyUpdated': [serialize_task_card(x) for x in tasks]}}
