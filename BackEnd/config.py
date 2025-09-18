import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # MongoDB
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/taskmanager')
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-super-secret-jwt-key-here')
    JWT_ACCESS_TOKEN_EXPIRES = False
    
    # Flask
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'