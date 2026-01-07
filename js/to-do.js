/* Get Firebase references exposed by the module script */
let database = window.firebaseDb;
let ref = window.firebaseRef;
let set = window.firebaseSet;
let onValue = window.firebaseOnValue;
let push = window.firebasePush;
let remove = window.firebaseRemove;

/* Wait for Firebase to be initialized */
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const checkDatabase = setInterval(() => {
            database = window.firebaseDb;
            ref = window.firebaseRef;
            set = window.firebaseSet;
            onValue = window.firebaseOnValue;
            push = window.firebasePush;
            remove = window.firebaseRemove;

            if (database && ref && set && onValue && push && remove) {
                clearInterval(checkDatabase);
                console.log('Database is ready');
                resolve();
            } else if (++attempts > 50) {
                clearInterval(checkDatabase);
                console.error('Firebase not initialized correctly.');
                reject(new Error('Firebase not initialized'));
            }
        }, 100);
    });
}

/* App state */
let todos = [];
let currentFilter = 'all';

/* DOM Elements */
const modalOverlay = document.getElementById('modalOverlay');
const openFormBtn = document.getElementById('openFormBtn');
const closeFormBtn = document.getElementById('closeFormBtn');
const todoForm = document.getElementById('todoForm');
const todoTitle = document.getElementById('todoTitle');
const todoDescription = document.getElementById('todoDescription');
const todoPriority = document.getElementById('todoPriority');
const submitBtn = document.getElementById('submitBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const syncStatus = document.getElementById('syncStatus');
const filterBtns = document.querySelectorAll('.filter-btn');

/* Init */
document.addEventListener('DOMContentLoaded', async () => {
    await waitForFirebase();
    loadTodos();
    setupFormListener();
});

/* Modal Controls */
openFormBtn.addEventListener('click', () => {
    modalOverlay.classList.add('active');
});

closeFormBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

function closeModal() {
    modalOverlay.classList.remove('active');
}

/* Form listener */
function setupFormListener() {
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitTodo();
    });
}

/* Submit todo */
async function submitTodo() {
    const todo = {
        title: todoTitle.value.trim(),
        description: todoDescription.value.trim(),
        priority: todoPriority.value,
        completed: false,
        createdAt: new Date().toISOString(),
        id: Date.now()
    };

    /* Validation — TOAST ONLY */
    if (!todo.title || !todo.priority) {
        showErrorToast('Please fill in all required fields');

        if (!todo.title) {
            todoTitle.focus();
        } else {
            todoPriority.focus();
        }
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading">Adding...</span>';

        const todoRef = ref(database, `todos/${todo.id}`);
        await set(todoRef, todo);

        showSuccessMessage();
        todoForm.reset();
        closeModal();
        loadTodos();
    } catch (error) {
        console.error('Error submitting todo:', error);
        showErrorToast('Failed to add task. Please check your internet connection.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Add Task';
    }
}

/* Error toast */
function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    }, 4000);
}

/* Success toast */
function showSuccessMessage() {
    const toast = document.createElement('div');
    toast.className = 'success-message';
    toast.textContent = 'Task added successfully!';
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}

/* Load todos */
function loadTodos() {
    const todosRef = ref(database, 'todos');
    onValue(todosRef, (snapshot) => {
        todoList.innerHTML = '';
        const allTodos = [];

        snapshot.forEach(child => allTodos.push(child.val()));

        if (!allTodos.length) {
            emptyState.style.display = 'block';
            updateSyncStatus('synced', 'No tasks yet');
            return;
        }

        emptyState.style.display = 'none';

        allTodos.reverse().forEach((todo, index) => {
            const el = createTodoElement(todo);
            todoList.appendChild(el);
            setTimeout(() => triggerReveal(el), index * 100);
        });

        updateSyncStatus('synced', `${allTodos.length} tasks`);
        filterTodos();
    }, () => {
        showErrorToast('Failed to load tasks.');
        updateSyncStatus('error', 'Connection error');
    });
}

/* Filtering */
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        filterTodos();
    });
});

function filterTodos() {
    document.querySelectorAll('.todo-item').forEach(item => {
        const completed = item.classList.contains('completed');

        item.style.display =
            currentFilter === 'all' ||
            (currentFilter === 'active' && !completed) ||
            (currentFilter === 'completed' && completed)
                ? 'flex'
                : 'none';
    });
}

/* Sync status */
function updateSyncStatus(status, message) {
    if (!syncStatus) return;

    syncStatus.className = `sync-status ${status}`;
    syncStatus.innerHTML = message;
}

/* Create todo item */
function createTodoElement(todo) {
    const item = document.createElement('div');
    item.className = `todo-item reveal ${todo.completed ? 'completed' : ''}`;

    item.innerHTML = `
        <input type="checkbox" class="checkbox" ${todo.completed ? 'checked' : ''}>
        <div class="todo-content">
            <div class="todo-title">${escapeHtml(todo.title)}</div>
            ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
            <div class="todo-meta">
                <span class="todo-priority ${todo.priority}">${todo.priority}</span>
                <span class="todo-time">${formatDate(todo.createdAt)}</span>
            </div>
        </div>
        <button class="delete-btn">🗑️</button>
    `;

    item.querySelector('.checkbox').addEventListener('change', e => {
        set(ref(database, `todos/${todo.id}`), { ...todo, completed: e.target.checked });
    });

    item.querySelector('.delete-btn').addEventListener('click', () => {
        remove(ref(database, `todos/${todo.id}`));
    });

    return item;
}

/* Utils */
function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    const map = { '&':'amp','<':'lt','>':'gt','"':'quot',"'" :'#039' };
    return text.replace(/[&<>"']/g, m => `&${map[m]};`);
}

function triggerReveal(el) {
    el.classList.add('active');
}
