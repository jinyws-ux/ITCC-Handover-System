from __future__ import annotations

from datetime import datetime
from extensions import db


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Group(TimestampMixin, db.Model):
    __tablename__ = "groups"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255), default="")
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    users = db.relationship("User", back_populates="group")


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), default="")
    role = db.Column(db.String(30), default="user", nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey("groups.id"))
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    group = db.relationship("Group", back_populates="users")


class Shift(db.Model):
    __tablename__ = "shifts"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(80), nullable=False)
    default_start_time = db.Column(db.String(10), nullable=False)
    default_end_time = db.Column(db.String(10), nullable=False)
    description = db.Column(db.String(255), default="")
    is_active = db.Column(db.Boolean, default=True, nullable=False)


class Factory(TimestampMixin, db.Model):
    __tablename__ = "factories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    code = db.Column(db.String(40), unique=True, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    systems = db.relationship("System", back_populates="factory")


class System(TimestampMixin, db.Model):
    __tablename__ = "systems"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(40), nullable=False)
    factory_id = db.Column(db.Integer, db.ForeignKey("factories.id"))
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    factory = db.relationship("Factory", back_populates="systems")


class Schedule(TimestampMixin, db.Model):
    __tablename__ = "schedules"

    id = db.Column(db.Integer, primary_key=True)
    work_date = db.Column(db.Date, nullable=False)
    shift_id = db.Column(db.Integer, db.ForeignKey("shifts.id"), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey("groups.id"), nullable=False)
    start_time = db.Column(db.String(10), nullable=False)
    end_time = db.Column(db.String(10), nullable=False)
    members_text = db.Column(db.Text, default="")
    remark = db.Column(db.String(255), default="")
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))

    shift = db.relationship("Shift")
    group = db.relationship("Group")


class Task(TimestampMixin, db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    task_no = db.Column(db.String(40), unique=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    task_type = db.Column(db.String(40), nullable=False)
    source_type = db.Column(db.String(40), nullable=False)
    priority = db.Column(db.String(40), default="None", nullable=False)
    factory_id = db.Column(db.Integer, db.ForeignKey("factories.id"))
    system_id = db.Column(db.Integer, db.ForeignKey("systems.id"))
    description = db.Column(db.Text, default="")
    status = db.Column(db.String(40), default="Open", nullable=False)
    handover_category = db.Column(db.String(40), default="Notice", nullable=False)
    next_action = db.Column(db.Text, default="")
    target_shift_id = db.Column(db.Integer, db.ForeignKey("shifts.id"))
    target_group_id = db.Column(db.Integer, db.ForeignKey("groups.id"))
    owner_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    owner_group_id = db.Column(db.Integer, db.ForeignKey("groups.id"))
    is_monitoring = db.Column(db.Boolean, default=False, nullable=False)
    monitor_until = db.Column(db.DateTime)
    need_ack = db.Column(db.Boolean, default=False, nullable=False)
    is_e_to_d1 = db.Column(db.Boolean, default=False, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    updated_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    closed_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    closed_at = db.Column(db.DateTime)

    factory = db.relationship("Factory")
    system = db.relationship("System")
    target_shift = db.relationship("Shift", foreign_keys=[target_shift_id])
    target_group = db.relationship("Group", foreign_keys=[target_group_id])
    owner_user = db.relationship("User", foreign_keys=[owner_user_id])
    owner_group = db.relationship("Group", foreign_keys=[owner_group_id])
    external_links = db.relationship("TaskExternalLink", back_populates="task", cascade="all, delete-orphan")
    logs = db.relationship("TaskLog", back_populates="task", cascade="all, delete-orphan")
    handovers = db.relationship("Handover", back_populates="task", cascade="all, delete-orphan")
    hypercare_checks = db.relationship("HypercareCheck", back_populates="task", cascade="all, delete-orphan")
    attachments = db.relationship("Attachment", back_populates="task", cascade="all, delete-orphan")


class TaskExternalLink(db.Model):
    __tablename__ = "task_external_links"

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    external_type = db.Column(db.String(40), nullable=False)
    external_id = db.Column(db.String(120), default="")
    external_title = db.Column(db.String(255), default="")
    external_url = db.Column(db.String(500), default="")
    external_status = db.Column(db.String(80), default="")
    is_primary = db.Column(db.Boolean, default=False, nullable=False)
    last_synced_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    remark = db.Column(db.String(255), default="")

    task = db.relationship("Task", back_populates="external_links")


class TaskLog(db.Model):
    __tablename__ = "task_logs"

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    log_type = db.Column(db.String(40), nullable=False)
    content = db.Column(db.Text, nullable=False)
    old_status = db.Column(db.String(40), default="")
    new_status = db.Column(db.String(40), default="")
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    task = db.relationship("Task", back_populates="logs")


class Handover(db.Model):
    __tablename__ = "handovers"

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    from_shift_id = db.Column(db.Integer, db.ForeignKey("shifts.id"))
    to_shift_id = db.Column(db.Integer, db.ForeignKey("shifts.id"))
    from_group_id = db.Column(db.Integer, db.ForeignKey("groups.id"))
    to_group_id = db.Column(db.Integer, db.ForeignKey("groups.id"))
    handover_note = db.Column(db.Text, default="")
    handed_over_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    handed_over_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    acknowledged_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    acknowledged_at = db.Column(db.DateTime)
    accepted_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    accepted_at = db.Column(db.DateTime)
    status = db.Column(db.String(40), default="Pending", nullable=False)

    task = db.relationship("Task", back_populates="handovers")
    from_shift = db.relationship("Shift", foreign_keys=[from_shift_id])
    to_shift = db.relationship("Shift", foreign_keys=[to_shift_id])
    from_group = db.relationship("Group", foreign_keys=[from_group_id])
    to_group = db.relationship("Group", foreign_keys=[to_group_id])


class HypercareCheck(db.Model):
    __tablename__ = "hypercare_checks"

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    check_time = db.Column(db.DateTime, nullable=False)
    check_item = db.Column(db.String(255), nullable=False)
    expected_result = db.Column(db.String(255), default="")
    actual_result = db.Column(db.Text, default="")
    check_status = db.Column(db.String(40), default="Planned", nullable=False)
    checked_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    checked_at = db.Column(db.DateTime)
    remark = db.Column(db.String(255), default="")

    task = db.relationship("Task", back_populates="hypercare_checks")


class Attachment(db.Model):
    __tablename__ = "attachments"

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(80), default="")
    uploaded_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    description = db.Column(db.String(255), default="")

    task = db.relationship("Task", back_populates="attachments")
