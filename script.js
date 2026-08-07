// ============ LOGIN PAGE SCRIPT ============
const loginForm = document.getElementById('loginForm') || document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const emailInput = document.getElementById('email').value;
        const passwordInput = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMessage');
        
        try {
            // Single secure connection to the Python backend
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput, password: passwordInput })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                if (errorMsg) {
                    errorMsg.textContent = '✓ Authentication successful! Accessing terminal...';
                    errorMsg.style.color = '#27ae60';
                    errorMsg.style.display = 'block';
                }
                // Flask handles the session cookie automatically
                setTimeout(() => {
                    window.location.href = data.redirect || '/dashboard';
                }, 800);
            } else {
                if (errorMsg) {
                    errorMsg.textContent = `❌ ${data.message || 'Invalid credentials'}`;
                    errorMsg.style.color = '#e74c3c';
                    errorMsg.style.display = 'block';
                }
            }
        } catch (error) {
            console.error("Login Error:", error);
            if (errorMsg) {
                errorMsg.textContent = '❌ Network error. Server might be offline.';
                errorMsg.style.color = '#e74c3c';
                errorMsg.style.display = 'block';
            }
        }
    });
}

// ============ DASHBOARD SCRIPT ============
if (document.getElementById('inventoryTable')) {
    
    // Automatically load data from the real database on page load
    window.addEventListener('DOMContentLoaded', function() {
        loadInventory();
    });
    
    async function loadInventory() {
        const tableBody = document.getElementById('tableBody');
        if (!tableBody) return;
        
        try {
            // Fetch live data from SQLite
            const response = await fetch('/api/inventory');
            
            // If the server says we aren't logged in, boot back to login screen
            if (response.status === 401 || response.status === 403) {
                window.location.href = '/';
                return;
            }
            
            const data = await response.json();
            const items = data.items || [];
            
            tableBody.innerHTML = ''; // Clear loading state
            
            if (items.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No inventory found. Add items to begin.</td></tr>';
                updateStatistics(0, 0, 0, 0);
                return;
            }

            let totalUnits = 0;
            let totalValue = 0;
            let lowStockCount = 0;
            
            items.forEach(item => {
                const tr = document.createElement('tr');
                
                // XSS-Safe DOM construction
                tr.innerHTML = `
                    <td><strong>${escapeHTML(item.name)}</strong></td>
                    <td>${escapeHTML(item.category).toUpperCase()}</td>
                    <td>${item.stock_qty}</td>
                    <td>${escapeHTML(item.unit)}</td>
                    <td>${formatCurrency(item.unit_cost)}</td>
                    <td>${formatCurrency(item.total_value)}</td>
                    <td><span class="status-badge status-${(item.status || 'low').toLowerCase()}">${escapeHTML(item.status)}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn btn-edit" onclick="editItem(${item.id})">Edit</button>
                            <button class="action-btn btn-delete" onclick="deleteItem(${item.id})">Delete</button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);

                totalUnits += item.stock_qty;
                totalValue += item.total_value;
                if (item.status && item.status.toLowerCase() === 'low') lowStockCount++;
            });

            updateStatistics(items.length, totalUnits, totalValue, lowStockCount);

        } catch (error) {
            console.error("Database connection failed:", error);
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#e74c3c;">Failed to connect to terminal database.</td></tr>';
        }
    }
    
    function updateStatistics(totalItems, units, value, lowStock) {
        if(document.getElementById('totalItems')) document.getElementById('totalItems').textContent = totalItems;
        if(document.getElementById('totalUnits')) document.getElementById('totalUnits').textContent = units + ' Pcs';
        if(document.getElementById('totalValue')) document.getElementById('totalValue').textContent = formatCurrency(value);
        if(document.getElementById('lowStock')) document.getElementById('lowStock').textContent = lowStock;
    }
}

// ============ HELPER FUNCTIONS ============
// Ensure strictly Kenyan Shilling formatting
function formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return 'KSh ' + num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Basic HTML Sanitizer to prevent script injections
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Logout function now communicates with the backend
async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch(e) { console.log(e); }
    window.location.href = '/';
}

function editItem(id) { alert("Edit functionality will be routed to the backend next!"); }
function deleteItem(id) { alert("Delete functionality will be routed to the backend next!"); }
