from __future__ import annotations

from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


TASKS = [
    {
        "id": 1,
        "taskNo": "TASK-20260514-001",
        "title": "OSM interface unstable after patch window",
        "type": "INC",
        "priority": "High",
        "status": "Monitoring",
        "handoverCategory": "Monitoring",
        "factory": "Factory A",
        "system": "OSM",
        "source": "Helix + Outlook",
        "targetShift": "D1",
        "targetGroup": "Group A",
        "nextAction": "D1 should check interface logs at 06:30 and confirm production feedback.",
        "externalLinks": ["Helix", "Outlook", "AG"],
        "isED1": True,
        "updatedAt": "2026-05-14 02:35",
    },
    {
        "id": 2,
        "taskNo": "TASK-20260514-002",
        "title": "Update shift adjustment table for weekend plan",
        "type": "WO",
        "priority": "None",
        "status": "Waiting Next Shift",
        "handoverCategory": "Action Required",
        "factory": "Factory B",
        "system": "Schedule DB",
        "source": "Phone",
        "targetShift": "E",
        "targetGroup": "Group C",
        "nextAction": "E shift should update the table after final factory stop time is confirmed.",
        "externalLinks": [],
        "isED1": False,
        "updatedAt": "2026-05-14 17:20",
    },
    {
        "id": 3,
        "taskNo": "TASK-20260514-003",
        "title": "MES upgrade hypercare checks",
        "type": "Hypercare",
        "priority": "None",
        "status": "Open",
        "handoverCategory": "Monitoring",
        "factory": "Factory C",
        "system": "MES",
        "source": "Manual",
        "targetShift": "D2",
        "targetGroup": "Group B",
        "nextAction": "Check process, API status, and error logs at each planned checkpoint.",
        "externalLinks": ["Jira"],
        "isED1": False,
        "updatedAt": "2026-05-14 09:10",
    },
]


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat() + "Z"})


@app.get("/api/dashboard")
def dashboard():
    return jsonify(
        {
            "currentDate": "2026-05-14",
            "currentShift": {"code": "D2", "time": "09:30 - 18:00", "group": "Group B"},
            "nextShift": {"code": "E", "time": "17:00 - 03:00", "group": "Group C"},
            "user": {"displayName": "Demo User", "role": "admin", "group": "Group B"},
            "sections": {
                "waitingNextShift": [TASKS[1]],
                "monitoring": [TASKS[0], TASKS[2]],
                "noticeOnly": [],
                "todayHypercare": [TASKS[2]],
                "needConfirmation": [TASKS[0]],
                "recentlyUpdated": TASKS,
            },
        }
    )


@app.get("/api/tasks")
def list_tasks():
    return jsonify({"items": TASKS, "total": len(TASKS)})


@app.get("/")
def index():
    return jsonify({"name": "ITCC Handover System API", "status": "running"})


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
