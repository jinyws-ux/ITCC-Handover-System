from flask import jsonify, request
from werkzeug.security import generate_password_hash
from auth import require_admin
from extensions import db
from models import Factory, Group, Schedule, Shift, System, Task, User


def meta_payload():
    return {'groups': [{'id': x.id, 'name': x.name, 'description': x.description, 'isActive': x.is_active} for x in Group.query.order_by(Group.name).all()], 'shifts': [{'id': x.id, 'code': x.code, 'name': x.name, 'defaultStartTime': x.default_start_time, 'defaultEndTime': x.default_end_time, 'description': x.description, 'isActive': x.is_active} for x in Shift.query.order_by(Shift.id).all()], 'factories': [{'id': x.id, 'name': x.name, 'code': x.code, 'isActive': x.is_active} for x in Factory.query.order_by(Factory.name).all()], 'systems': [{'id': x.id, 'name': x.name, 'code': x.code, 'factoryId': x.factory_id, 'factory': x.factory.name if x.factory else '-', 'isActive': x.is_active} for x in System.query.order_by(System.name).all()], 'users': [{'id': x.id, 'displayName': x.display_name, 'username': x.username, 'email': x.email, 'role': x.role, 'groupId': x.group_id, 'group': x.group.name if x.group else '-', 'isActive': x.is_active} for x in User.query.order_by(User.display_name).all()]}


def register_admin_routes(app):
    @app.get('/api/meta')
    def meta(): return jsonify(meta_payload())
    @app.get('/api/admin/summary')
    def admin_summary():
        _, e=require_admin();
        if e: return e
        return jsonify({'counts': {'users': User.query.count(), 'groups': Group.query.count(), 'shifts': Shift.query.count(), 'factories': Factory.query.count(), 'systems': System.query.count(), 'tasks': Task.query.count(), 'schedules': Schedule.query.count()}, 'meta': meta_payload()})
    @app.post('/api/admin/groups')
    def admin_create_group():
        _,e=require_admin();
        if e:return e
        p=request.get_json(silent=True) or {}; db.session.add(Group(name=str(p.get('name','')).strip(), description=str(p.get('description','')).strip())); db.session.commit(); return jsonify(meta_payload()),201
    @app.post('/api/admin/factories')
    def admin_create_factory():
        _,e=require_admin();
        if e:return e
        p=request.get_json(silent=True) or {}; db.session.add(Factory(name=str(p.get('name','')).strip(), code=str(p.get('code','')).strip().upper())); db.session.commit(); return jsonify(meta_payload()),201
    @app.post('/api/admin/systems')
    def admin_create_system():
        _,e=require_admin();
        if e:return e
        p=request.get_json(silent=True) or {}; db.session.add(System(name=str(p.get('name','')).strip(), code=str(p.get('code','')).strip().upper(), factory_id=p.get('factoryId') or None)); db.session.commit(); return jsonify(meta_payload()),201
    @app.post('/api/admin/users')
    def admin_create_user():
        _,e=require_admin();
        if e:return e
        p=request.get_json(silent=True) or {}; username=str(p.get('username','')).strip(); db.session.add(User(username=username, password_hash=generate_password_hash(str(p.get('password','123456'))), display_name=str(p.get('displayName',username)).strip(), email=str(p.get('email','')).strip(), role=str(p.get('role','user')).strip() or 'user', group_id=p.get('groupId') or None)); db.session.commit(); return jsonify(meta_payload()),201
