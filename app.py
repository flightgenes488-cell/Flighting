import os
import sqlite3
from flask import Flask, render_template, request, redirect, url_for, jsonify, session

# 1. Initialize Flask to look at your root directory
app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')
app.secret_key = 'bluestream-secret-key-2026'  # Protects login sessions

DB_PATH = './data/inventory.db'

# 2. Database Initialization & Default Admin Creation
def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create Users Table with username support
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT,
            password TEXT NOT NULL
        )
    ''')
    
    # Insert a default admin user automatically if none exists
    cursor.execute('SELECT * FROM users WHERE username = ?', ('Nyambane',))
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO users (username, password) 
            VALUES (?, ?, ?)
        ''', ('Nyambane',  'admin123'))
    
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

@app.route('/signup', methods=['POST'])
def signup():
    if request.is_json:
        data = request.get_json()
        username = data.get('email')  # Fallback if form sends email as username
        password = data.get('password')
    else:
        username = request.form.get('email')
        password = request.form.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Missing fields'}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, password))
        conn.commit()
        conn.close()
        
        if request.is_json:
            return jsonify({'success': True, 'message': 'Account created successfully!'})
        return redirect(url_for('index'))
    except sqlite3.IntegrityError:
        if request.is_json:
            return jsonify({'success': False, 'message': 'This username is already registered.'}), 400
        return "Username already exists", 400

@app.route('/login', methods=['POST'])
@app.route('/api/auth/login', methods=['POST'])
def login_post():
    if request.is_json:
        data = request.get_json()
        identifier = data.get('email')  # JavaScript might send username/email through 'email' key
        password = data.get('password')
    else:
        identifier = request.form.get('email')
        password = request.form.get('password')

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Check against either username or email
    cursor.execute('SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?', (identifier, identifier, password))
    user = cursor.fetchone()
    conn.close()

    if user:
        session['user_id'] = user[0]
        if request.is_json:
            return jsonify({'success': True, 'redirect': url_for('dashboard')})
        return redirect(url_for('dashboard'))
    else:
        if request.is_json:
            return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401
        return "Invalid credentials", 401

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

if __name__ == '__main__':
    app.run(debug=True)
