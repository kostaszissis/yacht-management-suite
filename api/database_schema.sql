-- ============================================================
-- YACHT CHECK-IN DATABASE SCHEMA
-- PostgreSQL Database: yachtdb
-- ============================================================

-- 1. MAIN BOOKINGS TABLE (already exists, adding if not)
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_number VARCHAR(100) UNIQUE NOT NULL,
    booking_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PAGE 1 - BOOKING DETAILS
CREATE TABLE IF NOT EXISTS page1_booking_details (
    id SERIAL PRIMARY KEY,
    booking_number VARCHAR(100) UNIQUE NOT NULL REFERENCES bookings(booking_number) ON DELETE CASCADE,
    vessel_name VARCHAR(200),
    vessel_id VARCHAR(100),
    check_in_date DATE,
    check_in_time TIME,
    check_out_date DATE,
    check_out_time TIME,
    departure_port VARCHAR(200),
    arrival_port VARCHAR(200),
    skipper_first_name VARCHAR(100),
    skipper_last_name VARCHAR(100),
    skipper_address TEXT,
    skipper_email VARCHAR(200),
    skipper_phone VARCHAR(50),
    skipper_nationality VARCHAR(100),
    skipper_passport VARCHAR(100),
    mode VARCHAR(20) DEFAULT 'in', -- 'in' or 'out'
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. PAGE 2 - CREW LIST & PASSENGERS
CREATE TABLE IF NOT EXISTS page2_crew (
    id SERIAL PRIMARY KEY,
    booking_number VARCHAR(100) NOT NULL REFERENCES bookings(booking_number) ON DELETE CASCADE,
    crew_index INTEGER NOT NULL, -- Position in the list (1, 2, 3, etc.)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    nationality VARCHAR(100),
    passport_number VARCHAR(100),
    date_of_birth DATE,
    place_of_birth VARCHAR(200),
    role VARCHAR(50) DEFAULT 'passenger', -- 'skipper', 'crew', 'passenger'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(booking_number, crew_index)
);

-- 4. PAGE 3 - EQUIPMENT CHECKLIST
CREATE TABLE IF NOT EXISTS page3_equipment (
    id SERIAL PRIMARY KEY,
    booking_number VARCHAR(100) UNIQUE NOT NULL REFERENCES bookings(booking_number) ON DELETE CASCADE,
    checklist_data JSONB, -- Stores all equipment items as JSON
    safety_equipment JSONB,
    navigation_equipment JSONB,
    galley_equipment JSONB,
    deck_equipment JSONB,
    cabin_equipment JSONB,
    notes TEXT,
    checked_by VARCHAR(200),
    checked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. PAGE 4 - VESSEL INSPECTION
CREATE TABLE IF NOT EXISTS page4_inspection (
    id SERIAL PRIMARY KEY,
    booking_number VARCHAR(100) UNIQUE NOT NULL REFERENCES bookings(booking_number) ON DELETE CASCADE,
    inspection_type VARCHAR(20) DEFAULT 'check_in', -- 'check_in' or 'check_out'
    hull_condition TEXT,
    deck_condition TEXT,
    interior_condition TEXT,
    engine_hours INTEGER,
    fuel_level INTEGER, -- percentage
    water_level INTEGER, -- percentage
    battery_level INTEGER, -- percentage
    damages_found JSONB, -- Array of damage reports
    photos JSONB, -- Array of photo URLs/base64
    floorplan_annotations JSONB, -- Damage markings on floorplan
    inspector_name VARCHAR(200),
    inspector_signature TEXT, -- Base64 signature
    inspection_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. PAGE 5 - FINAL AGREEMENT & SIGNATURES
CREATE TABLE IF NOT EXISTS page5_agreement (
    id SERIAL PRIMARY KEY,
    booking_number VARCHAR(100) UNIQUE NOT NULL REFERENCES bookings(booking_number) ON DELETE CASCADE,
    agreement_type VARCHAR(20) DEFAULT 'check_in', -- 'check_in' or 'check_out'
    terms_accepted BOOLEAN DEFAULT FALSE,
    deposit_amount DECIMAL(10, 2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_method VARCHAR(50),
    damage_deposit DECIMAL(10, 2),
    fuel_charge DECIMAL(10, 2),
    other_charges JSONB,
    total_amount DECIMAL(10, 2),
    skipper_signature TEXT, -- Base64 signature
    skipper_signed_at TIMESTAMP,
    company_signature TEXT, -- Base64 signature
    company_signed_at TIMESTAMP,
    company_representative VARCHAR(200),
    pdf_generated BOOLEAN DEFAULT FALSE,
    pdf_url TEXT,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. FLEET MANAGEMENT - CHARTERS
CREATE TABLE IF NOT EXISTS charters (
    id SERIAL PRIMARY KEY,
    charter_code VARCHAR(100) UNIQUE NOT NULL,
    vessel_id VARCHAR(100) NOT NULL,
    vessel_name VARCHAR(200),
    owner_code VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    departure_port VARCHAR(200) DEFAULT 'ALIMOS MARINA',
    arrival_port VARCHAR(200) DEFAULT 'ALIMOS MARINA',
    status VARCHAR(50) DEFAULT 'Option', -- 'Option', 'Reservation', 'Confirmed', 'Cancelled'
    booking_status VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'Pending',
    charter_amount DECIMAL(10, 2),
    commission_percent DECIMAL(5, 2),
    commission_amount DECIMAL(10, 2),
    vat_on_commission DECIMAL(10, 2),
    skipper_first_name VARCHAR(100),
    skipper_last_name VARCHAR(100),
    skipper_address TEXT,
    skipper_email VARCHAR(200),
    skipper_phone VARCHAR(50),
    payments JSONB, -- Array of payment records
    notes TEXT,
    created_by VARCHAR(200),
    broker VARCHAR(200),
    show_vat BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. VESSELS TABLE (for fleet management)
CREATE TABLE IF NOT EXISTS vessels (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100),
    model VARCHAR(200),
    year INTEGER,
    length DECIMAL(5, 2),
    capacity INTEGER,
    cabins INTEGER,
    berths INTEGER,
    owner_code VARCHAR(100),
    owner_name VARCHAR(200),
    owner_email VARCHAR(200),
    base_port VARCHAR(200) DEFAULT 'ALIMOS MARINA',
    status VARCHAR(50) DEFAULT 'active',
    image_url TEXT,
    documents JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. VESSEL OWNERS TABLE (owner details per vessel)
CREATE TABLE IF NOT EXISTS vessel_owners (
    id SERIAL PRIMARY KEY,
    vessel_name VARCHAR(200) UNIQUE NOT NULL,
    owner_first_name VARCHAR(200),
    owner_last_name VARCHAR(200),
    owner_email VARCHAR(200),
    company_email VARCHAR(200),
    company_name VARCHAR(200),
    vat_number VARCHAR(100),
    id_passport_number VARCHAR(100),
    id_passport_file TEXT,
    id_passport_file_name VARCHAR(200),
    tax_office VARCHAR(200),
    phone VARCHAR(100),
    street VARCHAR(200),
    street_number VARCHAR(50),
    city VARCHAR(200),
    postal_code VARCHAR(50),
    custom_fields JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_page1_booking_number ON page1_booking_details(booking_number);
CREATE INDEX IF NOT EXISTS idx_page2_booking_number ON page2_crew(booking_number);
CREATE INDEX IF NOT EXISTS idx_page3_booking_number ON page3_equipment(booking_number);
CREATE INDEX IF NOT EXISTS idx_page4_booking_number ON page4_inspection(booking_number);
CREATE INDEX IF NOT EXISTS idx_page5_booking_number ON page5_agreement(booking_number);
CREATE INDEX IF NOT EXISTS idx_charters_code ON charters(charter_code);
CREATE INDEX IF NOT EXISTS idx_charters_vessel ON charters(vessel_id);
CREATE INDEX IF NOT EXISTS idx_charters_dates ON charters(start_date, end_date);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_page1_updated_at ON page1_booking_details;
CREATE TRIGGER update_page1_updated_at BEFORE UPDATE ON page1_booking_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_page2_updated_at ON page2_crew;
CREATE TRIGGER update_page2_updated_at BEFORE UPDATE ON page2_crew FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_page3_updated_at ON page3_equipment;
CREATE TRIGGER update_page3_updated_at BEFORE UPDATE ON page3_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_page4_updated_at ON page4_inspection;
CREATE TRIGGER update_page4_updated_at BEFORE UPDATE ON page4_inspection FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_page5_updated_at ON page5_agreement;
CREATE TRIGGER update_page5_updated_at BEFORE UPDATE ON page5_agreement FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_charters_updated_at ON charters;
CREATE TRIGGER update_charters_updated_at BEFORE UPDATE ON charters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vessels_updated_at ON vessels;
CREATE TRIGGER update_vessels_updated_at BEFORE UPDATE ON vessels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
