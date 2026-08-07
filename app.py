import os
import sqlite3
from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash

# 1. Initialize Flask to look at your root directory
app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')

# Security Update: Use a strong default secret key for session protection
app.secret_key = os.environ.get('SECRET_KEY', 'bluestream-kesses-secure-key-2026') 

DB_PATH = './data/inventory.db'

# 2. Database Initialization & Secure Migration
def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Security Upgrade: Drop the old insecure table to enforce the new password hashing system
    cursor.execute('DROP TABLE IF EXISTS users')
    
    # Create Secured Users Table
    cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT,
            password_hash TEXT NOT NULL
        )
    ''')
    
    # Insert the single default admin user automatically (Encrypted)
    hashed_pw = generate_password_hash('admin123')
    cursor.execute('''
        INSERT INTO users (username, email, password_hash) 
        VALUES (?, ?, ?)
    ''', ('Nyambane', 'nyambane@bluestream.com', hashed_pw))
    
    # Create Items Table (Aligned with inventory API)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            stock_qty INTEGER NOT NULL,
            unit TEXT,
            unit_cost REAL NOT NULL,
            total_value REAL NOT NULL,
            status TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# 3. Backend Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

# Security Update: Disabled open registration for private system
@app.route('/signup', methods=['POST'])
def signup():
    return jsonify({'success': False, 'message': 'Registration locked. Single admin account only.'}), 403

@app.route('/login', methods=['POST'])
@app.route('/api/auth/login', methods=['POST'])
def login_post():
    if request.is_json:
        data = request.get_json()
        # Checks all possible keys the frontend might send
        identifier = data.get('username') or data.get('email') or data.get('identifier')
        password = data.get('password')
    else:
        identifier = request.form.get('username') or request.form.get('email')
        password = request.form.get('password')

    if not identifier or not password:
        if request.is_json:
            return jsonify({'success': False, 'message': 'Missing credentials.'}), 400
        return "Missing credentials", 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Fetch the user's encrypted password
    cursor.execute('SELECT id, password_hash FROM users WHERE username = ? OR email = ?', (identifier, identifier))
    user = cursor.fetchone()
    conn.close()

    # Security Update: Check against the encrypted hash, not plain text
    if user and check_password_hash(user[1], password):
        session['user_id'] = user[0]
        if request.is_json:
            return jsonify({'success': True, 'redirect': url_for('dashboard')})
        return redirect(url_for('dashboard'))
    else:
        if request.is_json:
            return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401
        return "Invalid credentials", 401

@app.route('/api/auth/logout', methods=['POST'])
def logout_post():
    session.pop('user_id', None)
    return jsonify({'success': True, 'redirect': url_for('index')})

# ==========================================
#          BACKEND INVENTORY API            #
# ==========================================
@app.route('/api/inventory/add', methods=['POST'])
def api_add_item():
    try:
        data = request.get_json()
        
        name = data.get('name', '').upper()
        category = data.get('category', '').upper()
        qty = int(data.get('quantity', 0))
        unit = data.get('unit', 'Pcs')
        cost = float(data.get('unitCost', 0.0))
        total_value = qty * cost
        
        status = "High" if qty > 50 else ("Medium" if qty >= 10 else "Low")

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO items (name, category, stock_qty, unit, unit_cost, total_value, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (name, category, qty, unit, cost, total_value, status))
        
        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": f"{name} successfully saved to DB!"}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    # Security: Ensure only the logged-in admin can view the data
    if 'user_id' not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    try:
        conn = sqlite3.connect(DB_PATH)
        # Allows accessing columns by name
        conn.row_factory = sqlite3.Row 
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM items ORDER BY id DESC')
        rows = cursor.fetchall()
        conn.close()

        # Convert database rows to a list of dictionaries for JavaScript
        items = [dict(row) for row in rows]
        
        return jsonify({"success": True, "items": items}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
