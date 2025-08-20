-- Create clinic_receives table for MediTrack
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS clinic_receives (
    id BIGSERIAL PRIMARY KEY,
    datetime TIMESTAMP WITH TIME ZONE,
    patientid VARCHAR(255),
    age INTEGER,
    sex VARCHAR(50),
    ward VARCHAR(255),
    condition TEXT,
    clinicaldata TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE clinic_receives ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts for testing
-- Remove this policy later and create proper user-based policies
CREATE POLICY "Allow anonymous inserts for testing" ON clinic_receives
    FOR INSERT 
    WITH CHECK (true);

-- Create policy to allow users to read their own data
CREATE POLICY "Users can read own data" ON clinic_receives
    FOR SELECT 
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Create other tables mentioned in the config
CREATE TABLE IF NOT EXISTS clinic_processings (
    id BIGSERIAL PRIMARY KEY,
    patientid VARCHAR(255),
    sampleid VARCHAR(255),
    test_type VARCHAR(255),
    result TEXT,
    lab_scientist VARCHAR(255),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacy_records (
    id BIGSERIAL PRIMARY KEY,
    medicine_name VARCHAR(255),
    dosage VARCHAR(255),
    quantity INTEGER,
    availability BOOLEAN DEFAULT true,
    expiry_date DATE,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS archives (
    id BIGSERIAL PRIMARY KEY,
    patientid VARCHAR(255),
    sampleid VARCHAR(255),
    medicine VARCHAR(255),
    labscientist VARCHAR(255),
    datetime TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE clinic_processings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE archives ENABLE ROW LEVEL SECURITY;

-- Create basic policies for testing (allow anonymous access)
-- Replace these with proper user-based policies later
CREATE POLICY "Allow anonymous access clinic_processings" ON clinic_processings
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access pharmacy_records" ON pharmacy_records
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access archives" ON archives
    FOR ALL USING (true) WITH CHECK (true);
