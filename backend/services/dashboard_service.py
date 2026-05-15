from datetime import date, datetime, time, timedelta
from auth import serialize_user
from models import HypercareCheck, Schedule, Task
from serializers import format_dt, serialize_task_card


def _parse_hhmm(v: str) -> time:
    hh, mm = (v or '03:00').split(':')[:2]
    return time(int(hh), int(mm))


def business_window(business_date: date):
    start = datetime.combine(business_date, time(6, 0))
    default_end = datetime.combine(business_date + timedelta(days=1), time(3, 0))
    e_shift = Schedule.query.filter(Schedule.work_date == business_date).join(Schedule.shift).filter_by(code='E').order_by(Schedule.id.desc()).first()
    if not e_shift:
        return start, default_end
    end_t = _parse_hhmm(e_shift.end_time)
    end = datetime.combine(business_date + timedelta(days=1), end_t)
    return start, end


def dashboard_payload_v2(user=None, business_date: date | None = None):
    d = business_date or date.today()
    b_start, b_end = business_window(d)

    tasks = Task.query.order_by(Task.updated_at.desc()).all()
    completed = [x for x in tasks if x.status == 'Closed' and x.closed_at and b_start <= x.closed_at <= b_end]
    active = [x for x in tasks if x.status != 'Closed']

    action_required = [x for x in active if x.status == 'Waiting Next Shift' or x.handover_category == 'Action Required']
    monitoring = [x for x in active if x.is_monitoring or x.status == 'Monitoring']

    hypercare_checks = HypercareCheck.query.filter(HypercareCheck.check_time >= b_start, HypercareCheck.check_time <= b_end).order_by(HypercareCheck.check_time.asc()).all()
    hypercare_task_ids = {x.task_id for x in hypercare_checks}
    hypercare_tasks = [x for x in active if x.id in hypercare_task_ids]

    return {
        'businessDate': d.isoformat(),
        'businessStart': format_dt(b_start),
        'businessEnd': format_dt(b_end),
        'currentShift': {'code': 'D2', 'time': '09:30 - 18:00', 'group': 'Group B'},
        'nextShift': {'code': 'E', 'time': '17:00 - 03:00', 'group': 'Group C'},
        'user': serialize_user(user) if user else {'displayName': 'Guest', 'role': 'guest', 'group': '-'},
        'summary': {
            'actionRequired': len(action_required),
            'monitoring': len(monitoring),
            'hypercareToday': len(hypercare_tasks),
            'completedToday': len(completed),
            'criticalHigh': len([x for x in active if x.priority in {'Critical', 'High'}]),
        },
        'sections': {
            'actionRequired': [serialize_task_card(x) for x in action_required],
            'monitoring': [serialize_task_card(x) for x in monitoring],
            'hypercare': [serialize_task_card(x) for x in hypercare_tasks],
            'completed': [serialize_task_card(x) for x in completed],
        },
    }


def dashboard_payload(user=None):
    # backward compatibility for existing /api/dashboard callers
    d = dashboard_payload_v2(user)
    return {
        'currentDate': d['businessDate'],
        'currentShift': d['currentShift'],
        'nextShift': d['nextShift'],
        'user': d['user'],
        'sections': {
            'waitingNextShift': d['sections']['actionRequired'],
            'monitoring': d['sections']['monitoring'],
            'todayHypercare': d['sections']['hypercare'],
            'completed': d['sections']['completed'],
        },
    }
