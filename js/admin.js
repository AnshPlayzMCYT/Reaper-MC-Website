const API_URL = window.location.origin.includes('localhost') ? 'http://localhost:3000/api' : `${window.location.origin}/api`;
const defaultSkinUrl = 'https://mc-heads.net/avatar/MHF_Steve/40';

// DOM Elements
const usersTableBody = document.getElementById('users-table-body');
const statTotalUsers = document.getElementById('stat-total-users');
const refreshBtn = document.getElementById('refresh-users-btn');
const notificationBanner = document.getElementById('admin-notification');
const modalsContainer = document.getElementById('modals');

// State
let usersList = [];
let authToken = sessionStorage.getItem('admin_token');

// Enforce Auth
if (!authToken) {
    window.location.href = '/admin-login';
}

const handleApiError = async (response) => {
    if (response.status === 401 || response.status === 403) {
        sessionStorage.removeItem('admin_token');
        window.location.href = '/admin-login';
        return;
    }
    const data = await response.json();
    throw new Error(data.error || 'API Request Failed');
};

const showNotification = (message, type = 'success') => {
    if (type === 'success') {
        showSuccessTickModal(message);
        return;
    }

    notificationBanner.textContent = message;
    notificationBanner.className = `p-4 mb-6 text-sm font-semibold rounded-lg transition-all bg-red-500/10 border border-red-500/50 text-red-500`;
    notificationBanner.classList.remove('hidden');

    setTimeout(() => {
        notificationBanner.classList.add('hidden');
    }, 4000);
};

// Custom Modals
const showConfirmModal = (title, message, confirmText, confirmColorClass, onConfirm) => {
    const modalId = 'confirm-modal-' + Date.now();
    const modalHtml = `
        <div id="${modalId}" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 opacity-0 transition-opacity duration-200">
            <div id="${modalId}-box" class="bg-brand-light border border-brand-border rounded-xl shadow-2xl max-w-sm w-full p-6 text-center transform scale-95 transition-transform duration-200">
                <div class="mb-4">
                    <i class="ri-error-warning-line text-5xl ${confirmColorClass.includes('red') ? 'text-red-500' : 'text-orange-500'}"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">${title}</h3>
                <p class="text-sm text-brand-text mb-6">${message}</p>
                <div class="flex gap-3">
                    <button onclick="closeCustomModal('${modalId}')" class="flex-1 bg-brand-darkest hover:bg-brand-dark border border-brand-border text-white py-2 rounded-lg font-semibold transition-colors">Cancel</button>
                    <button id="${modalId}-confirm" class="flex-1 ${confirmColorClass} text-white py-2 rounded-lg font-semibold transition-colors">${confirmText}</button>
                </div>
            </div>
        </div>
    `;
    modalsContainer.insertAdjacentHTML('beforeend', modalHtml);

    // Animate in
    setTimeout(() => {
        const m = document.getElementById(modalId);
        const b = document.getElementById(`${modalId}-box`);
        if (m) m.classList.remove('opacity-0');
        if (b) b.classList.remove('scale-95');
    }, 10);

    document.getElementById(`${modalId}-confirm`).addEventListener('click', () => {
        closeCustomModal(modalId);
        onConfirm();
    });
};

const showSuccessTickModal = (message) => {
    const modalId = 'success-modal-' + Date.now();
    const modalHtml = `
        <div id="${modalId}" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[300] p-4 opacity-0 transition-opacity duration-300">
            <div id="${modalId}-box" class="bg-brand-light border border-brand-border rounded-xl shadow-2xl p-8 text-center flex flex-col items-center justify-center transform scale-90 transition-transform duration-300">
                <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <svg class="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" class="" style="stroke-dasharray: 50; stroke-dashoffset: 50; animation: drawTick 0.4s ease-out forwards; animation-delay: 0.2s;"></path>
                    </svg>
                </div>
                <h3 class="text-2xl font-black text-white mb-1">Success</h3>
                <p class="text-sm text-brand-text">${message}</p>
            </div>
        </div>
        <style>
            @keyframes drawTick {
                to { stroke-dashoffset: 0; }
            }
        </style>
    `;
    modalsContainer.insertAdjacentHTML('beforeend', modalHtml);

    // Animate in
    setTimeout(() => {
        const m = document.getElementById(modalId);
        const b = document.getElementById(`${modalId}-box`);
        if (m) m.classList.remove('opacity-0');
        if (b) b.classList.remove('scale-90');
    }, 10);

    // Auto remove
    setTimeout(() => {
        closeCustomModal(modalId);
    }, 2000);
};

