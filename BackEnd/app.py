from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from datetime import timedelta
import json
from bson import ObjectId
from database import get_db
from auth import auth_bp
from models import Task, User

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-super-secret-jwt-key-here'  # Change in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
app.config['MONGO_URI'] = 'mongodb://localhost:27017/taskmanager'

# Initialize extensions
jwt = JWTManager(app)
CORS(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# JSON encoder for ObjectId
class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)

app.json_encoder = JSONEncoder

# Routes
@app.route('/api/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    try:
        current_user = get_jwt_identity()
        db = get_db()
        
        # Get query parameters
        filter_type = request.args.get('filter', 'all')
        category = request.args.get('category', None)
        
        # Build query
        query = {'user_id': current_user}
        
        if filter_type == 'active':
            query['completed'] = False
        elif filter_type == 'completed':
            query['completed'] = True
            
        if category and category != 'all':
            query['category'] = category
        
        # Get tasks from database
        tasks = list(db.tasks.find(query).sort('created_at', -1))
        return jsonify(tasks), 200
        
    except Exception as e:
        return jsonify({'message': 'Error fetching tasks', 'error': str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
@jwt_required()
def create_task():
    try:
        current_user = get_jwt_identity()
        db = get_db()
        
        data = request.get_json()
        task = Task(
            title=data.get('title'),
            description=data.get('description', ''),
            due_date=data.get('dueDate'),
            category=data.get('category', 'personal'),
            priority=data.get('priority', 'medium'),
            notification=data.get('notification', False),
            user_id=current_user
        )
        
        # Insert into database
        result = db.tasks.insert_one(task.to_dict())
        task.id = str(result.inserted_id)
        
        return jsonify(task.to_dict()), 201
        
    except Exception as e:
        return jsonify({'message': 'Error creating task', 'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    try:
        current_user = get_jwt_identity()
        db = get_db()
        
        data = request.get_json()
        
        # Check if task exists and belongs to user
        task = db.tasks.find_one({'_id': ObjectId(task_id), 'user_id': current_user})
        if not task:
            return jsonify({'message': 'Task not found'}), 404
        
        # Update task
        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'dueDate' in data:
            update_data['due_date'] = data['dueDate']
        if 'category' in data:
            update_data['category'] = data['category']
        if 'priority' in data:
            update_data['priority'] = data['priority']
        if 'completed' in data:
            update_data['completed'] = data['completed']
        if 'notification' in data:
            update_data['notification'] = data['notification']
            
        update_data['updated_at'] = Task.get_current_timestamp()
        
        db.tasks.update_one(
            {'_id': ObjectId(task_id)}, 
            {'$set': update_data}
        )
        
        # Return updated task
        updated_task = db.tasks.find_one({'_id': ObjectId(task_id)})
        return jsonify(updated_task), 200
        
    except Exception as e:
        return jsonify({'message': 'Error updating task', 'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    try:
        current_user = get_jwt_identity()
        db = get_db()
        
        # Check if task exists and belongs to user
        task = db.tasks.find_one({'_id': ObjectId(task_id), 'user_id': current_user})
        if not task:
            return jsonify({'message': 'Task not found'}), 404
        
        # Delete task
        db.tasks.delete_one({'_id': ObjectId(task_id)})
        return jsonify({'message': 'Task deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'message': 'Error deleting task', 'error': str(e)}), 500

@app.route('/api/users/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    try:
        current_user = get_jwt_identity()
        db = get_db()
        
        user = db.users.find_one({'_id': ObjectId(current_user)})
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        return jsonify({
            'id': str(user['_id']),
            'username': user['username'],
            'email': user['email'],
            'created_at': user['created_at']
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Error fetching user profile', 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)