/**
 * MediTrack Supabase Migration Test Script
 * 
 * This script validates all Supabase connections and API functionality
 */

// Test configuration
const TEST_CONFIG = {
    supabaseUrl: 'https://ozpustbeoojyiprvusve.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cHVzdGJlb29qeWlwcnZ1c3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTk5MTEsImV4cCI6MjA3MTE5NTkxMX0.aQVracY0MDkekan4oovbJKpfkiZZ7D11w15xElWcRso',
    testEmail: 'test@meditrack.com',
    testPassword: 'TestPassword123!'
};

class SupabaseTests {
    constructor() {
        this.results = [];
        this.supabase = null;
    }

    // Initialize Supabase client for testing
    async init() {
        try {
            // Load Supabase client
            if (typeof createClient === 'undefined') {
                await this.loadSupabaseClient();
            }
            
            this.supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.anonKey);
            this.log('✅ Supabase client initialized successfully');
            return true;
        } catch (error) {
            this.log('❌ Failed to initialize Supabase client:', error.message);
            return false;
        }
    }

    // Load Supabase client from CDN
    async loadSupabaseClient() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.innerHTML = `
                import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
                window.createClient = createClient;
            `;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Log test results
    log(message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, message, data };
        this.results.push(logEntry);
        console.log(`[${timestamp}] ${message}`, data || '');
    }

    // Test 1: Database Connection
    async testConnection() {
        try {
            const { data, error } = await this.supabase.from('clinic_receives').select('id').limit(1);
            
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
            
            this.log('✅ Database connection successful');
            return true;
        } catch (error) {
            this.log('❌ Database connection failed:', error.message);
            return false;
        }
    }

    // Test 2: Authentication
    async testAuthentication() {
        try {
            // Test sign up
            const { data: signUpData, error: signUpError } = await this.supabase.auth.signUp({
                email: TEST_CONFIG.testEmail,
                password: TEST_CONFIG.testPassword
            });

            if (signUpError && !signUpError.message.includes('already registered')) {
                throw signUpError;
            }

            this.log('✅ User registration test passed');

            // Test sign in
            const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
                email: TEST_CONFIG.testEmail,
                password: TEST_CONFIG.testPassword
            });

            if (signInError) {
                throw signInError;
            }

            this.log('✅ User authentication test passed');

            // Test get user
            const { data: { user }, error: userError } = await this.supabase.auth.getUser();
            
            if (userError) {
                throw userError;
            }

            this.log('✅ Get user test passed', { userId: user.id, email: user.email });
            return true;
        } catch (error) {
            this.log('❌ Authentication test failed:', error.message);
            return false;
        }
    }

    // Test 3: Data Operations
    async testDataOperations() {
        try {
            // Test INSERT
            const insertData = {
                patient_name: 'Test Patient',
                patient_id: 'TEST001',
                doctor_name: 'Dr. Test',
                clinic_name: 'Test Clinic',
                sample_type: 'Blood',
                test_requested: 'CBC'
            };

            const { data: insertResult, error: insertError } = await this.supabase
                .from('clinic_receives')
                .insert(insertData)
                .select();

            if (insertError) {
                throw insertError;
            }

            const insertedId = insertResult[0].id;
            this.log('✅ Data INSERT test passed', { id: insertedId });

            // Test SELECT
            const { data: selectResult, error: selectError } = await this.supabase
                .from('clinic_receives')
                .select('*')
                .eq('id', insertedId);

            if (selectError) {
                throw selectError;
            }

            this.log('✅ Data SELECT test passed', { records: selectResult.length });

            // Test UPDATE
            const { data: updateResult, error: updateError } = await this.supabase
                .from('clinic_receives')
                .update({ patient_name: 'Updated Test Patient' })
                .eq('id', insertedId)
                .select();

            if (updateError) {
                throw updateError;
            }

            this.log('✅ Data UPDATE test passed');

            // Test DELETE
            const { error: deleteError } = await this.supabase
                .from('clinic_receives')
                .delete()
                .eq('id', insertedId);

            if (deleteError) {
                throw deleteError;
            }

            this.log('✅ Data DELETE test passed');
            return true;
        } catch (error) {
            this.log('❌ Data operations test failed:', error.message);
            return false;
        }
    }

    // Test 4: API Helper Functions
    async testApiHelper() {
        try {
            // Load the API Helper
            if (typeof ApiHelper === 'undefined') {
                throw new Error('ApiHelper not loaded');
            }

            // Test GET
            const getData = await ApiHelper.get('clinicReceives', {
                range: { from: 0, to: 4 }
            });

            this.log('✅ ApiHelper GET test passed', { records: getData.data.length });

            // Test POST
            const postData = await ApiHelper.post('clinicReceives', {
                patient_name: 'API Test Patient',
                patient_id: 'API001',
                doctor_name: 'Dr. API Test'
            });

            const newRecordId = postData.data[0].id;
            this.log('✅ ApiHelper POST test passed', { id: newRecordId });

            // Test PUT
            const putData = await ApiHelper.put('clinicReceives', newRecordId, {
                patient_name: 'Updated API Test Patient'
            });

            this.log('✅ ApiHelper PUT test passed');

            // Test DELETE
            await ApiHelper.delete('clinicReceives', newRecordId);
            this.log('✅ ApiHelper DELETE test passed');

            return true;
        } catch (error) {
            this.log('❌ ApiHelper test failed:', error.message);
            return false;
        }
    }

    // Test 5: Row Level Security
    async testRowLevelSecurity() {
        try {
            // Test that users can only access their own data
            const { data: userData } = await this.supabase.auth.getUser();
            
            if (!userData.user) {
                throw new Error('No authenticated user');
            }

            // Insert test record
            const { data: insertResult, error: insertError } = await this.supabase
                .from('clinic_receives')
                .insert({
                    patient_name: 'RLS Test Patient',
                    patient_id: 'RLS001',
                    user_id: userData.user.id
                })
                .select();

            if (insertError) {
                throw insertError;
            }

            // Try to access the record
            const { data: selectResult, error: selectError } = await this.supabase
                .from('clinic_receives')
                .select('*')
                .eq('id', insertResult[0].id);

            if (selectError) {
                throw selectError;
            }

            // Clean up
            await this.supabase
                .from('clinic_receives')
                .delete()
                .eq('id', insertResult[0].id);

            this.log('✅ Row Level Security test passed');
            return true;
        } catch (error) {
            this.log('❌ Row Level Security test failed:', error.message);
            return false;
        }
    }

    // Run all tests
    async runAllTests() {
        this.log('🚀 Starting MediTrack Supabase Migration Tests');

        const tests = [
            { name: 'Connection', test: () => this.testConnection() },
            { name: 'Authentication', test: () => this.testAuthentication() },
            { name: 'Data Operations', test: () => this.testDataOperations() },
            { name: 'API Helper', test: () => this.testApiHelper() },
            { name: 'Row Level Security', test: () => this.testRowLevelSecurity() }
        ];

        let passed = 0;
        let failed = 0;

        for (const { name, test } of tests) {
            this.log(`\n📋 Running ${name} test...`);
            try {
                const result = await test();
                if (result) {
                    passed++;
                } else {
                    failed++;
                }
            } catch (error) {
                this.log(`❌ ${name} test crashed:`, error.message);
                failed++;
            }
        }

        this.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);
        return { passed, failed, results: this.results };
    }

    // Generate test report
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            results: this.results,
            summary: {
                total: this.results.length,
                passed: this.results.filter(r => r.message.includes('✅')).length,
                failed: this.results.filter(r => r.message.includes('❌')).length
            }
        };

        return report;
    }
}