window.closeCustomModal = (id) => {
    const m = document.getElementById(id);
    if (m) {
        m.classList.add('opacity-0');
        setTimeout(() => m.remove(), 200);
    }
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Fetch Users
const loadUsers = async () => {
    usersTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="p-8 text-center text-brand-text">
                <i class="ri-loader-4-line animate-spin text-3xl inline-block mb-2"></i>
                <p>Loading users...</p>
            </td>
        </tr>
    `;

    try {
        if (!authToken) return;

        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            await handleApiError(response);
            throw new Error('Failed to fetch users');
        }

        usersList = await response.json();

        // Update Stats
        statTotalUsers.textContent = usersList.length;

        renderTable();
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Could not connect to the Backend API. Is it running?', 'error');
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="p-8 text-center text-red-400">
                    <i class="ri-error-warning-line text-3xl inline-block mb-2"></i>
                    <p>Failed to load users.</p>
                </td>
            </tr>
        `;
    }
};

// Render Table
const renderTable = () => {
    if (usersList.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-brand-text">
                    <i class="ri-user-line text-3xl inline-block mb-2"></i>
                    <p>No users found.</p>
                </td>
            </tr>
        `;
        return;
    }

    usersTableBody.innerHTML = usersList.map(user => {
        const displayName = user.displayName || 'Unknown';
        const imgName = user.displayName ? user.displayName : 'MHF_Steve';
        const rank = (user.customClaims && user.customClaims.rank) ? user.customClaims.rank : 'Member';
        
        // Setup rank styling
        let rankClass = 'bg-brand-border text-brand-text';
        if (rank === 'VIP') rankClass = 'bg-primary/20 text-primary border border-primary/30';
        else if (rank === 'VIP+') rankClass = 'bg-secondary/20 text-secondary border border-secondary/30';
        else if (rank === 'MVP') rankClass = 'bg-pink-500/20 text-pink-500 border border-pink-500/30';
        else if (rank === 'MVP+') rankClass = 'bg-blue-500/20 text-blue-500 border border-blue-500/30';
        else if (rank === 'Legend') rankClass = 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
        else if (rank === 'Immortal') rankClass = 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30';

        return `
        <tr class="hover:bg-brand-light/30 transition-colors group">
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <img src="https://mc-heads.net/avatar/${imgName}/40" class="w-10 h-10 rounded shadow-sm border border-brand-border" style="image-rendering: pixelated;" onerror="this.src='${defaultSkinUrl}'">
                    <div>
                        <p class="font-bold text-white">${displayName}</p>
                        <p class="text-[10px] text-brand-text font-mono">${user.uid.substring(0, 10)}...</p>
                    </div>
                </div>
            </td>
            <td class="p-4 text-sm text-brand-text">${user.email}</td>
            <td class="p-4 text-sm font-bold">
                <span class="px-2 py-1 rounded text-xs ${rankClass}">${rank}</span>
            </td>
            <td class="p-4 text-sm">
                ${user.disabled
                ? '<span class="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-semibold border border-red-500/30">Disabled</span>'
                : '<span class="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-semibold border border-green-500/30">Active</span>'
            }
            </td>
            <td class="p-4 text-sm text-brand-text">${formatDate(user.metadata?.creationTime)}</td>
            <td class="p-4 text-sm text-brand-text">${formatDate(user.metadata?.lastSignInTime)}</td>
            <td class="p-4">
                <div class="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3 sm:gap-4">
                    <button onclick="toggleDisableStatus('${user.uid}', ${!!user.disabled})" class="relative inline-flex shrink-0 items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${user.disabled ? 'bg-red-500' : 'bg-green-500'}" title="${user.disabled ? 'Enable User' : 'Disable User'}">
                        <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${user.disabled ? 'translate-x-1' : 'translate-x-6'}"></span>
                    </button>
                    <div class="flex gap-2 shrink-0">
                        <button onclick="openEditModal('${user.uid}', '${displayName}', '${rank}')" class="text-brand-blue hover:text-white p-2 rounded hover:bg-brand-blue/20 transition-colors" title="Edit Properties">
                            <i class="ri-edit-line z-10 relative"></i>
                        </button>
                        <button onclick="confirmDelete('${user.uid}', '${user.email}')" class="text-red-500 hover:text-red-400 p-2 rounded hover:bg-red-500/20 transition-colors" title="Delete User">
                            <i class="ri-delete-bin-line z-10 relative"></i>
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    `}).join('');
};

// --- Actions ---

window.toggleDisableStatus = async (uid, currentStatus) => {
    const actionName = currentStatus ? 'enable' : 'disable';
    showConfirmModal(
        `Confirm ${actionName.charAt(0).toUpperCase() + actionName.slice(1)}`,
        `Are you sure you want to ${actionName} this user account?`,
        `Yes, ${actionName}`,
        currentStatus ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600',
        async () => {
            try {
                if (!authToken) {
                    showNotification('Authentication token not available. Please log in.', 'error');
                    return;
                }
                const response = await fetch(`${API_URL}/users/${uid}/status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ disabled: !currentStatus })
                });

                if (response.ok) {
                    showNotification(`User has been ${!currentStatus ? 'disabled' : 'enabled'}.`);
                    loadUsers();
                } else {
                    await handleApiError(response);
                }
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    );
};

