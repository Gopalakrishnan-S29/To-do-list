from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from database import get_db
from models import User
from datetime import datetime
import bcrypt
from bson import ObjectId

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        db = get_db()
        data = request.get_json()
        
        # Validate input
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Username, email and password are required'}), 400
        
        if len(data['password']) < 6:
            return jsonify({'message': 'Password must be at least 6 characters'}), 400
        
        # Check if user already exists
        existing_user = db.users.find_one({
            '$or': [
                {'email': data['email']},
                {'username': data['username']}
            ]
        })
        
        if existing_user:
            return jsonify({'message': 'User already exists with this email or username'}), 400
        
        # Hash password
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        
        # Create user
        user = User(
            username=data['username'],
            email=data['email'],
            password=hashed_password.decode('utf-8')
        )
        
        # Insert into database
        result = db.users.insert_one(user.to_dict())
        user_id = str(result.inserted_id)
        
        # Create access token
        access_token = create_access_token(identity=user_id)
        
        return jsonify({
            'message': 'User created successfully',
            'token': access_token,
            'user': {
                'id': user_id,
                'username': user.username,
                'email': user.email
            }
        }), 201
        
    except Exception as e:
        return jsonify({'message': 'Error creating user', 'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        db = get_db()
        data = request.get_json()
        
        # Validate input
        if not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Find user
        user_data = db.users.find_one({'email': data['email']})
        if not user_data:
            return jsonify({'message': 'Invalid credentials'}), 400
        
        # Check password
        if not bcrypt.checkpw(data['password'].encode('utf-8'), user_data['password'].encode('utf-8')):
            return jsonify({'message': 'Invalid credentials'}), 400
        
        # Create access token
        access_token = create_access_token(identity=str(user_data['_id']))
        
        return jsonify({
            'message': 'Login successful',
            'token': access_token,
            'user': {
                'id': str(user_data['_id']),
                'username': user_data['username'],
                'email': user_data['email']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error logging in', 'error': str(e)}), 500