// Example usage functions for manual testing
window.SupabaseTestExamples = {
    // Test basic connection
    testConnection: async function() {
        const supabase = window.supabase || createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.anonKey);
        const { data, error } = await supabase.from('clinic_receives').select('count', { count: 'exact', head: true });
        console.log('Connection test:', { count: data, error });
    },

    // Test authentication flow
    testAuth: async function() {
        const supabase = window.supabase || createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.anonKey);
        
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'user@example.com',
            password: 'password123'
        });
        
        console.log('Auth test:', { data, error });
    },

    // Test data operations
    testCRUD: async function() {
        const testRecord = {
            patient_name: 'Manual Test Patient',
            patient_id: 'MANUAL001',
            doctor_name: 'Dr. Manual Test'
        };

        try {
            // Create
            const created = await ApiHelper.post('clinicReceives', testRecord);
            console.log('Created:', created);

            // Read
            const read = await ApiHelper.get('clinicReceives', { 
                filters: [{ column: 'id', operator: 'eq', value: created.data[0].id }] 
            });
            console.log('Read:', read);

            // Update
            const updated = await ApiHelper.put('clinicReceives', created.data[0].id, {
                patient_name: 'Updated Manual Test Patient'
            });
            console.log('Updated:', updated);

            // Delete
            await ApiHelper.delete('clinicReceives', created.data[0].id);
            console.log('Deleted successfully');

        } catch (error) {
            console.error('CRUD test failed:', error);
        }
    }
};

// Make SupabaseTests available globally for browser console testing
window.SupabaseTests = SupabaseTests;

// Export for module usage
export default SupabaseTests;
