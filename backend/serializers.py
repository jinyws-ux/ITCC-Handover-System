from __future__ import annotations

from datetime import date, datetime
from typing import Any

from models import Task


def format_dt(value: datetime | date | None) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M")
    return value.isoformat()


def serialize_external_links(task: Task) -> list[str]:
    return [link.external_type for link in task.external_links]


def serialize_task_card(task: Task) -> dict[str, Any]:
    return {
        "id": task.id,
        "taskNo": task.task_no,
        "title": task.title,
        "type": task.task_type,
        "priority": task.priority,
        "status": task.status,
        "handoverCategory": task.handover_category,
        "factory": task.factory.name if task.factory else "-",
        "system": task.system.name if task.system else "-",
        "source": task.source_type,
        "targetShift": task.target_shift.code if task.target_shift else "-",
        "targetGroup": task.target_group.name if task.target_group else "-",
        "nextAction": task.next_action,
        "externalLinks": serialize_external_links(task),
        "isED1": task.is_e_to_d1,
        "updatedAt": format_dt(task.updated_at) or "-",
    }


def serialize_task_detail(task: Task) -> dict[str, Any]:
    return {
        **serialize_task_card(task),
        "description": task.description,
        "isMonitoring": task.is_monitoring,
        "monitorUntil": format_dt(task.monitor_until),
        "needAck": task.need_ack,
        "createdAt": format_dt(task.created_at),
        "closedAt": format_dt(task.closed_at),
        "externalLinkDetails": [
            {
                "id": link.id,
                "type": link.external_type,
                "externalId": link.external_id,
                "title": link.external_title,
                "url": link.external_url,
                "status": link.external_status,
                "isPrimary": link.is_primary,
                "remark": link.remark,
            }
            for link in task.external_links
        ],
        "logs": [
            {
                "id": log.id,
                "type": log.log_type,
                "content": log.content,
                "oldStatus": log.old_status,
                "newStatus": log.new_status,
                "createdAt": format_dt(log.created_at),
            }
            for log in task.logs
        ],
        "handovers": [
            {
                "id": handover.id,
                "fromShift": handover.from_shift.code if handover.from_shift else "-",
                "toShift": handover.to_shift.code if handover.to_shift else "-",
                "fromGroup": handover.from_group.name if handover.from_group else "-",
                "toGroup": handover.to_group.name if handover.to_group else "-",
                "note": handover.handover_note,
                "status": handover.status,
                "handedOverAt": format_dt(handover.handed_over_at),
                "acknowledgedAt": format_dt(handover.acknowledged_at),
                "acceptedAt": format_dt(handover.accepted_at),
            }
            for handover in task.handovers
        ],
        "hypercareChecks": [
            {
                "id": check.id,
                "checkTime": format_dt(check.check_time),
                "checkItem": check.check_item,
                "expectedResult": check.expected_result,
                "actualResult": check.actual_result,
                "status": check.check_status,
                "checkedAt": format_dt(check.checked_at),
                "remark": check.remark,
            }
            for check in task.hypercare_checks
        ],
    }
