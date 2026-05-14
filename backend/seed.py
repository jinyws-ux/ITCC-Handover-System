from __future__ import annotations

from datetime import date, datetime
from werkzeug.security import generate_password_hash

from extensions import db
from models import (
    Factory,
    Group,
    Handover,
    HypercareCheck,
    Schedule,
    Shift,
    System,
    Task,
    TaskExternalLink,
    TaskLog,
    User,
)


def seed_database() -> None:
    if User.query.first():
        return

    group_a = Group(name="Group A", description="D1 sample operation group")
    group_b = Group(name="Group B", description="D2 sample operation group")
    group_c = Group(name="Group C", description="E sample operation group")
    group_d = Group(name="Group D", description="Backup operation group")
    db.session.add_all([group_a, group_b, group_c, group_d])
    db.session.flush()

    admin = User(
        username="admin",
        password_hash=generate_password_hash("admin123"),
        display_name="Admin User",
        email="admin@example.com",
        role="admin",
        group=group_b,
    )
    lead = User(
        username="lead",
        password_hash=generate_password_hash("lead123"),
        display_name="Shift Lead",
        email="lead@example.com",
        role="lead",
        group=group_a,
    )
    user = User(
        username="user",
        password_hash=generate_password_hash("user123"),
        display_name="Demo User",
        email="user@example.com",
        role="user",
        group=group_c,
    )
    db.session.add_all([admin, lead, user])
    db.session.flush()

    d1 = Shift(code="D1", name="Early Shift", default_start_time="06:00", default_end_time="16:00", description="Early shift")
    d2 = Shift(code="D2", name="Normal Shift", default_start_time="09:30", default_end_time="18:00", description="Normal shift")
    e = Shift(code="E", name="Evening Shift", default_start_time="17:00", default_end_time="03:00", description="Evening shift; actual time may change by date")
    db.session.add_all([d1, d2, e])
    db.session.flush()

    factory_a = Factory(name="Factory A", code="FA")
    factory_b = Factory(name="Factory B", code="FB")
    factory_c = Factory(name="Factory C", code="FC")
    db.session.add_all([factory_a, factory_b, factory_c])
    db.session.flush()

    osm = System(name="OSM", code="OSM", factory=factory_a)
    schedule_db = System(name="Schedule DB", code="SCHED", factory=factory_b)
    mes = System(name="MES", code="MES", factory=factory_c)
    db.session.add_all([osm, schedule_db, mes])
    db.session.flush()

    db.session.add_all(
        [
            Schedule(work_date=date(2026, 5, 14), shift=d1, group=group_a, start_time="06:00", end_time="16:00", members_text="Alice, Bob", created_by=admin.id),
            Schedule(work_date=date(2026, 5, 14), shift=d2, group=group_b, start_time="09:30", end_time="18:00", members_text="Charlie, Dana", created_by=admin.id),
            Schedule(work_date=date(2026, 5, 14), shift=e, group=group_c, start_time="17:00", end_time="03:00", members_text="Evan, Fiona", remark="Adjusted by latest factory stop time", created_by=admin.id),
        ]
    )

    task1 = Task(
        task_no="TASK-20260514-001",
        title="OSM interface unstable after patch window",
        task_type="INC",
        source_type="Helix + Outlook",
        priority="High",
        factory=factory_a,
        system=osm,
        description="OSM interface showed intermittent failures after patch window. Temporary recovery completed, but D1 needs to monitor production feedback.",
        status="Monitoring",
        handover_category="Monitoring",
        next_action="D1 should check interface logs at 06:30 and confirm production feedback.",
        target_shift=d1,
        target_group=group_a,
        owner_user=lead,
        owner_group=group_a,
        is_monitoring=True,
        need_ack=True,
        is_e_to_d1=True,
        created_by=admin.id,
        updated_by=admin.id,
    )
    task2 = Task(
        task_no="TASK-20260514-002",
        title="Update shift adjustment table for weekend plan",
        task_type="WO",
        source_type="Phone",
        priority="None",
        factory=factory_b,
        system=schedule_db,
        description="Business requested weekend shift adjustment data update after final stop time is confirmed.",
        status="Waiting Next Shift",
        handover_category="Action Required",
        next_action="E shift should update the table after final factory stop time is confirmed.",
        target_shift=e,
        target_group=group_c,
        owner_user=user,
        owner_group=group_c,
        need_ack=True,
        created_by=lead.id,
        updated_by=lead.id,
    )
    task3 = Task(
        task_no="TASK-20260514-003",
        title="MES upgrade hypercare checks",
        task_type="Hypercare",
        source_type="Manual",
        priority="None",
        factory=factory_c,
        system=mes,
        description="MES upgrade completed. Need planned checks across multiple time points.",
        status="Open",
        handover_category="Monitoring",
        next_action="Check process, API status, and error logs at each planned checkpoint.",
        target_shift=d2,
        target_group=group_b,
        owner_user=admin,
        owner_group=group_b,
        is_monitoring=True,
        created_by=admin.id,
        updated_by=admin.id,
    )
    db.session.add_all([task1, task2, task3])
    db.session.flush()

    db.session.add_all(
        [
            TaskExternalLink(task=task1, external_type="Helix", external_id="INC000123456", external_title="OSM interface unstable", external_url="https://helix.example.com/INC000123456", external_status="In Progress", is_primary=True, created_by=admin.id),
            TaskExternalLink(task=task1, external_type="Outlook", external_id="MSG-OSM-001", external_title="Factory feedback for OSM issue", external_url="https://outlook.office.com/mail/", external_status="Received", created_by=admin.id),
            TaskExternalLink(task=task1, external_type="AG", external_id="AG-99881", external_title="OSM interface analysis", external_url="https://ag.example.com/AG-99881", external_status="Waiting Reply", created_by=admin.id),
            TaskExternalLink(task=task3, external_type="Jira", external_id="OPS-8821", external_title="MES upgrade hypercare", external_url="https://jira.example.com/browse/OPS-8821", external_status="To Do", is_primary=True, created_by=admin.id),
        ]
    )

    db.session.add_all(
        [
            TaskLog(task=task1, log_type="Status", content="Temporary recovery completed. Monitoring is required for D1.", old_status="In Progress", new_status="Monitoring", created_by=admin.id),
            TaskLog(task=task2, log_type="Handover", content="Waiting for final factory stop time before data update.", old_status="Open", new_status="Waiting Next Shift", created_by=lead.id),
            TaskLog(task=task3, log_type="Create", content="Hypercare task created with planned checkpoints.", new_status="Open", created_by=admin.id),
        ]
    )

    db.session.add(
        Handover(
            task=task1,
            from_shift=e,
            to_shift=d1,
            from_group=group_c,
            to_group=group_a,
            handover_note="E shift observed intermittent issue after recovery. D1 must confirm stability after production starts.",
            handed_over_by=user.id,
            status="Pending",
        )
    )

    db.session.add_all(
        [
            HypercareCheck(task=task3, check_time=datetime(2026, 5, 14, 14, 0), check_item="Check MES process status", expected_result="All processes running", check_status="Planned"),
            HypercareCheck(task=task3, check_time=datetime(2026, 5, 14, 18, 0), check_item="Check MES API status", expected_result="No failed API calls", check_status="Planned"),
            HypercareCheck(task=task3, check_time=datetime(2026, 5, 15, 2, 0), check_item="Check error logs", expected_result="No new critical errors", check_status="Planned"),
        ]
    )

    db.session.commit()
