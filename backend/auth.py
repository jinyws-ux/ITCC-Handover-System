from flask import jsonify, session
from models import User


def current_user() -> User | None:
    user_id = session.get('user_id')
    return User.query.get(user_id) if user_id else None


def require_admin():
    user = current_user()
    if not user:
        return None, (jsonify({'message': 'Login required.'}), 401)
    if user.role != 'admin':
        return user, (jsonify({'message': 'Admin permission required.'}), 403)
    return user, None


def serialize_user(user: User) -> dict:
    return {'id': user.id, 'username': user.username, 'displayName': user.display_name, 'email': user.email, 'role': user.role, 'group': user.group.name if user.group else '-'}