window.confirmDelete = (uid, email) => {
    showConfirmModal(
        `Delete Account`,
        `Are you absolutely sure you want to permanently delete user: <strong class="text-white">${email}</strong>?<br>This action cannot be undone.`,
        `Delete User`,
        `bg-red-500 hover:bg-red-600`,
        () => {
            deleteUser(uid);
        }
    );
};

const deleteUser = async (uid) => {
    try {
        if (!authToken) {
            showNotification('Authentication token not available. Please log in.', 'error');
            return;
        }
        const response = await fetch(`${API_URL}/users/${uid}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            showNotification('User permanently deleted.');
            loadUsers();
        } else {
            await handleApiError(response);
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
};

// --- Modals ---

window.openEditModal = (uid, currentUsername, currentRank) => {
    const ranks = ['Member', 'VIP', 'VIP+', 'MVP', 'MVP+', 'Legend', 'Immortal'];
    const rankOptions = ranks.map(r => `<option value="${r}" ${r === currentRank ? 'selected' : ''}>${r}</option>`).join('');

    const modalHtml = `
        <div id="edit-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div class="bg-brand-light border border-brand-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
                
                <div class="p-6 border-b border-brand-border flex justify-between items-center bg-brand-dark">
                    <h3 class="text-xl font-bold text-white">Edit User</h3>
                    <button onclick="closeModal('edit-modal')" class="text-brand-text hover:text-white transition-colors">
                        <i class="ri-close-line text-2xl"></i>
                    </button>
                </div>

                <div class="p-6 space-y-6 overflow-y-auto">
                    <!-- Update Username Form -->
                    <div class="bg-brand-darkest p-4 rounded-lg border border-brand-border">
                        <h4 class="font-semibold text-white mb-3 text-sm">Change Minecraft Username</h4>
                        <div class="flex gap-2">
                            <input type="text" id="edit-username-input" value="${currentUsername === 'Unknown' ? '' : currentUsername}" placeholder="New Username" 
                                class="flex-grow bg-brand-dark border border-brand-border rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-brand-blue">
                            <button onclick="updateUsername('${uid}')" class="bg-brand-blue hover:bg-brand-blue/80 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                Update
                            </button>
                        </div>
                    </div>

                    <!-- Update Rank Form -->
                    <div class="bg-brand-darkest p-4 rounded-lg border border-brand-border">
                        <h4 class="font-semibold text-white mb-3 text-sm">Change Rank</h4>
                        <div class="flex gap-2">
                            <select id="edit-rank-input" class="flex-grow bg-brand-dark border border-brand-border rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-brand-blue font-semibold">
                                ${rankOptions}
                            </select>
                            <button onclick="updateRank('${uid}')" class="bg-orange-500 hover:bg-orange-500/80 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                Update
                            </button>
                        </div>
                    </div>

                    <!-- Update Password Form -->
                    <div class="bg-brand-darkest p-4 rounded-lg border border-brand-border">
                        <h4 class="font-semibold text-white mb-3 text-sm">Change Password</h4>
                        <div class="flex gap-2">
                            <input type="password" id="edit-password-input" placeholder="New Password (min 6 chars)" 
                                class="flex-grow bg-brand-dark border border-brand-border rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-brand-blue">
                            <button onclick="updatePassword('${uid}')" class="bg-secondary hover:bg-secondary/80 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                Update
                            </button>
                        </div>
                        <p class="text-xs text-brand-text mt-2"><i class="ri-information-line"></i> This will immediately log the user out everywhere.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    modalsContainer.innerHTML = modalHtml;
};

window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
};

window.updateUsername = async (uid) => {
    const input = document.getElementById('edit-username-input');
    const username = input.value.trim();

    if (!username) return showNotification('Username cannot be empty', 'error');

    showConfirmModal(
        `Change Username`,
        `Are you sure you want to change this user's Minecraft Username to <strong class="text-white">${username}</strong>?`,
        `Change Username`,
        `bg-brand-blue hover:bg-brand-blue/80`,
        async () => {
            try {
                const response = await fetch(`${API_URL}/users/${uid}/username`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ username })
                });

                if (response.ok) {
                    showNotification('Username updated successfully.');
                    closeModal('edit-modal');
                    loadUsers();
                } else {
                    await handleApiError(response);
                }
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    );
};

