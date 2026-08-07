// ============ INVENTORY DATA ============
const inventoryData = [
    { id: 1, name: 'CONDUIT PIPE 20MM HEAVY', category: 'pipes', quantity: 40, unit: 'Pcs', unitCost: 75, status: 'high' },
    { id: 2, name: 'FEMALE ELBOW 25X3/4', category: 'fittings', quantity: 30, unit: 'Pcs', unitCost: 30, status: 'high' },
    { id: 3, name: 'GATE VALVE 3/4" LR', category: 'valves', quantity: 2, unit: 'Pcs', unitCost: 500, status: 'low' },
    { id: 4, name: 'GI LONG NIPPLE 3/4"', category: 'fittings', quantity: 20, unit: 'Pcs', unitCost: 35, status: 'medium' },
    { id: 5, name: 'GUTTER ANGLE', category: 'gutters', quantity: 20, unit: 'Pcs', unitCost: 290, status: 'medium' },
    { id: 6, name: 'GUTTER END CUP', category: 'gutters', quantity: 28, unit: 'Pcs', unitCost: 65, status: 'medium' },
    { id: 7, name: 'GUTTER PIPE', category: 'gutters', quantity: 20, unit: 'Pcs', unitCost: 950, status: 'medium' },
    { id: 8, name: 'LOCKABLE TAP 1/2" LR', category: 'taps', quantity: 3, unit: 'Pcs', unitCost: 450, status: 'low' },
    { id: 9, name: 'LOCKABLE TAP 3/4" LR', category: 'taps', quantity: 2, unit: 'Pcs', unitCost: 484, status: 'low' },
    { id: 10, name: 'MANHOLE 12X12', category: 'fittings', quantity: 15, unit: 'Pcs', unitCost: 470, status: 'medium' },
    { id: 11, name: 'ORDINARY TAP 1/2" LR', category: 'taps', quantity: 2, unit: 'Pcs', unitCost: 250, status: 'low' },
    { id: 12, name: 'SQUARE BOWL HEAVY', category: 'bowls', quantity: 5, unit: 'Pcs', unitCost: 1100, status: 'low' },
    { id: 13, name: 'TOP FLUSH KENPLASTIC', category: 'fittings', quantity: 5, unit: 'Pcs', unitCost: 1200, status: 'low' },
    { id: 14, name: 'WASTE BEND 2" 45 CEELANT', category: 'waste', quantity: 15, unit: 'Pcs', unitCost: 35, status: 'medium' },
    { id: 15, name: 'WASTE BEND 3" CEELANT', category: 'waste', quantity: 20, unit: 'Pcs', unitCost: 7.5, status: 'medium' },
    { id: 16, name: 'WASTE PIPE 1 1/2"', category: 'waste', quantity: 50, unit: 'Pcs', unitCost: 14.9, status: 'high' },
    { id: 17, name: 'WASTE PIPE 2"', category: 'waste', quantity: 24, unit: 'Pcs', unitCost: 31, status: 'high' },
    { id: 18, name: 'WASTE PIPE 3" GREY', category: 'waste', quantity: 44, unit: 'Pcs', unitCost: 38.4, status: 'high' },
    { id: 19, name: 'WASTE PIPE 4" BROWN', category: 'waste', quantity: 2, unit: 'Pcs', unitCost: 98.5, status: 'low' },
    { id: 20, name: 'WASTE PIPE 4" WHITE', category: 'waste', quantity: 16, unit: 'Pcs', unitCost: 85, status: 'medium' },
    { id: 21, name: 'WASTE PIPE 6" GREY', category: 'waste', quantity: 5, unit: 'Pcs', unitCost: 200, status: 'low' },
    { id: 22, name: 'WASTE PLUG 3"', category: 'fittings', quantity: 10, unit: 'Pcs', unitCost: 10, status: 'medium' },
];

// ============ LOGIN FUNCTIONALITY ============
function handleLogin(email, password) {
    if (email && password) {
        // Store user session
        const user = {
            email: email,
            name: email.split('@')[0],
            loggedIn: true,
            loginTime: new Date()
        };
        localStorage.setItem('flighting_user', JSON.stringify(user));
        return true;
    }
    return false;
}

// Check if user is logged in
function checkLogin() {
    const user = localStorage.getItem('flighting_user');
    if (!user && window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'index.html';
    }
    return user ? JSON.parse(user) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('flighting_user');
    window.location.href = 'index.html';
}

