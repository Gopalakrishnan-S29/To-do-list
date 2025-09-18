// API base URL - change this to your Python backend URL
const API_BASE_URL = 'http://localhost:5000/api';

// Task Management Functions with backend integration
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    async init() {
        // Check if user is logged in
        if (this.token && this.user) {
            await this.loadTasks();
            this.setupEventListeners();
            this.checkNotifications();
            this.updateTaskStats();
            this.showUserInfo();
        } else {
            this.showLoginForm();
        }
    }

    showUserInfo() {
        const userInfoElement = document.createElement('div');
        userInfoElement.className = 'user-info';
        userInfoElement.innerHTML = `
            <span>Welcome, ${this.user.username}</span>
            <button id="logout-btn">Logout</button>
        `;
        
        const header = document.querySelector('header');
        header.appendChild(userInfoElement);
        
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    showLoginForm() {
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="auth-container">
                <div class="auth-form">
                    <h2><i class="fas fa-user"></i> Login to Task Manager</h2>
                    <div class="form-group">
                        <input type="email" id="login-email" placeholder="Email address">
                    </div>
                    <div class="form-group">
                        <input type="password" id="login-password" placeholder="Password">
                    </div>
                    <button id="login-btn">Login</button>
                    <p>Don't have an account? <a href="#" id="show-register">Register here</a></p>
                </div>
                
                <div class="auth-form" style="display: none;">
                    <h2><i class="fas fa-user-plus"></i> Create Account</h2>
                    <div class="form-group">
                        <input type="text" id="register-username" placeholder="Username">
                    </div>
                    <div class="form-group">
                        <input type="email" id="register-email" placeholder="Email address">
                    </div>
                    <div class="form-group">
                        <input type="password" id="register-password" placeholder="Password">
                    </div>
                    <button id="register-btn">Register</button>
                    <p>Already have an account? <a href="#" id="show-login">Login here</a></p>
                </div>
            </div>
        `;
        
        this.setupAuthEventListeners();
    }

    setupAuthEventListeners() {
        // Login button
        document.getElementById('login-btn').addEventListener('click', () => {
            this.login();
        });
        
        // Register button
        document.getElementById('register-btn').addEventListener('click', () => {
            this.register();
        });
        
        // Show register form
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.auth-form')[0].style.display = 'none';
            document.querySelectorAll('.auth-form')[1].style.display = 'block';
        });
        
        // Show login form
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.auth-form')[1].style.display = 'none';
            document.querySelectorAll('.auth-form')[0].style.display = 'block';
        });
        
        // Enter key support
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        
        document.getElementById('register-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.register();
        });
    }

    async login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            this.showNotification('Please enter both email and password', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                
                // Save to localStorage
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                this.showNotification('Login successful!');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('Error connecting to server', 'error');
        }
    }

    async register() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        if (!username || !email || !password) {
            this.showNotification('Please fill all fields', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('Registration successful! Please login.');
                document.querySelectorAll('.auth-form')[1].style.display = 'none';
                document.querySelectorAll('.auth-form')[0].style.display = 'block';
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('Error connecting to server', 'error');
        }
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;
        location.reload();
    }

    setupEventListeners() {
        // Add task button
        document.getElementById('add-task-btn').addEventListener('click', () => {
            this.addTask();
        });

        // Enter key to add task
        document.getElementById('task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    }

    async addTask() {
        const taskInput = document.getElementById('task-input');
        const dueDateInput = document.getElementById('due-date');
        const categoryInput = document.getElementById('category');
        const notificationInput = document.getElementById('notification');

        const title = taskInput.value.trim();
        if (!title) {
            this.showNotification('Please enter a task title', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    title,
                    dueDate: dueDateInput.value,
                    category: categoryInput.value,
                    notification: notificationInput.checked
                })
            });
            
            if (response.ok) {
                this.showNotification('Task added successfully!');
                this.loadTasks();
                
                // Reset form
                taskInput.value = '';
                dueDateInput.value = '';
                categoryInput.value = 'personal';
                notificationInput.checked = false;
            } else {
                const data = await response.json();
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('Error adding task', 'error');
        }
    }

    async editTask(id) {
        const task = this.tasks.find(task => task._id === id);
        if (!task) return;

        const newText = prompt('Edit your task:', task.title);
        if (newText !== null && newText.trim() !== '') {
            try {
                const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({ title: newText.trim() })
                });
                
                if (response.ok) {
                    this.showNotification('Task updated successfully!');
                    this.loadTasks();
                } else {
                    const data = await response.json();
                    this.showNotification(data.message, 'error');
                }
            } catch (error) {
                this.showNotification('Error updating task', 'error');
            }
        }
    }

    async deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
                
                if (response.ok) {
                    this.showNotification('Task deleted successfully!');
                    this.loadTasks();
                } else {
                    const data = await response.json();
                    this.showNotification(data.message, 'error');
                }
            } catch (error) {
                this.showNotification('Error deleting task', 'error');
            }
        }
    }

    async toggleTaskCompletion(id) {
        const task = this.tasks.find(task => task._id === id);
        if (task) {
            try {
                const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({ completed: !task.completed })
                });
                
                if (response.ok) {
                    const message = !task.completed ? 
                        'Task marked as completed!' : 
                        'Task marked as active!';
                    this.showNotification(message);
                    this.loadTasks();
                } else {
                    const data = await response.json();
                    this.showNotification(data.message, 'error');
                }
            } catch (error) {
                this.showNotification('Error updating task', 'error');
            }
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.classList.toggle('active', button.dataset.filter === filter);
        });
        
        this.loadTasks();
    }

    async loadTasks() {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks?filter=${this.currentFilter}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                this.tasks = await response.json();
                this.renderTasks();
                this.updateTaskStats();
            } else if (response.status === 401) {
                // Token expired or invalid
                this.logout();
            } else {
                const data = await response.json();
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            this.showNotification('Error loading tasks', 'error');
        }
    }

    renderTasks() {
        const tasksList = document.getElementById('tasks-list');
        tasksList.innerHTML = '';

        if (this.tasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <p>No tasks found. Add a new task to get started!</p>
                </div>
            `;
            return;
        }

        this.tasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'task-completed' : ''}`;
            
            const dueDate = task.due_date ? 
                new Date(task.due_date).toLocaleString() : 
                'No due date';
            
            const categoryIcon = this.getCategoryIcon(task.category);
            const categoryName = this.getCategoryName(task.category);
            
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-text">${task.title}</div>
                    <div class="task-details">
                        <span><i class="fas fa-calendar"></i> ${dueDate}</span>
                        <span><i class="fas ${categoryIcon}"></i> ${categoryName}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // Add event listeners
            const checkbox = taskItem.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => {
                this.toggleTaskCompletion(task._id);
            });
            
            const editBtn = taskItem.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => {
                this.editTask(task._id);
            });
            
            const deleteBtn = taskItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                this.deleteTask(task._id);
            });
            
            tasksList.appendChild(taskItem);
        });
    }

    getCategoryIcon(category) {
        const icons = {
            'personal': 'fa-user',
            'work': 'fa-briefcase',
            'shopping': 'fa-shopping-cart',
            'health': 'fa-heart',
            'other': 'fa-star'
        };
        return icons[category] || 'fa-star';
    }

    getCategoryName(category) {
        const names = {
            'personal': 'Personal',
            'work': 'Work',
            'shopping': 'Shopping',
            'health': 'Health',
            'other': 'Other'
        };
        return names[category] || 'Other';
    }

    updateTaskStats() {
        const totalTasks = this.tasks.length;
        document.getElementById('total-tasks').textContent = totalTasks;
        
        // Update user suggestion based on tasks
        const suggestionElement = document.querySelector('.user-suggestions p');
        if (totalTasks === 0) {
            suggestionElement.textContent = "Add your first task to get started!";
        } else {
            const incompleteTasks = this.tasks.filter(task => !task.completed).length;
            if (incompleteTasks === 0) {
                suggestionElement.textContent = "All tasks completed! Great job!";
            } else {
                suggestionElement.textContent = `You have ${incompleteTasks} task${incompleteTasks !== 1 ? 's' : ''} to complete. Keep going!`;
            }
        }
    }

    showNotification(message, type = 'success') {
        const notificationArea = document.getElementById('notification-area');
        const notification = document.createElement('div');
        notification.className = `notification ${type === 'error' ? 'error' : ''}`;
        notification.innerHTML = `
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
            <span>${message}</span>
        `;
        
        notificationArea.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    checkNotifications() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }
        
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Check for due tasks
        this.tasks.forEach(task => {
            if (task.notification && !task.completed && task.due_date) {
                const dueDate = new Date(task.due_date);
                const now = new Date();
                
                // Notify if task is due within 10 minutes
                if (dueDate - now <= 10 * 60 * 1000 && dueDate > now) {
                    this.scheduleNotification(task, dueDate - now);
                }
            }
        });
    }

    scheduleNotification(task, timeUntilDue) {
        setTimeout(() => {
            if (Notification.permission === 'granted' && !task.completed) {
                new Notification('Task Due Soon', {
                    body: `Your task "${task.title}" is due now!`,
                    icon: '/favicon.ico'
                });
            }
        }, timeUntilDue);
    }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});