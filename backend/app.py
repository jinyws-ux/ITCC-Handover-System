from __future__ import annotations

from datetime import date, datetime
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

from config import Config
from extensions import db
from models import Factory, Group, Handover, HypercareCheck, Schedule, Shift, System, Task, TaskExternalLink, TaskLog, User
from seed import seed_database
from serializers import format_dt, serialize_task_card, serialize_task_detail


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, supports_credentials=True)
    db.init_app(app)
    register_routes(app)
    return app


def current_user() -> User | None:
    user_id = session.get("user_id")
    return User.query.get(user_id) if user_id else None


def require_admin() -> tuple[User | None, tuple | None]:
    user = current_user()
    if not user:
        return None, (jsonify({"message": "Login required."}), 401)
    if user.role != "admin":
        return user, (jsonify({"message": "Admin permission required."}), 403)
    return user, None


def serialize_user(user: User) -> dict:
    return {"id": user.id, "username": user.username, "displayName": user.display_name, "email": user.email, "role": user.role, "group": user.group.name if user.group else "-"}


def serialize_schedule(schedule: Schedule) -> dict:
    return {
        "id": schedule.id,
        "date": format_dt(schedule.work_date),
        "shift": schedule.shift.code if schedule.shift else "-",
        "shiftId": schedule.shift_id,
        "group": schedule.group.name if schedule.group else "-",
        "groupId": schedule.group_id,
        "startTime": schedule.start_time,
        "endTime": schedule.end_time,
        "members": schedule.members_text,
        "remark": schedule.remark,
    }


def meta_payload() -> dict:
    return {
        "groups": [{"id": item.id, "name": item.name, "description": item.description, "isActive": item.is_active} for item in Group.query.order_by(Group.name).all()],
        "shifts": [{"id": item.id, "code": item.code, "name": item.name, "defaultStartTime": item.default_start_time, "defaultEndTime": item.default_end_time, "description": item.description, "isActive": item.is_active} for item in Shift.query.order_by(Shift.id).all()],
        "factories": [{"id": item.id, "name": item.name, "code": item.code, "isActive": item.is_active} for item in Factory.query.order_by(Factory.name).all()],
        "systems": [{"id": item.id, "name": item.name, "code": item.code, "factoryId": item.factory_id, "factory": item.factory.name if item.factory else "-", "isActive": item.is_active} for item in System.query.order_by(System.name).all()],
        "users": [{"id": item.id, "displayName": item.display_name, "username": item.username, "email": item.email, "role": item.role, "groupId": item.group_id, "group": item.group.name if item.group else "-", "isActive": item.is_active} for item in User.query.order_by(User.display_name).all()],
    }


def next_task_no() -> str:
    today = datetime.utcnow().strftime("%Y%m%d")
    prefix = f"TASK-{today}-"
    count = Task.query.filter(Task.task_no.like(f"{prefix}%")).count() + 1
    return f"{prefix}{count:03d}"


