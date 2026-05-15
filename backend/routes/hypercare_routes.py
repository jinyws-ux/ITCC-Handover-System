from __future__ import annotations

from datetime import date, datetime
from flask import jsonify, request

from extensions import db
from models import HypercareCheck, Task, TaskLog
from serializers import format_dt, serialize_task_card, serialize_task_detail


from auth import current_user
from services.task_service import apply_task_filters

def parse_check_time(value: str) -> datetime:
    raw = str(value or "").strip().replace("T", " ")
    for pattern in ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            parsed = datetime.strptime(raw, pattern)
            if pattern == "%Y-%m-%d":
                return datetime.combine(parsed.date(), datetime.min.time())
            return parsed
        except ValueError:
            pass
    raise ValueError("Invalid check time format. Use YYYY-MM-DD HH:mm.")


def serialize_hypercare(check: HypercareCheck) -> dict:
    task = check.task
    return {
        "id": check.id,
        "taskId": task.id,
        "taskNo": task.task_no,
        "title": task.title,
        "checkTime": format_dt(check.check_time),
        "date": check.check_time.date().isoformat(),
        "time": check.check_time.strftime("%H:%M"),
        "checkItem": check.check_item,
        "expectedResult": check.expected_result,
        "actualResult": check.actual_result,
        "status": check.check_status,
        "checkedAt": format_dt(check.checked_at),
        "remark": check.remark,
        "system": task.system.name if task.system else "-",
        "factory": task.factory.name if task.factory else "-",
    }


def serialize_timeline_event(event_type: str, event_time: datetime, task: Task, content: str, log_type: str = "") -> dict:
    return {
        "eventType": event_type,
        "eventTime": event_time.isoformat(),
        "task": serialize_task_card(task),
        "content": content,
        "logType": log_type,
        "externalLinks": [
            {
                "type": link.external_type,
                "id": link.external_id,
                "title": link.external_title,
                "status": link.external_status,
                "url": link.external_url,
            }
            for link in task.external_links
        ],
    }


def register_hypercare_routes(app):
    @app.get("/api/tasks/<int:task_id>/hypercare-checks")
    def list_task_hypercare_checks(task_id: int):
        task = Task.query.get_or_404(task_id)
        checks = HypercareCheck.query.filter_by(task_id=task.id).order_by(HypercareCheck.check_time.asc()).all()
        return jsonify({"items": [serialize_hypercare(check) for check in checks]})

    @app.post("/api/tasks/<int:task_id>/hypercare-checks")
    def create_task_hypercare_check(task_id: int):
        user = current_user()
        task = Task.query.get_or_404(task_id)
        payload = request.get_json(silent=True) or {}
        check_item = str(payload.get("checkItem", "")).strip()
        if not check_item:
            return jsonify({"message": "Check item is required."}), 400
        try:
            check_time = parse_check_time(str(payload.get("checkTime", "")))
        except ValueError as exc:
            return jsonify({"message": str(exc)}), 400
        check = HypercareCheck(
            task=task,
            check_time=check_time,
            check_item=check_item,
            expected_result=str(payload.get("expectedResult", "")).strip(),
            check_status=str(payload.get("status", "Planned")).strip() or "Planned",
            remark=str(payload.get("remark", "")).strip(),
        )
        task.task_type = "Hypercare" if task.task_type in {"Internal", "WO"} else task.task_type
        task.is_monitoring = True
        db.session.add(check)
        db.session.add(TaskLog(
            task=task,
            log_type="Hypercare",
            content=f"Hypercare check planned at {format_dt(check_time)}: {check_item}",
            created_by=user.id if user else None,
        ))
        task.updated_by = user.id if user else task.updated_by
        db.session.commit()
        return jsonify(serialize_task_detail(task)), 201

    @app.post("/api/hypercare-checks/<int:check_id>/status")
    def update_hypercare_check_status(check_id: int):
        user = current_user()
        check = HypercareCheck.query.get_or_404(check_id)
        payload = request.get_json(silent=True) or {}
        status = str(payload.get("status", "")).strip()
        if not status:
            return jsonify({"message": "Status is required."}), 400
        check.check_status = status
        check.actual_result = str(payload.get("actualResult", check.actual_result or "")).strip()
        check.remark = str(payload.get("remark", check.remark or "")).strip()
        if status in {"Done", "OK", "NG", "Skipped"}:
            check.checked_at = datetime.utcnow()
            check.checked_by = user.id if user else None
        db.session.add(TaskLog(
            task=check.task,
            log_type="Hypercare",
            content=f"Hypercare check status changed to {status}: {check.check_item}",
            created_by=user.id if user else None,
        ))
        check.task.updated_by = user.id if user else check.task.updated_by
        db.session.commit()
        return jsonify(serialize_task_detail(check.task))

    @app.get("/api/hypercare-checks")
    def list_hypercare_checks():
        month = request.args.get("month") or date.today().strftime("%Y-%m")
        try:
            start = datetime.strptime(month + "-01", "%Y-%m-%d").date()
            end = date(start.year + (1 if start.month == 12 else 0), 1 if start.month == 12 else start.month + 1, 1)
        except ValueError:
            return jsonify({"message": "Invalid month format. Use YYYY-MM."}), 400
        checks = HypercareCheck.query.filter(
            HypercareCheck.check_time >= datetime.combine(max(start, date.today()), datetime.min.time()),
            HypercareCheck.check_time < datetime.combine(end, datetime.min.time()),
        ).order_by(HypercareCheck.check_time.asc()).all()
        return jsonify({"items": [serialize_hypercare(check) for check in checks]})

    @app.get("/api/timeline-rich-v2")
    def timeline_rich_v2():
        tasks = apply_task_filters(Task.query).order_by(Task.updated_at.desc()).all()
        events = []
        for task in tasks:
            events.append(serialize_timeline_event("task_updated", task.updated_at, task, task.next_action or task.description or "Task updated", "Task"))
            for log in task.logs:
                events.append(serialize_timeline_event("log", log.created_at, task, log.content, log.log_type))
            for handover in task.handovers:
                events.append(serialize_timeline_event("handover", handover.handed_over_at, task, handover.handover_note or "Handover recorded", "Handover"))
            for link in task.external_links:
                events.append(serialize_timeline_event("external", link.created_at, task, f"{link.external_type}: {link.external_id or link.external_title or link.external_url}", "External"))
            for check in task.hypercare_checks:
                events.append(serialize_timeline_event("hypercare", check.check_time, task, f"{check.check_item} / {check.expected_result or '-'} / {check.check_status}", "Hypercare"))
        events.sort(key=lambda item: item["eventTime"], reverse=True)
        return jsonify({"items": [serialize_task_card(task) for task in tasks], "events": events[:300], "total": len(tasks)})
