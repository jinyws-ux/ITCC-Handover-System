from flask import jsonify, request, session
from werkzeug.security import check_password_hash
from auth import serialize_user
from models import User


def register_auth_routes(app):
    @app.post('/api/auth/login')
    def login():
        payload = request.get_json(silent=True) or {}
        user = User.query.filter_by(username=str(payload.get('username','')).strip(), is_active=True).first()
        if not user or not check_password_hash(user.password_hash, str(payload.get('password',''))):
            return jsonify({'message':'Invalid username or password.'}), 401
        session['user_id'] = user.id
        return jsonify({'user': serialize_user(user)})

    @app.post('/api/auth/logout')
    def logout():
        session.clear(); return jsonify({'status':'ok'})

    @app.get('/api/auth/me')
    def me():
        from auth import current_user
        user = current_user()
        return jsonify({'user': serialize_user(user) if user else None})
