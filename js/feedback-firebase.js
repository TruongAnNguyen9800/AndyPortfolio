/* Get Firebase references exposed by the module script */
let database = window.firebaseDb;
let ref = window.firebaseRef;
let set = window.firebaseSet;
let onValue = window.firebaseOnValue;

/* Wait for Firebase to be initialized */
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const checkDatabase = setInterval(() => {
            database = window.firebaseDb;
            ref = window.firebaseRef;
            set = window.firebaseSet;
            onValue = window.firebaseOnValue;

            if (database && ref && set && onValue) {
                clearInterval(checkDatabase);
                console.log('Database is ready');
                resolve();
            } else if (++attempts > 50) {
                clearInterval(checkDatabase);
                console.error('Firebase not initialized correctly. Check the <script type="module"> block.');
                reject(new Error('Firebase not initialized'));
            }
        }, 100);
    });
}


/* Form state */
let feedbackSubmitted = false;

/* DOM Elements */
const feedbackForm = document.getElementById('feedbackForm');
const feedbackList = document.getElementById('feedbackList');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const categorySelect = document.getElementById('category');
const messageInput = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn');
const errorMessage = document.getElementById('errorMessage');
const syncStatus = document.getElementById('syncStatus');

/* Initialize */
document.addEventListener('DOMContentLoaded', async () => {
    await waitForFirebase();
    loadFeedback();
    setupFormListener();
});

/* Form submission */
function setupFormListener() {
    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitFeedback();
    });
}

/* Submit feedback to Firebase */
async function submitFeedback() {
    const feedback = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        category: categorySelect.value,
        message: messageInput.value.trim(),
        timestamp: new Date().toISOString(),
        id: Date.now()
    };

    /* Validate input */
    if (!feedback.name || !feedback.email || !feedback.message) {
        showErrorToast('Please fill in all required fields');

        if (!feedback.name) {
            nameInput.focus();
        } else if (!feedback.email) {
            emailInput.focus();
        } else if (!feedback.category) {
            categorySelect.focus();
        } else if (!feedback.message) {
            messageInput.focus();
        }

        return;
    }

    try {
        /* Show loading state */
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Submitting...';
        errorMessage.classList.remove('show');

        /* Save to Firebase (modular API) */
        const feedbackRef = ref(database, 'feedbacks/' + feedback.id);
        await set(feedbackRef, feedback);

        /* Show success message */
        showSuccessMessage();

        /* Reset form */
        feedbackForm.reset();

        /* Reload feedback list */
        loadFeedback();
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showError('Failed to submit feedback. Please check your internet connection.');
    } finally {
        /* Reset button state */
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Feedback';
    }
}

/* Show error message */
function showErrorToast(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    // fade in
    requestAnimationFrame(() => {
        errorDiv.classList.add('show');
    });

    // auto-hide
    setTimeout(() => {
        errorDiv.classList.remove('show');
        setTimeout(() => errorDiv.remove(), 250);
    }, 4000);
}


/* Show success message */
function showSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = 'Thank you! Your feedback has been submitted.';

    // Append to body so it floats over everything
    document.body.appendChild(successDiv);

    // Trigger fade-in
    requestAnimationFrame(() => {
        successDiv.classList.add('show');
    });

    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.classList.remove('show');
        setTimeout(() => successDiv.remove(), 250);
    }, 3000);
}


/* Load feedback from Firebase in real-time */
function loadFeedback() {
    const feedbacksRef = ref(database, 'feedbacks');

    onValue(feedbacksRef, (snapshot) => {
        feedbackList.innerHTML = '';
        const allFeedback = [];

        snapshot.forEach((child) => {
            allFeedback.push(child.val());
        });

        if (allFeedback.length === 0) {
            feedbackList.innerHTML =
                '<p style="text-align: center; color: var(--color-text-secondary, #626c71);">No feedback yet. Be the first to share!</p>';
            updateSyncStatus('synced', 'No feedbacks');
            return;
        }

        /* Display feedback in reverse order (newest first) */
        allFeedback.reverse().forEach((feedback, index) => {
            const feedbackItem = createFeedbackElement(feedback);
            feedbackList.appendChild(feedbackItem);

            /* Trigger reveal animation */
            setTimeout(() => {
                triggerReveal(feedbackItem);
            }, index * 100);
        });

        updateSyncStatus('synced', `${allFeedback.length} feedback(s)`);
    }, (error) => {
        console.error('Error loading feedbacks:', error);
        showError('Failed to load feedbacks. Check your Firebase config.');
        updateSyncStatus('error', 'Connection error');
    });
}

/* Update sync status */

function updateSyncStatus(status, message) {
    if (!syncStatus) return;

    if (status === 'synced') {
        syncStatus.className = 'sync-status synced';
        syncStatus.innerHTML = '✓ Synced • ' + message;
    } else if (status === 'error') {
        syncStatus.className = 'sync-status error';
        syncStatus.innerHTML = '✗ ' + message;
    } else {
        syncStatus.className = 'sync-status';
        syncStatus.innerHTML = '<span class="loading"></span> Syncing...';
    }
}


/* Create feedback element */
function createFeedbackElement(feedback) {
    const item = document.createElement('div');
    item.className = 'feedback-item reveal';

    const timestamp = formatDate(feedback.timestamp);
    const categoryLabel = getCategoryLabel(feedback.category);

    item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
                <h4 style="margin: 0 0 4px 0;">${escapeHtml(feedback.name)}</h4>
                <p style="margin: 0; font-size: 12px; color: var(--color-text-secondary, #626c71);">
                    ${escapeHtml(feedback.email)} • ${timestamp}
                </p>
            </div>
            <span style="
                display: inline-block;
                padding: 4px 8px;
                background: rgba(33, 128, 141, 0.1);
                color: var(--color-primary, #218085);
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
                text-transform: uppercase;
            ">${categoryLabel}</span>
        </div>
        <p style="margin: 12px 0 0 0; line-height: 1.5;">${escapeHtml(feedback.message)}</p>
    `;

    return item;
}

/* Format date */
function formatDate(isoDate) {
    const date = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric'
        });
    }
}

/* Get category label */
function getCategoryLabel(category) {
    const labels = {
        'bug': 'Bug Report',
        'feature': 'Feature Request',
        'general': 'General',
        'other': 'Other'
    };
    return labels[category] || category;
}

/* Escape HTML to prevent XSS */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/* Trigger reveal animation */
function triggerReveal(element) {
    element.classList.add('active');
}

