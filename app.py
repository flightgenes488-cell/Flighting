import os
import sqlite3
from flask import Flask, render_template, request, redirect, url_for, jsonify, session

# 1. Initialize Flask to look at your root directory
app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')
app.secret_key = 'bluestream-secret-key-2026'  # Protects login sessions

DB_PATH = './data/inventory.db'

# 2. Database Initialization (Runs automatically when server starts)
def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # Create Inventory Table (Ready for your dashboard!)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sku TEXT UNIQUE,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            category TEXT
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
    # Detect if data came via JS Fetch (JSON) or standard HTML Form submission
    if request.is_json:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
    else:
        email = request.form.get('email')
        password = request.form.get('password')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Missing fields'}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('INSERT INTO users (email, password) VALUES (?, ?)', (email, password))
        conn.commit()
        conn.close()
        
        if request.is_json:
            return jsonify({'success': True, 'message': 'Account created successfully!'})
        return redirect(url_for('index'))
    except sqlite3.IntegrityError:
        if request.is_json:
            return jsonify({'success': False, 'message': 'This email is already registered.'}), 400
        return "Email already exists", 400

@app.route('/login', methods=['POST'])
def login_post():
    if request.is_json:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
    else:
        email = request.form.get('email')
        password = request.form.get('password')

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ? AND password = ?', (email, password))
    user = cursor.fetchone()
    conn.close()

    if user:
        session['user_id'] = user[0]
        if request.is_json:
            return jsonify({'success': True, 'redirect': url_for('dashboard')})
        return redirect(url_for('dashboard'))
    else:
        if request.is_json:
            return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401
        return "Invalid credentials", 401
from flask import jsonify, request

# EXISTING ROUTES HERE...

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
        
        # Calculate stock status threshold automatically
        status = "High" if qty > 50 else ("Medium" if qty >= 10 else "Low")

        # --- DATABASE INSERTION ---
        # Connect to your existing SQLite database safely
        conn = sqlite3.connect('inventory.db') # Change name if your db file is named differently
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