def dashboard_payload(user: User | None = None) -> dict:
    tasks = Task.query.order_by(Task.updated_at.desc()).all()
    waiting_next_shift = [task for task in tasks if task.status == "Waiting Next Shift"]
    monitoring = [task for task in tasks if task.is_monitoring or task.status == "Monitoring"]
    notice_only = [task for task in tasks if task.handover_category == "Notice"]
    need_confirmation = [task for task in tasks if task.need_ack or task.is_e_to_d1]
    today_start = datetime.combine(date(2026, 5, 14), datetime.min.time())
    today_end = datetime.combine(date(2026, 5, 14), datetime.max.time())
    hypercare_task_ids = {check.task_id for check in HypercareCheck.query.filter(HypercareCheck.check_time >= today_start, HypercareCheck.check_time <= today_end).all()}
    today_hypercare = [task for task in tasks if task.id in hypercare_task_ids]
    return {
        "currentDate": "2026-05-14",
        "currentShift": {"code": "D2", "time": "09:30 - 18:00", "group": "Group B"},
        "nextShift": {"code": "E", "time": "17:00 - 03:00", "group": "Group C"},
        "user": serialize_user(user) if user else {"displayName": "Guest", "role": "guest", "group": "-"},
        "sections": {
            "waitingNextShift": [serialize_task_card(task) for task in waiting_next_shift],
            "monitoring": [serialize_task_card(task) for task in monitoring],
            "noticeOnly": [serialize_task_card(task) for task in notice_only],
            "todayHypercare": [serialize_task_card(task) for task in today_hypercare],
            "needConfirmation": [serialize_task_card(task) for task in need_confirmation],
            "recentlyUpdated": [serialize_task_card(task) for task in tasks],
        },
    }


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

    @app.post("/api/auth/login")
    def login():
        payload = request.get_json(silent=True) or {}
        username = str(payload.get("username", "")).strip()
        password = str(payload.get("password", ""))
        user = User.query.filter_by(username=username, is_active=True).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"message": "Invalid username or password."}), 401
        session["user_id"] = user.id
        return jsonify({"user": serialize_user(user)})

    @app.post("/api/auth/logout")
    def logout():
        session.clear()
        return jsonify({"status": "ok"})

    @app.get("/api/auth/me")
    def me():
        user = current_user()
        return jsonify({"user": serialize_user(user) if user else None})

    @app.get("/api/dashboard")
    def dashboard():
        return jsonify(dashboard_payload(current_user()))

    @app.get("/api/meta")
    def meta():
        return jsonify(meta_payload())

    @app.get("/api/tasks")
    def list_tasks():
        query = Task.query
        status = request.args.get("status")
        task_type = request.args.get("type")
        keyword = request.args.get("q")
        if status:
            query = query.filter(Task.status == status)
        if task_type:
            query = query.filter(Task.task_type == task_type)
        if keyword:
            like = f"%{keyword}%"
            query = query.filter(Task.title.ilike(like) | Task.task_no.ilike(like) | Task.description.ilike(like))
        tasks = query.order_by(Task.updated_at.desc()).all()
        return jsonify({"items": [serialize_task_card(task) for task in tasks], "total": len(tasks)})

    @app.post("/api/tasks")
    def create_task():
        user = current_user()
        payload = request.get_json(silent=True) or {}
        title = str(payload.get("title", "")).strip()
        if not title:
            return jsonify({"message": "Title is required."}), 400
        task = Task(
            task_no=next_task_no(),
            title=title,
            task_type=str(payload.get("taskType", "Internal")).strip() or "Internal",
            source_type=str(payload.get("sourceType", "Manual")).strip() or "Manual",
            priority=str(payload.get("priority", "None")).strip() or "None",
            status=str(payload.get("status", "Open")).strip() or "Open",
            handover_category=str(payload.get("handoverCategory", "Notice")).strip() or "Notice",
            description=str(payload.get("description", "")).strip(),
            next_action=str(payload.get("nextAction", "")).strip(),
            factory_id=payload.get("factoryId") or None,
            system_id=payload.get("systemId") or None,
            target_shift_id=payload.get("targetShiftId") or None,
            target_group_id=payload.get("targetGroupId") or None,
            owner_user_id=payload.get("ownerUserId") or None,
            owner_group_id=payload.get("ownerGroupId") or payload.get("targetGroupId") or None,
            is_monitoring=bool(payload.get("isMonitoring", False)) or str(payload.get("handoverCategory", "")) == "Monitoring",
            need_ack=bool(payload.get("needAck", False)),
            is_e_to_d1=bool(payload.get("isED1", False)),
            created_by=user.id if user else None,
            updated_by=user.id if user else None,
        )
        db.session.add(task)
        db.session.flush()
        for link in payload.get("externalLinks", []) or []:
            external_type = str(link.get("externalType", "")).strip()
            external_id = str(link.get("externalId", "")).strip()
            external_url = str(link.get("externalUrl", "")).strip()
            external_title = str(link.get("externalTitle", "")).strip()
            if external_type and (external_id or external_url or external_title):
                db.session.add(TaskExternalLink(task=task, external_type=external_type, external_id=external_id, external_title=external_title, external_url=external_url, external_status=str(link.get("externalStatus", "")).strip(), is_primary=bool(link.get("isPrimary", False)), created_by=user.id if user else None, remark=str(link.get("remark", "")).strip()))
        db.session.add(TaskLog(task=task, log_type="Create", content="Task created from handover system.", new_status=task.status, created_by=user.id if user else None))
        db.session.commit()
        return jsonify(serialize_task_detail(task)), 201

    @app.get("/api/tasks/<int:task_id>")
    def get_task(task_id: int):
        return jsonify(serialize_task_detail(Task.query.get_or_404(task_id)))

    @app.post("/api/tasks/<int:task_id>/external-links")
    def add_external_link(task_id: int):
        user = current_user()
        task = Task.query.get_or_404(task_id)
        payload = request.get_json(silent=True) or {}
        external_type = str(payload.get("externalType", "")).strip()
        external_id = str(payload.get("externalId", "")).strip()
        external_title = str(payload.get("externalTitle", "")).strip()
        external_url = str(payload.get("externalUrl", "")).strip()
        external_status = str(payload.get("externalStatus", "")).strip()
        remark = str(payload.get("remark", "")).strip()
        if not external_type:
            return jsonify({"message": "External type is required."}), 400
        if not (external_id or external_title or external_url):
            return jsonify({"message": "At least one external identifier, title, or URL is required."}), 400
        db.session.add(TaskExternalLink(task=task, external_type=external_type, external_id=external_id, external_title=external_title, external_url=external_url, external_status=external_status, is_primary=bool(payload.get("isPrimary", False)), created_by=user.id if user else None, remark=remark))
        db.session.add(TaskLog(task=task, log_type="External Link", content=f"Added {external_type} reference {external_id or external_title or external_url}.", created_by=user.id if user else None))
        task.updated_by = user.id if user else task.updated_by
        db.session.commit()
        return jsonify(serialize_task_detail(task))

    @app.post("/api/tasks/<int:task_id>/logs")
    def add_task_log(task_id: int):
        user = current_user()
        task = Task.query.get_or_404(task_id)
        payload = request.get_json(silent=True) or {}
        content = str(payload.get("content", "")).strip()
        if not content:
            return jsonify({"message": "Content is required."}), 400
        db.session.add(TaskLog(task=task, log_type=payload.get("logType", "Note"), content=content, created_by=user.id if user else None))
        task.updated_by = user.id if user else task.updated_by
        db.session.commit()
        return jsonify(serialize_task_detail(task))

    @app.post("/api/tasks/<int:task_id>/status")
    def update_task_status(task_id: int):
        user = current_user()
        task = Task.query.get_or_404(task_id)
        payload = request.get_json(silent=True) or {}
        new_status = str(payload.get("status", "")).strip()
        if not new_status:
            return jsonify({"message": "Status is required."}), 400
        old_status = task.status
        task.status = new_status
        task.updated_by = user.id if user else task.updated_by
        if new_status == "Closed":
            task.closed_at = datetime.utcnow()
            task.closed_by = user.id if user else task.closed_by
        db.session.add(TaskLog(task=task, log_type="Status", content=f"Status changed from {old_status} to {new_status}.", old_status=old_status, new_status=new_status, created_by=user.id if user else None))
        db.session.commit()
        return jsonify(serialize_task_detail(task))

    @app.post("/api/tasks/<int:task_id>/ack")
    def acknowledge_task(task_id: int):
        user = current_user()
        task = Task.query.get_or_404(task_id)
        handover = Handover.query.filter_by(task_id=task.id).order_by(Handover.handed_over_at.desc()).first()
        if handover:
            handover.acknowledged_by = user.id if user else None
            handover.acknowledged_at = datetime.utcnow()
            handover.status = "Acknowledged"
        db.session.add(TaskLog(task=task, log_type="Ack", content="Handover acknowledged.", created_by=user.id if user else None))
        db.session.commit()
        return jsonify(serialize_task_detail(task))

    @app.post("/api/tasks/<int:task_id>/accept")
    def accept_task(task_id: int):
        user = current_user()
        task = Task.query.get_or_404(task_id)
        handover = Handover.query.filter_by(task_id=task.id).order_by(Handover.handed_over_at.desc()).first()
        if handover:
            handover.accepted_by = user.id if user else None
            handover.accepted_at = datetime.utcnow()
            handover.status = "Accepted"
        task.status = "In Progress"
        db.session.add(TaskLog(task=task, log_type="Accept", content="Handover accepted and task moved to In Progress.", new_status="In Progress", created_by=user.id if user else None))
        db.session.commit()
        return jsonify(serialize_task_detail(task))

    @app.get("/api/timeline")
    def timeline():
        query = Task.query
        keyword = request.args.get("q")
        task_type = request.args.get("type")
        status = request.args.get("status")
        priority = request.args.get("priority")
        if keyword:
            like = f"%{keyword}%"
            query = query.filter(Task.title.ilike(like) | Task.task_no.ilike(like) | Task.description.ilike(like) | Task.next_action.ilike(like))
        if task_type:
            query = query.filter(Task.task_type == task_type)
        if status:
            query = query.filter(Task.status == status)
        if priority:
            query = query.filter(Task.priority == priority)
        tasks = query.order_by(Task.updated_at.desc()).all()
        return jsonify({"items": [serialize_task_card(task) for task in tasks], "total": len(tasks), "stats": {"open": Task.query.filter(Task.status != "Closed").count(), "closed": Task.query.filter(Task.status == "Closed").count(), "monitoring": Task.query.filter(Task.is_monitoring.is_(True)).count(), "waitingNextShift": Task.query.filter(Task.status == "Waiting Next Shift").count()}})

    @app.get("/api/calendar")
    def calendar():
        month = request.args.get("month")
        query = Schedule.query
        if month:
            try:
                start = datetime.strptime(month + "-01", "%Y-%m-%d").date()
                end = date(start.year + (1 if start.month == 12 else 0), 1 if start.month == 12 else start.month + 1, 1)
                query = query.filter(Schedule.work_date >= start, Schedule.work_date < end)
            except ValueError:
                return jsonify({"message": "Invalid month format. Use YYYY-MM."}), 400
        schedules = query.order_by(Schedule.work_date.asc(), Schedule.shift_id.asc()).all()
        items = [serialize_schedule(schedule) for schedule in schedules]
        by_date: dict[str, list[dict]] = {}
        for item in items:
            by_date.setdefault(item["date"], []).append(item)
        return jsonify({"items": items, "byDate": by_date})

    @app.post("/api/admin/schedules")
    def admin_create_schedule():
        user, error = require_admin()
        if error:
            return error
        payload = request.get_json(silent=True) or {}
        work_date_raw = str(payload.get("workDate", "")).strip()
        shift_id = payload.get("shiftId")
        group_id = payload.get("groupId")
        if not work_date_raw or not shift_id or not group_id:
            return jsonify({"message": "Work date, shift, and group are required."}), 400
        try:
            work_date = datetime.strptime(work_date_raw, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"message": "Invalid work date format. Use YYYY-MM-DD."}), 400
        shift = Shift.query.get(shift_id)
        if not shift:
            return jsonify({"message": "Shift not found."}), 400
        schedule = Schedule(
            work_date=work_date,
            shift_id=shift_id,
            group_id=group_id,
            start_time=str(payload.get("startTime") or shift.default_start_time),
            end_time=str(payload.get("endTime") or shift.default_end_time),
            members_text=str(payload.get("members", "")).strip(),
            remark=str(payload.get("remark", "")).strip(),
            created_by=user.id if user else None,
        )
        db.session.add(schedule)
        db.session.commit()
        return jsonify(serialize_schedule(schedule)), 201

    @app.get("/api/admin/summary")
    def admin_summary():
        _, error = require_admin()
        if error:
            return error
        return jsonify({"counts": {"users": User.query.count(), "groups": Group.query.count(), "shifts": Shift.query.count(), "factories": Factory.query.count(), "systems": System.query.count(), "tasks": Task.query.count(), "schedules": Schedule.query.count()}, "meta": meta_payload()})

    @app.post("/api/admin/groups")
    def admin_create_group():
        _, error = require_admin()
        if error:
            return error
        payload = request.get_json(silent=True) or {}
        name = str(payload.get("name", "")).strip()
        if not name:
            return jsonify({"message": "Group name is required."}), 400
        if Group.query.filter_by(name=name).first():
            return jsonify({"message": "Group already exists."}), 400
        db.session.add(Group(name=name, description=str(payload.get("description", "")).strip()))
        db.session.commit()
        return jsonify(meta_payload()), 201

    @app.post("/api/admin/factories")
    def admin_create_factory():
        _, error = require_admin()
        if error:
            return error
        payload = request.get_json(silent=True) or {}
        name = str(payload.get("name", "")).strip()
        code = str(payload.get("code", "")).strip().upper()
        if not name or not code:
            return jsonify({"message": "Factory name and code are required."}), 400
        if Factory.query.filter((Factory.name == name) | (Factory.code == code)).first():
            return jsonify({"message": "Factory already exists."}), 400
        db.session.add(Factory(name=name, code=code))
        db.session.commit()
        return jsonify(meta_payload()), 201

    @app.post("/api/admin/systems")
    def admin_create_system():
        _, error = require_admin()
        if error:
            return error
        payload = request.get_json(silent=True) or {}
        name = str(payload.get("name", "")).strip()
        code = str(payload.get("code", "")).strip().upper()
        factory_id = payload.get("factoryId") or None
        if not name or not code:
            return jsonify({"message": "System name and code are required."}), 400
        db.session.add(System(name=name, code=code, factory_id=factory_id))
        db.session.commit()
        return jsonify(meta_payload()), 201

    @app.post("/api/admin/users")
    def admin_create_user():
        _, error = require_admin()
        if error:
            return error
        payload = request.get_json(silent=True) or {}
        username = str(payload.get("username", "")).strip()
        password = str(payload.get("password", "123456"))
        display_name = str(payload.get("displayName", username)).strip()
        if not username or not display_name:
            return jsonify({"message": "Username and display name are required."}), 400
        if User.query.filter_by(username=username).first():
            return jsonify({"message": "User already exists."}), 400
        db.session.add(User(username=username, password_hash=generate_password_hash(password), display_name=display_name, email=str(payload.get("email", "")).strip(), role=str(payload.get("role", "user")).strip() or "user", group_id=payload.get("groupId") or None))
        db.session.commit()
        return jsonify(meta_payload()), 201

    @app.get("/")
    def index():
        return jsonify({"name": "ITCC Handover System API", "status": "running"})


app = create_app()


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        seed_database()
    app.run(debug=True, host="127.0.0.1", port=5000)
