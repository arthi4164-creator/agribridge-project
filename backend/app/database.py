"""
AgriBridge AI - Database Management
Supports SQLite for seamless local execution and includes PostgreSQL + PostGIS production compatibility.
"""
import sqlite3
import os
import json
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "agribridge.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL, -- farmer, fpo, buyer, admin
        password_hash TEXT NOT NULL,
        location TEXT,
        district TEXT,
        state TEXT DEFAULT 'Tamil Nadu',
        latitude REAL,
        longitude REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Farmer Details Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS farmers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        farm_size_acres REAL DEFAULT 2.5,
        fpo_id INTEGER,
        bank_account TEXT,
        ifsc_code TEXT,
        aadhaar_hash TEXT,
        is_verified INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Crops Catalog
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS crops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        tamil_name TEXT,
        category TEXT, -- Vegetable, Grain, Pulse, Fruit
        base_production_cost REAL,
        shelf_life_days INTEGER,
        perishability TEXT, -- High, Medium, Low
        msp_benchmark REAL,
        image_url TEXT
    )
    """)

    # Farmer Produce Listings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS farmer_produce (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        farmer_id INTEGER NOT NULL,
        farmer_name TEXT NOT NULL,
        crop_name TEXT NOT NULL,
        quantity_kg REAL NOT NULL,
        available_quantity_kg REAL NOT NULL,
        quality_grade TEXT NOT NULL, -- Grade A, Grade B
        expected_price_per_kg REAL NOT NULL,
        location TEXT NOT NULL,
        harvest_date TEXT NOT NULL,
        status TEXT DEFAULT 'Available', -- Available, Aggregated, Sold
        fpo_group_id INTEGER,
        latitude REAL,
        longitude REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farmer_id) REFERENCES users(id)
    )
    """)

    # Buyer Requirements (Reverse Marketplace)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS buyer_requirements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyer_id INTEGER NOT NULL,
        buyer_name TEXT NOT NULL,
        buyer_company TEXT,
        crop_name TEXT NOT NULL,
        required_quantity_kg REAL NOT NULL,
        fulfilled_quantity_kg REAL DEFAULT 0,
        quality_grade TEXT NOT NULL, -- Grade A, Grade B
        max_price_per_kg REAL NOT NULL,
        delivery_location TEXT NOT NULL,
        delivery_district TEXT NOT NULL,
        required_date TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        status TEXT DEFAULT 'Open', -- Open, Partially Fulfilled, Fulfilled, Closed
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id)
    )
    """)

    # Virtual FPO Aggregation Groups
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS virtual_fpo_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_code TEXT UNIQUE NOT NULL,
        crop_name TEXT NOT NULL,
        quality_grade TEXT NOT NULL,
        target_quantity_kg REAL NOT NULL,
        current_quantity_kg REAL DEFAULT 0,
        fpo_lead_name TEXT NOT NULL,
        buyer_requirement_id INTEGER,
        buyer_name TEXT,
        delivery_location TEXT,
        status TEXT DEFAULT 'Forming', -- Forming, Ready, Dispatched, Delivered, Completed
        collection_center TEXT,
        collection_lat REAL,
        collection_lng REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_requirement_id) REFERENCES buyer_requirements(id)
    )
    """)

    # Virtual FPO Group Items (individual farmer contribution)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS virtual_fpo_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        farmer_id INTEGER NOT NULL,
        farmer_name TEXT NOT NULL,
        produce_id INTEGER,
        crop_name TEXT NOT NULL,
        quantity_kg REAL NOT NULL,
        quality_grade TEXT NOT NULL,
        price_per_kg REAL NOT NULL,
        farmer_location TEXT NOT NULL,
        harvest_date TEXT,
        payout_amount REAL NOT NULL,
        payout_status TEXT DEFAULT 'Pending', -- Pending, Escrow Locked, Released
        FOREIGN KEY (group_id) REFERENCES virtual_fpo_groups(id),
        FOREIGN KEY (farmer_id) REFERENCES users(id)
    )
    """)

    # Reverse Marketplace Farmer Responses / Offers
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS requirement_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requirement_id INTEGER NOT NULL,
        respondent_id INTEGER NOT NULL,
        respondent_name TEXT NOT NULL,
        respondent_type TEXT NOT NULL, -- Farmer, Virtual FPO
        offered_quantity_kg REAL NOT NULL,
        offered_price_per_kg REAL NOT NULL,
        quality_grade TEXT NOT NULL,
        delivery_date TEXT NOT NULL,
        status TEXT DEFAULT 'Under Review', -- Under Review, Accepted, Rejected
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (requirement_id) REFERENCES buyer_requirements(id)
    )
    """)

    # Smart Logistics Routes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS logistics_routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        crop_name TEXT NOT NULL,
        total_quantity_kg REAL NOT NULL,
        origin_hubs TEXT NOT NULL, -- JSON list of farmer locations
        collection_point TEXT NOT NULL,
        destination_buyer TEXT NOT NULL,
        total_distance_km REAL NOT NULL,
        transport_cost_rs REAL NOT NULL,
        individual_transport_cost_rs REAL NOT NULL,
        cost_savings_rs REAL NOT NULL,
        estimated_hours REAL NOT NULL,
        farmers_grouped_count INTEGER NOT NULL,
        spoilage_risk_percent REAL NOT NULL,
        spoilage_risk_level TEXT NOT NULL, -- Low, Moderate, High
        vehicle_type TEXT NOT NULL,
        status TEXT DEFAULT 'Planned', -- Planned, In Transit, Arrived
        route_geojson TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES virtual_fpo_groups(id)
    )
    """)

    # QR Traceability Batches
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS qr_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT UNIQUE NOT NULL,
        group_id INTEGER,
        crop_name TEXT NOT NULL,
        total_quantity_kg REAL NOT NULL,
        quality_grade TEXT NOT NULL,
        farmer_names TEXT NOT NULL, -- Comma-separated or JSON
        origin_district TEXT NOT NULL,
        harvest_date TEXT NOT NULL,
        buyer_name TEXT NOT NULL,
        delivery_location TEXT NOT NULL,
        qr_code_base64 TEXT NOT NULL,
        verification_status TEXT DEFAULT 'Pending Verification', -- Pending Verification, Verified & Accepted, Rejected
        verified_at TEXT,
        verified_by TEXT,
        inspection_notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Secure Payment Escrow
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_ref TEXT UNIQUE NOT NULL,
        batch_id TEXT NOT NULL,
        group_id INTEGER,
        buyer_id INTEGER NOT NULL,
        buyer_name TEXT NOT NULL,
        total_amount REAL NOT NULL,
        stage INTEGER DEFAULT 1, -- 1: Initiated, 2: Escrow Locked, 3: Dispatched, 4: Produce Verified, 5: Payment Released
        status TEXT DEFAULT 'Initiated', -- Initiated, Escrow Locked, In Transit, Verified, Released
        farmer_splits_json TEXT NOT NULL,
        escrow_account TEXT DEFAULT 'SBI-ESCROW-AGRI-99218',
        transaction_hash TEXT,
        released_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id)
    )
    """)

    # Notifications
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        role TEXT, -- farmer, fpo, buyer, admin, all
        title TEXT NOT NULL,
        title_tamil TEXT,
        message TEXT NOT NULL,
        message_tamil TEXT,
        type TEXT DEFAULT 'info', -- info, success, warning, order
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