window.updatePassword = async (uid) => {
    const input = document.getElementById('edit-password-input');
    const password = input.value.trim();

    if (password.length < 6) return showNotification('Password must be at least 6 characters', 'error');

    showConfirmModal(
        `Change Password`,
        `Are you sure you want to force a password change? This will instantly log the user out of all devices.`,
        `Change Password`,
        `bg-secondary hover:bg-secondary/80`,
        async () => {
            try {
                const response = await fetch(`${API_URL}/users/${uid}/password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ password })
                });

                if (response.ok) {
                    showNotification('Password changed successfully.');
                    closeModal('edit-modal');
                    input.value = '';
                } else {
                    await handleApiError(response);
                }
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    );
};

window.updateRank = async (uid) => {
    const input = document.getElementById('edit-rank-input');
    const rank = input.value;

    showConfirmModal(
        `Change Rank`,
        `Are you sure you want to assign the rank <strong class="text-white">${rank}</strong> to this user?`,
        `Assign Rank`,
        `bg-orange-500 hover:bg-orange-600`,
        async () => {
            try {
                const response = await fetch(`${API_URL}/users/${uid}/rank`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ rank })
                });

                if (response.ok) {
                    showNotification('Rank changed successfully.');
                    closeModal('edit-modal');
                    loadUsers();
                } else {
                    await handleApiError(response);
                }
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    );
};

// Initialization
refreshBtn.addEventListener('click', loadUsers);

const logoutBtn = document.getElementById('admin-logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('admin_token');
        window.location.href = '/admin-login';
    });
}

// Initial Data Load (If token exists)
if (authToken) {
    loadUsers();
}
