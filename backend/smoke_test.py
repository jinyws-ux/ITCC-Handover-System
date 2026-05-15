"""Simple smoke test for key API endpoints.
Run: python backend/smoke_test.py
"""
from app import create_app
from extensions import db
from seed import seed_database


def run():
    app = create_app()
    with app.app_context():
        db.drop_all(); db.create_all(); seed_database()
    client = app.test_client()

    r = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
    assert r.status_code == 200, r.get_data(as_text=True)

    checks = [
        ('GET', '/api/dashboard', None),
        ('GET', '/api/meta', None),
        ('GET', '/api/calendar-rich', None),
        ('GET', '/api/timeline-rich-v2', None),
        ('GET', '/api/admin/summary', None),
    ]
    for method, url, payload in checks:
        resp = client.open(url, method=method, json=payload)
        assert resp.status_code == 200, f'{method} {url}: {resp.status_code} {resp.get_data(as_text=True)}'

    create = client.post('/api/tasks', json={'title': 'Smoke Task', 'taskType': 'INC', 'priority': 'High', 'status': 'Open', 'sourceType': 'Manual', 'handoverCategory': 'Action Required', 'nextAction': 'check'})
    assert create.status_code in (200, 201), create.get_data(as_text=True)
    task_id = create.get_json()['id']

    assert client.get(f'/api/tasks/{task_id}').status_code == 200
    assert client.post(f'/api/tasks/{task_id}/external-links', json={'externalType': 'Jira', 'externalId': 'SMOKE-1', 'externalTitle': 'smoke'}).status_code in (200, 201)

    h = client.post(f'/api/tasks/{task_id}/hypercare-checks', json={'checkItem': 'CPU check', 'checkTime': '2026-05-14 09:00'})
    assert h.status_code in (200, 201), h.get_data(as_text=True)
    lst = client.get(f'/api/tasks/{task_id}/hypercare-checks').get_json()
    cid = lst['items'][0]['id']
    assert client.post(f'/api/hypercare-checks/{cid}/status', json={'status': 'Done'}).status_code in (200, 201)

    print('SMOKE TEST PASSED')


if __name__ == '__main__':
    run()
