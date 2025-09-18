// Task Management Functions
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.checkNotifications();
        this.updateTaskStats();
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

    addTask() {
        const taskInput = document.getElementById('task-input');
        const dueDateInput = document.getElementById('due-date');
        const categoryInput = document.getElementById('category');
        const notificationInput = document.getElementById('notification');

        const taskText = taskInput.value.trim();
        if (!taskText) {
            this.showNotification('Please enter a task', 'error');
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            dueDate: dueDateInput.value,
            category: categoryInput.value,
            notification: notificationInput.checked,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.loadTasks();
        this.updateTaskStats();

        // Reset form
        taskInput.value = '';
        dueDateInput.value = '';
        categoryInput.value = 'personal';
        notificationInput.checked = false;

        this.showNotification('Task added successfully!');
    }

    editTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (!task) return;

        const newText = prompt('Edit your task:', task.text);
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            this.saveTasks();
            this.loadTasks();
            this.showNotification('Task updated successfully!');
        }
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveTasks();
            this.loadTasks();
            this.updateTaskStats();
            this.showNotification('Task deleted successfully!');
        }
    }

    toggleTaskCompletion(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.loadTasks();
            this.updateTaskStats();
            
            const message = task.completed ? 
                'Task marked as completed!' : 
                'Task marked as active!';
            this.showNotification(message);
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

    loadTasks() {
        const tasksList = document.getElementById('tasks-list');
        tasksList.innerHTML = '';

        let filteredTasks = this.tasks;
        
        if (this.currentFilter === 'active') {
            filteredTasks = this.tasks.filter(task => !task.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = this.tasks.filter(task => task.completed);
        }

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <p>No tasks found. Add a new task to get started!</p>
                </div>
            `;
            return;
        }

        // Sort tasks: incomplete first, then by creation date
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'task-completed' : ''}`;
            
            const dueDate = task.dueDate ? 
                new Date(task.dueDate).toLocaleString() : 
                'No due date';
            
            const categoryIcon = this.getCategoryIcon(task.category);
            const categoryName = this.getCategoryName(task.category);
            
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-text">${task.text}</div>
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
                this.toggleTaskCompletion(task.id);
            });
            
            const editBtn = taskItem.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => {
                this.editTask(task.id);
            });
            
            const deleteBtn = taskItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                this.deleteTask(task.id);
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

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
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
            if (task.notification && !task.completed && task.dueDate) {
                const dueDate = new Date(task.dueDate);
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
                    body: `Your task "${task.text}" is due now!`,
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