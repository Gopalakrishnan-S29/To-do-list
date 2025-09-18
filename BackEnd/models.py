from datetime import datetime
from bson import ObjectId

class Task:
    def __init__(self, title, user_id, description="", due_date=None, 
                 category="personal", priority="medium", completed=False, 
                 notification=False, created_at=None, updated_at=None, id=None):
        self.id = id
        self.title = title
        self.description = description
        self.due_date = due_date
        self.category = category
        self.priority = priority
        self.completed = completed
        self.notification = notification
        self.user_id = user_id
        self.created_at = created_at or self.get_current_timestamp()
        self.updated_at = updated_at or self.get_current_timestamp()
    
    @staticmethod
    def get_current_timestamp():
        return datetime.utcnow().isoformat()
    
    def to_dict(self):
        return {
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date,
            'category': self.category,
            'priority': self.priority,
            'completed': self.completed,
            'notification': self.notification,
            'user_id': self.user_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data):
        return cls(
            id=str(data['_id']) if '_id' in data else None,
            title=data['title'],
            description=data.get('description', ''),
            due_date=data.get('due_date'),
            category=data.get('category', 'personal'),
            priority=data.get('priority', 'medium'),
            completed=data.get('completed', False),
            notification=data.get('notification', False),
            user_id=data['user_id'],
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at')
        )


class User:
    def __init__(self, username, email, password, created_at=None, id=None):
        self.id = id
        self.username = username
        self.email = email
        self.password = password
        self.created_at = created_at or self.get_current_timestamp()
    
    @staticmethod
    def get_current_timestamp():
        return datetime.utcnow().isoformat()
    
    def to_dict(self):
        return {
            'username': self.username,
            'email': self.email,
            'password': self.password,
            'created_at': self.created_at
        }
    
    @classmethod
    def from_dict(cls, data):
        return cls(
            id=str(data['_id']) if '_id' in data else None,
            username=data['username'],
            email=data['email'],
            password=data['password'],
            created_at=data.get('created_at')
        )