from pymongo import MongoClient
from flask import current_app

def get_db():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['taskmanager']
    return db

def init_db():
    db = get_db()
    
    # Create indexes
    db.users.create_index('email', unique=True)
    db.users.create_index('username', unique=True)
    db.tasks.create_index('user_id')
    
    print("Database initialized successfully")