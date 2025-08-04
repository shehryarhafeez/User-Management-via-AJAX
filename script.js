document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const userTableBody = document.getElementById('userTableBody');
    const addUserBtn = document.getElementById('addUserBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const userModal = document.getElementById('userModal');
    const responseModal = document.getElementById('responseModal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const userForm = document.getElementById('userForm');
    const modalTitle = document.getElementById('modalTitle');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const notification = document.getElementById('notification');
    const responseContent = document.getElementById('responseContent');

    // State variables
    let currentPage = 1;
    let totalPages = 1;
    let users = [];
    let isSearching = false;
    let searchTerm = '';

    // Initialize the dashboard
    initDashboard();

    // Event Listeners
    addUserBtn.addEventListener('click', () => openModal('add'));
    refreshBtn.addEventListener('click', refreshData);
    closeBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
    userForm.addEventListener('submit', handleFormSubmit);
    prevPageBtn.addEventListener('click', goToPrevPage);
    nextPageBtn.addEventListener('click', goToNextPage);
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Initialize dashboard with cached data if available
    function initDashboard() {
        const cachedData = localStorage.getItem('cachedUsers');
        const cachedPage = localStorage.getItem('currentPage');
        const cachedTotalPages = localStorage.getItem('totalPages');
        
        if (cachedData && cachedPage && cachedTotalPages) {
            users = JSON.parse(cachedData);
            currentPage = parseInt(cachedPage);
            totalPages = parseInt(cachedTotalPages);
            updateUserTable(users);
            updatePagination();
            showNotification('Loaded cached data', 'success');
        }
        
        fetchUsers(currentPage);
    }

    // Fetch users from API
    async function fetchUsers(page) {
        showLoading();
        try {
            const response = await fetch(`https://reqres.in/api/users?page=${page}&delay=1`, {
                headers: {
                    'x-api-key': 'reqres-free-v1'
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                showApiResponse({
                    status: response.status,
                    url: response.url,
                    error: data.error || 'Unknown error'
                }, 'error');
                throw new Error(data.error || 'Failed to fetch users');
            }
            
            users = data.data;
            currentPage = data.page;
            totalPages = data.total_pages;
            
            // Initialize job field for each user
            users.forEach(user => {
                if (!user.job) user.job = 'Unknown';
            });
            
            // Cache the data
            localStorage.setItem('cachedUsers', JSON.stringify(users));
            localStorage.setItem('currentPage', currentPage);
            localStorage.setItem('totalPages', totalPages);
            
            updateUserTable(users);
            updatePagination();
            
            // Show API response
            showApiResponse({
                status: response.status,
                url: response.url,
                data: {
                    page: data.page,
                    per_page: data.per_page,
                    total: data.total,
                    total_pages: data.total_pages,
                    users_count: data.data.length
                }
            }, 'success');
        } catch (error) {
            console.error('Error fetching users:', error);
            showNotification(error.message, 'error');
            
            // Fallback to cache
            const cachedUsers = localStorage.getItem('cachedUsers');
            if (cachedUsers) {
                users = JSON.parse(cachedUsers);
                updateUserTable(users);
                showNotification('Showing cached data', 'warning');
            }
        } finally {
            hideLoading();
        }
    }

    // Create new user
    async function createUser(userData) {
        showLoading();
        try {
            const response = await fetch('https://reqres.in/api/users', {
                method: 'POST',
                headers: {
                    'x-api-key': 'reqres-free-v1',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                showApiResponse({
                    status: response.status,
                    url: response.url,
                    error: data.error || 'Unknown error'
                }, 'error');
                throw new Error(data.error || 'Failed to create user');
            }
            
            // Show API response
            showApiResponse({
                status: response.status,
                url: response.url,
                data: data,
                action: 'create'
            }, 'success');
            
            // Simulate adding to local data (since API doesn't persist)
            const newUser = {
                id: data.id,
                first_name: userData.name.split(' ')[0],
                last_name: userData.name.split(' ')[1] || '',
                email: `${userData.name.replace(' ', '.').toLowerCase()}@example.com`,
                avatar: `https://i.pravatar.cc/150?u=${data.id}`,
                job: userData.job
            };
            
            users.unshift(newUser);
            updateUserTable(isSearching ? filterUsers(searchTerm) : users);
            localStorage.setItem('cachedUsers', JSON.stringify(users));
            
            return data;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        } finally {
            hideLoading();
        }
    }

    // Update existing user
    async function updateUser(userId, userData) {
        showLoading();
        try {
            const response = await fetch(`https://reqres.in/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'x-api-key': 'reqres-free-v1',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                showApiResponse({
                    status: response.status,
                    url: response.url,
                    error: data.error || 'Unknown error'
                }, 'error');
                throw new Error(data.error || 'Failed to update user');
            }
            
            // Show API response
            showApiResponse({
                status: response.status,
                url: response.url,
                data: data,
                action: 'update'
            }, 'success');
            
            // Update local data
            const userIndex = users.findIndex(u => u.id == userId);
            if (userIndex !== -1) {
                const [firstName, lastName] = userData.name.split(' ');
                users[userIndex] = {
                    ...users[userIndex],
                    first_name: firstName,
                    last_name: lastName || '',
                    email: `${firstName}.${lastName || ''}@example.com`.toLowerCase(),
                    job: userData.job
                };
                
                updateUserTable(isSearching ? filterUsers(searchTerm) : users);
                localStorage.setItem('cachedUsers', JSON.stringify(users));
            }
            
            return data;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        } finally {
            hideLoading();
        }
    }

    // Delete user
    async function deleteUser(userId) {
        showLoading();
        try {
            const response = await fetch(`https://reqres.in/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'x-api-key': 'reqres-free-v1'
                }
            });
            
            if (response.status !== 204) {
                const data = await response.json().catch(() => ({}));
                showApiResponse({
                    status: response.status,
                    url: response.url,
                    error: data.error || 'Unknown error'
                }, 'error');
                throw new Error(data.error || 'Failed to delete user');
            }
            
            // Show API response
            showApiResponse({
                status: response.status,
                url: response.url,
                action: 'delete'
            }, 'success');
            
            // Remove from local data
            users = users.filter(user => user.id != userId);
            updateUserTable(isSearching ? filterUsers(searchTerm) : users);
            localStorage.setItem('cachedUsers', JSON.stringify(users));
            
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        } finally {
            hideLoading();
        }
    }

    // Update user table UI
    function updateUserTable(usersToDisplay) {
        userTableBody.innerHTML = '';
        
        if (usersToDisplay.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="7" style="text-align: center;">No users found</td>`;
            userTableBody.appendChild(row);
            return;
        }
        
        usersToDisplay.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td><img src="${user.avatar}" alt="Avatar" class="avatar"></td>
                <td>${user.first_name}</td>
                <td>${user.last_name}</td>
                <td>${user.email}</td>
                <td>${user.job}</td>
                <td class="action-buttons">
                    <button class="btn btn-secondary edit-btn" data-id="${user.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger delete-btn" data-id="${user.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            userTableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openModal('edit', btn.dataset.id));
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this user?')) {
                    deleteUser(btn.dataset.id);
                }
            });
        });
    }

    // Open modal for add/edit
    function openModal(action, userId = null) {
        if (action === 'add') {
            modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Add New User';
            userForm.reset();
            document.getElementById('userId').value = '';
        } else if (action === 'edit' && userId) {
            modalTitle.innerHTML = '<i class="fas fa-user-edit"></i> Edit User';
            const user = users.find(u => u.id == userId);
            if (user) {
                document.getElementById('userId').value = user.id;
                document.getElementById('firstName').value = user.first_name;
                document.getElementById('lastName').value = user.last_name;
                document.getElementById('email').value = user.email;
                document.getElementById('job').value = user.job;
            }
        }
        userModal.style.display = 'block';
    }

    // Close all modals
    function closeAllModals() {
        userModal.style.display = 'none';
        responseModal.style.display = 'none';
    }

    // Handle form submission
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const userId = document.getElementById('userId').value;
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const job = document.getElementById('job').value.trim() || 'Unknown';
        
        if (!firstName || !lastName || !email) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const userData = {
            name: `${firstName} ${lastName}`,
            job: job
        };
        
        try {
            if (userId) {
                await updateUser(userId, userData);
            } else {
                await createUser(userData);
            }
            userModal.style.display = 'none';
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    // Show API response in modal
    function showApiResponse(responseData, type) {
        let responseHTML = `
            <div class="response-header ${type}">
                <h3><i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> 
                    API Response (${type === 'success' ? 'Success' : 'Error'})
                </h3>
                <p><strong>Status:</strong> <span class="status-code">${responseData.status}</span></p>
                <p><strong>Endpoint:</strong> <code>${responseData.url}</code></p>
        `;
        
        if (responseData.error) {
            responseHTML += `
                <div class="error-message">
                    <p><strong>Error:</strong> ${responseData.error}</p>
                </div>
            `;
        }
        
        if (responseData.data) {
            responseHTML += `
                <div class="response-data">
                    <p><strong>Response Data:</strong></p>
                    <pre>${JSON.stringify(responseData.data, null, 2)}</pre>
                </div>
            `;
        }
        
        if (responseData.action === 'delete') {
            responseHTML += `
                <div class="success-message">
                    <p>User deleted successfully (simulated in UI)</p>
                </div>
            `;
        }
        
        responseHTML += `</div>`;
        responseContent.innerHTML = responseHTML;
        responseModal.style.display = 'block';
    }

    // Update pagination UI
    function updatePagination() {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    // Go to previous page
    function goToPrevPage() {
        if (currentPage > 1) {
            currentPage--;
            fetchUsers(currentPage);
        }
    }

    // Go to next page
    function goToNextPage() {
        if (currentPage < totalPages) {
            currentPage++;
            fetchUsers(currentPage);
        }
    }

    // Handle search
    function handleSearch() {
        searchTerm = searchInput.value.trim();
        isSearching = searchTerm !== '';
        
        if (!isSearching) {
            fetchUsers(currentPage);
            return;
        }
        
        const filteredUsers = filterUsers(searchTerm);
        updateUserTable(filteredUsers);
    }

    // Filter users based on search term
    function filterUsers(term) {
        term = term.toLowerCase();
        return users.filter(user => 
            user.first_name.toLowerCase().includes(term) ||
            user.last_name.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            user.job.toLowerCase().includes(term)
        );
    }

    // Refresh data
    function refreshData() {
        localStorage.removeItem('cachedUsers');
        localStorage.removeItem('currentPage');
        localStorage.removeItem('totalPages');
        fetchUsers(1);
        showNotification('Data refreshed successfully', 'success');
    }

    // Show loading spinner
    function showLoading() {
        loadingSpinner.style.display = 'flex';
    }

    // Hide loading spinner
    function hideLoading() {
        loadingSpinner.style.display = 'none';
    }

    // Show notification
    function showNotification(message, type) {
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                          type === 'error' ? 'times-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        notification.className = 'notification';
        notification.classList.add(type, 'show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === userModal || e.target === responseModal) {
            closeAllModals();
        }
    });
});
