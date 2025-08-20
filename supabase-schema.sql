-- MediTrack Supabase Database Schema
-- Run these SQL statements in the Supabase SQL editor

-- Enable Row Level Security (RLS) by default
-- Note: RLS policies will be added after tables are created

-- 1. Clinic Receives Table
CREATE TABLE IF NOT EXISTS clinic_receives (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    patient_name VARCHAR(255),
    patient_id VARCHAR(100),
    patient_age INTEGER,
    patient_gender VARCHAR(20),
    doctor_name VARCHAR(255),
    clinic_name VARCHAR(255),
    sample_type VARCHAR(100),
    test_requested VARCHAR(255),
    priority_level VARCHAR(50) DEFAULT 'normal',
    collection_date DATE,
    collection_time TIME,
    special_instructions TEXT,
    contact_number VARCHAR(20),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clinic Processings Table
CREATE TABLE IF NOT EXISTS clinic_processings (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    patient_name VARCHAR(255),
    patient_id VARCHAR(100),
    lab_scientist VARCHAR(255),
    test_type VARCHAR(255),
    test_results TEXT,
    test_date DATE,
    completion_status VARCHAR(50) DEFAULT 'pending',
    quality_control VARCHAR(50),
    notes TEXT,
    machine_used VARCHAR(255),
    batch_number VARCHAR(100),
    reference_ranges TEXT,
    critical_values BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(255),
    verification_date TIMESTAMPTZ,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pharmacy Records Table
CREATE TABLE IF NOT EXISTS pharmacy_records (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    patient_name VARCHAR(255),
    patient_id VARCHAR(100),
    medication_name VARCHAR(255),
    medication_type VARCHAR(100),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    prescribing_doctor VARCHAR(255),
    pharmacy_name VARCHAR(255),
    dispensed_date DATE,
    dispensed_time TIME,
    quantity_dispensed INTEGER,
    batch_number VARCHAR(100),
    expiry_date DATE,
    cost DECIMAL(10,2),
    insurance_covered BOOLEAN DEFAULT FALSE,
    special_instructions TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Archives Table
CREATE TABLE IF NOT EXISTS archives (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    patient_id VARCHAR(100),
    record_type VARCHAR(50), -- 'clinic_receive', 'clinic_processing', 'pharmacy_record'
    original_record_id BIGINT,
    archived_data JSONB,
    archived_by VARCHAR(255),
    archive_reason TEXT,
    retention_period VARCHAR(50),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    confirmed BOOLEAN DEFAULT FALSE,
    blocked BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'user', -- 'admin', 'clinician', 'lab_scientist', 'pharmacist', 'user'
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    institution VARCHAR(255),
    department VARCHAR(255),
    last_login TIMESTAMPTZ,
    avatar_url TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clinic_receives_patient_id ON clinic_receives(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinic_receives_created_at ON clinic_receives(created_at);
CREATE INDEX IF NOT EXISTS idx_clinic_receives_user_id ON clinic_receives(user_id);

CREATE INDEX IF NOT EXISTS idx_clinic_processings_patient_id ON clinic_processings(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinic_processings_created_at ON clinic_processings(created_at);
CREATE INDEX IF NOT EXISTS idx_clinic_processings_completion_status ON clinic_processings(completion_status);
CREATE INDEX IF NOT EXISTS idx_clinic_processings_user_id ON clinic_processings(user_id);

CREATE INDEX IF NOT EXISTS idx_pharmacy_records_patient_id ON pharmacy_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_records_created_at ON pharmacy_records(created_at);
CREATE INDEX IF NOT EXISTS idx_pharmacy_records_user_id ON pharmacy_records(user_id);

CREATE INDEX IF NOT EXISTS idx_archives_patient_id ON archives(patient_id);
CREATE INDEX IF NOT EXISTS idx_archives_record_type ON archives(record_type);
CREATE INDEX IF NOT EXISTS idx_archives_created_at ON archives(created_at);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_clinic_receives_updated_at BEFORE UPDATE ON clinic_receives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinic_processings_updated_at BEFORE UPDATE ON clinic_processings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pharmacy_records_updated_at BEFORE UPDATE ON pharmacy_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_archives_updated_at BEFORE UPDATE ON archives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE clinic_receives ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_processings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- Clinic Receives Policies
CREATE POLICY "Users can view their own clinic receives" ON clinic_receives
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clinic receives" ON clinic_receives
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clinic receives" ON clinic_receives
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clinic receives" ON clinic_receives
    FOR DELETE USING (auth.uid() = user_id);

-- Clinic Processings Policies
CREATE POLICY "Users can view their own clinic processings" ON clinic_processings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clinic processings" ON clinic_processings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clinic processings" ON clinic_processings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clinic processings" ON clinic_processings
    FOR DELETE USING (auth.uid() = user_id);

-- Pharmacy Records Policies
CREATE POLICY "Users can view their own pharmacy records" ON pharmacy_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pharmacy records" ON pharmacy_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pharmacy records" ON pharmacy_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pharmacy records" ON pharmacy_records
    FOR DELETE USING (auth.uid() = user_id);

-- Archives Policies
CREATE POLICY "Users can view their own archives" ON archives
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own archives" ON archives
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own archives" ON archives
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own archives" ON archives
    FOR DELETE USING (auth.uid() = user_id);

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, username)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
