from datetime import date, datetime
from flask import jsonify, request
from auth import require_admin
from extensions import db
from models import HypercareCheck, Schedule, Shift
from serializers import format_dt


def serialize_schedule(schedule: Schedule) -> dict:
    return {'id': schedule.id, 'date': format_dt(schedule.work_date), 'shift': schedule.shift.code if schedule.shift else '-', 'shiftId': schedule.shift_id, 'group': schedule.group.name if schedule.group else '-', 'groupId': schedule.group_id, 'startTime': schedule.start_time, 'endTime': schedule.end_time, 'members': schedule.members_text, 'remark': schedule.remark}


def serialize_hypercare(check: HypercareCheck) -> dict:
    task = check.task
    return {'id': check.id, 'date': check.check_time.date().isoformat(), 'time': check.check_time.strftime('%H:%M'), 'taskId': task.id, 'taskNo': task.task_no, 'title': task.title, 'checkItem': check.check_item, 'expectedResult': check.expected_result, 'status': check.check_status, 'system': task.system.name if task.system else '-', 'factory': task.factory.name if task.factory else '-'}


def register_calendar_routes(app):
    @app.get('/api/calendar-rich')
    def calendar_rich():
        month = request.args.get('month') or date.today().strftime('%Y-%m')
        start = datetime.strptime(month + '-01', '%Y-%m-%d').date(); end = date(start.year + (1 if start.month == 12 else 0), 1 if start.month == 12 else start.month + 1, 1)
        schedule_items = [serialize_schedule(x) for x in Schedule.query.filter(Schedule.work_date >= start, Schedule.work_date < end).order_by(Schedule.work_date.asc(), Schedule.shift_id.asc()).all()]
        today = date.today(); hypercare_start = max(start, today)
        hypercare_items = [serialize_hypercare(x) for x in HypercareCheck.query.filter(HypercareCheck.check_time >= datetime.combine(hypercare_start, datetime.min.time()), HypercareCheck.check_time < datetime.combine(end, datetime.min.time())).order_by(HypercareCheck.check_time.asc()).all()]
        by_date = {}
        for item in schedule_items: by_date.setdefault(item['date'], {'schedules': [], 'hypercare': []})['schedules'].append(item)
        for item in hypercare_items: by_date.setdefault(item['date'], {'schedules': [], 'hypercare': []})['hypercare'].append(item)
        return jsonify({'items': schedule_items, 'hypercare': hypercare_items, 'byDate': by_date})

    @app.post('/api/admin/schedules')
    def admin_create_schedule():
        user, error = require_admin()
        if error: return error
        payload = request.get_json(silent=True) or {}
        work_date = datetime.strptime(str(payload.get('workDate','')).strip(), '%Y-%m-%d').date()
        shift = Shift.query.get(payload.get('shiftId'))
        schedule = Schedule(work_date=work_date, shift_id=payload.get('shiftId'), group_id=payload.get('groupId'), start_time=str(payload.get('startTime') or shift.default_start_time), end_time=str(payload.get('endTime') or shift.default_end_time), members_text=str(payload.get('members','')).strip(), remark=str(payload.get('remark','')).strip(), created_by=user.id if user else None)
        db.session.add(schedule); db.session.commit(); return jsonify(serialize_schedule(schedule)), 201