// ============ LOGIN PAGE SCRIPT ============
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMessage');
        
        if (email && password) {
            if (handleLogin(email, password)) {
                // Show success message
                errorMsg.textContent = '✓ Login successful! Redirecting...';
                errorMsg.style.color = '#27ae60';
                errorMsg.style.display = 'block';
                
                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }
        } else {
            errorMsg.textContent = '❌ Please fill in all fields';
            errorMsg.style.color = '#e74c3c';
            errorMsg.style.display = 'block';
        }
    });
}

// ============ DASHBOARD PAGE SCRIPT ============
if (document.getElementById('inventoryTable')) {
    // Check login on page load
    window.addEventListener('DOMContentLoaded', function() {
        const user = checkLogin();
        if (user) {
            // Update user info in sidebar
            document.getElementById('userName').textContent = user.name.toUpperCase();
            document.getElementById('userEmail').textContent = user.email;
            document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
            
            // Load inventory data
            loadInventory();
            updateStatistics();
        }
    });
    
    // Load inventory data into table
    function loadInventory(filteredData = null) {
        const tableBody = document.getElementById('tableBody');
        const data = filteredData || inventoryData;
        
        tableBody.innerHTML = '';
        
        data.forEach(item => {
            const totalValue = item.quantity * item.unitCost;
            const statusClass = `status-${item.status}`;
            const statusText = item.status.charAt(0).toUpperCase() + item.status.slice(1);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td>${item.category.toUpperCase()}</td>
                <td>${item.quantity}</td>
                <td>${item.unit}</td>
                <td>KSh ${item.unitCost.toFixed(2)}</td>
                <td>KSh ${totalValue.toLocaleString()}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-edit" onclick="editItem(${item.id})">Edit</button>
                        <button class="action-btn btn-delete" onclick="deleteItem(${item.id})">Delete</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Update statistics
    function updateStatistics() {
        const totalItems = inventoryData.length;
        const totalUnits = inventoryData.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = inventoryData.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
        const lowStockItems = inventoryData.filter(item => item.status === 'low').length;
        
        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('totalUnits').textContent = totalUnits + ' Pcs';
        document.getElementById('totalValue').textContent = 'KSh ' + totalValue.toLocaleString();
        document.getElementById('lowStock').textContent = lowStockItems;
    }
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('keyup', function() {
        filterInventory();
    });
    
    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', function() {
        filterInventory();
    });
    
    // Status filter
    document.getElementById('statusFilter').addEventListener('change', function() {
        filterInventory();
    });
    
    // Filter inventory based on inputs
    function filterInventory() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        
        const filtered = inventoryData.filter(item => {
            const matchSearch = item.name.toLowerCase().includes(searchTerm);
            const matchCategory = categoryFilter === '' || item.category === categoryFilter;
            const matchStatus = statusFilter === '' || item.status === statusFilter;
            
            return matchSearch && matchCategory && matchStatus;
        });
        
        loadInventory(filtered);
    }
    
    // Reset filters
    function resetFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('statusFilter').value = '';
        loadInventory();
    }
    
    // Edit item (placeholder function)
    function editItem(id) {
    const item = inventoryData.find(i => i.id === id);
    if (!item) return;

    // 1. Prompt for new Stock Quantity
    let currentQty = item.stock !== undefined ? item.stock : (item.quantity || 0);
    let newQty = prompt(`Update Stock Quantity for [${item.name}]:`, currentQty);
    if (newQty === null) return; // User pressed Cancel

    // 2. Prompt for new Unit Cost Price
    let currentCost = item.unitCost !== undefined ? item.unitCost : (item.price || 0);
    let newCost = prompt(`Update Unit Cost (KSh) for [${item.name}]:`, currentCost);
    if (newCost === null) return; // User pressed Cancel

    // 3. Process changes and update properties safely
    const parsedQty = parseInt(newQty) || 0;
    const parsedCost = parseFloat(newCost) || 0;

    if (item.stock !== undefined) item.stock = parsedQty;
    if (item.quantity !== undefined) item.quantity = parsedQty;
    if (item.unitCost !== undefined) item.unitCost = parsedCost;
    if (item.price !== undefined) item.price = parsedCost;

    // Recalculate row total value automatically
    if (item.totalValue !== undefined) item.totalValue = parsedQty * parsedCost;

    // 4. Instantly redraw your lines cleanly onto the screen
    loadInventory();
}
    
    // Delete item (placeholder function)
    function deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            const index = inventoryData.findIndex(i => i.id === id);
            if (index > -1) {
                inventoryData.splice(index, 1);
                loadInventory();
                updateStatistics();
                alert('Item deleted successfully!');
            }
        }
    }
}

// ============ HELPER FUNCTIONS ============
// Format currency
function formatCurrency(value) {
    return 'KSh ' + value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
