-- AgriBridge AI - PostgreSQL + PostGIS Production Schema
-- Designed for Smart India Hackathon SIH26033

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'fpo', 'buyer', 'admin')),
    password_hash VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    district VARCHAR(100),
    state VARCHAR(100) DEFAULT 'Tamil Nadu',
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_geom ON users USING GIST(geom);
CREATE INDEX idx_users_role ON users(role);

-- Farmers Details
CREATE TABLE farmers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    farm_size_acres NUMERIC(6, 2) DEFAULT 2.5,
    fpo_id INTEGER,
    bank_account VARCHAR(50),
    ifsc_code VARCHAR(20),
    aadhaar_hash VARCHAR(64),
    is_verified BOOLEAN DEFAULT TRUE
);

-- Crops Master
CREATE TABLE crops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    tamil_name VARCHAR(100),
    category VARCHAR(50),
    base_production_cost NUMERIC(10, 2) NOT NULL,
    shelf_life_days INTEGER NOT NULL,
    perishability VARCHAR(20) CHECK (perishability IN ('High', 'Medium', 'Low')),
    msp_benchmark NUMERIC(10, 2),
    image_url TEXT
);

-- Farmer Produce Listings
CREATE TABLE farmer_produce (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER NOT NULL REFERENCES users(id),
    farmer_name VARCHAR(255) NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    quantity_kg NUMERIC(10, 2) NOT NULL,
    available_quantity_kg NUMERIC(10, 2) NOT NULL,
    quality_grade VARCHAR(20) NOT NULL CHECK (quality_grade IN ('Grade A', 'Grade B')),
    expected_price_per_kg NUMERIC(10, 2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    harvest_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Available',
    fpo_group_id INTEGER,
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farmer_produce_geom ON farmer_produce USING GIST(geom);
CREATE INDEX idx_farmer_produce_crop ON farmer_produce(crop_name);

-- Buyer Requirements (Reverse Marketplace)
CREATE TABLE buyer_requirements (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES users(id),
    buyer_name VARCHAR(255) NOT NULL,
    buyer_company VARCHAR(255),
    crop_name VARCHAR(100) NOT NULL,
    required_quantity_kg NUMERIC(10, 2) NOT NULL,
    fulfilled_quantity_kg NUMERIC(10, 2) DEFAULT 0,
    quality_grade VARCHAR(20) NOT NULL CHECK (quality_grade IN ('Grade A', 'Grade B')),
    max_price_per_kg NUMERIC(10, 2) NOT NULL,
    delivery_location VARCHAR(255) NOT NULL,
    delivery_district VARCHAR(100) NOT NULL,
    required_date DATE NOT NULL,
    geom GEOMETRY(Point, 4326),
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'Partially Fulfilled', 'Fulfilled', 'Closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buyer_req_geom ON buyer_requirements USING GIST(geom);
CREATE INDEX idx_buyer_req_crop ON buyer_requirements(crop_name);

-- Virtual FPO Aggregation Groups
CREATE TABLE virtual_fpo_groups (
    id SERIAL PRIMARY KEY,
    group_code VARCHAR(50) UNIQUE NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    quality_grade VARCHAR(20) NOT NULL,
    target_quantity_kg NUMERIC(10, 2) NOT NULL,
    current_quantity_kg NUMERIC(10, 2) DEFAULT 0,
    fpo_lead_name VARCHAR(255) NOT NULL,
    buyer_requirement_id INTEGER REFERENCES buyer_requirements(id),
    buyer_name VARCHAR(255),
    delivery_location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Forming' CHECK (status IN ('Forming', 'Ready', 'Dispatched', 'Delivered', 'Completed')),
    collection_center VARCHAR(255),
    collection_geom GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Virtual FPO Items
CREATE TABLE virtual_fpo_items (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES virtual_fpo_groups(id) ON DELETE CASCADE,
    farmer_id INTEGER NOT NULL REFERENCES users(id),
    farmer_name VARCHAR(255) NOT NULL,
    produce_id INTEGER REFERENCES farmer_produce(id),
    crop_name VARCHAR(100) NOT NULL,
    quantity_kg NUMERIC(10, 2) NOT NULL,
    quality_grade VARCHAR(20) NOT NULL,
    price_per_kg NUMERIC(10, 2) NOT NULL,
    farmer_location VARCHAR(255) NOT NULL,
    harvest_date DATE,
    payout_amount NUMERIC(12, 2) NOT NULL,
    payout_status VARCHAR(50) DEFAULT 'Pending'
);

-- Smart Logistics Routes
CREATE TABLE logistics_routes (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES virtual_fpo_groups(id),
    crop_name VARCHAR(100) NOT NULL,
    total_quantity_kg NUMERIC(10, 2) NOT NULL,
    origin_hubs JSONB NOT NULL,
    collection_point VARCHAR(255) NOT NULL,
    destination_buyer VARCHAR(255) NOT NULL,
    total_distance_km NUMERIC(8, 2) NOT NULL,
    transport_cost_rs NUMERIC(10, 2) NOT NULL,
    individual_transport_cost_rs NUMERIC(10, 2) NOT NULL,
    cost_savings_rs NUMERIC(10, 2) NOT NULL,
    estimated_hours NUMERIC(6, 2) NOT NULL,
    farmers_grouped_count INTEGER NOT NULL,
    spoilage_risk_percent NUMERIC(5, 2) NOT NULL,
    spoilage_risk_level VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Planned',
    route_geom GEOMETRY(LineString, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- QR Traceability Batches
CREATE TABLE qr_batches (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(100) UNIQUE NOT NULL,
    group_id INTEGER REFERENCES virtual_fpo_groups(id),
    crop_name VARCHAR(100) NOT NULL,
    total_quantity_kg NUMERIC(10, 2) NOT NULL,
    quality_grade VARCHAR(20) NOT NULL,
    farmer_names TEXT NOT NULL,
    origin_district VARCHAR(100) NOT NULL,
    harvest_date DATE NOT NULL,
    buyer_name VARCHAR(255) NOT NULL,
    delivery_location VARCHAR(255) NOT NULL,
    qr_code_base64 TEXT NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'Pending Verification',
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(255),
    inspection_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Secure Payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    payment_ref VARCHAR(100) UNIQUE NOT NULL,
    batch_id VARCHAR(100) NOT NULL REFERENCES qr_batches(batch_id),
    group_id INTEGER REFERENCES virtual_fpo_groups(id),
    buyer_id INTEGER NOT NULL REFERENCES users(id),
    buyer_name VARCHAR(255) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    stage INTEGER DEFAULT 1 CHECK (stage BETWEEN 1 AND 5),
    status VARCHAR(50) DEFAULT 'Initiated',
    farmer_splits_json JSONB NOT NULL,
    escrow_account VARCHAR(100) DEFAULT 'SBI-ESCROW-AGRI-99218',
    transaction_hash VARCHAR(100),
    released_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    title_tamil VARCHAR(255),
    message TEXT NOT NULL,
    message_tamil TEXT,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
