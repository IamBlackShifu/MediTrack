/**
 * MediTrack Supabase Migration Examples
 * 
 * These examples show how each Strapi API call has been migrated to Supabase
 */

// ====================
// AUTHENTICATION EXAMPLES
// ====================

// OLD STRAPI LOGIN
/*
const response = await fetch('https://pathoguide.co.zw:1338/api/auth/local', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password })
});
*/

// NEW SUPABASE LOGIN
const { data, error } = await ApiHelper.auth.login(email, password);

// OLD STRAPI REGISTER
/*
const response = await fetch('https://pathoguide.co.zw:1338/api/auth/local/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
});
*/

// NEW SUPABASE REGISTER
const registerData = await ApiHelper.auth.register(email, password, { username });

// OLD STRAPI FORGOT PASSWORD
/*
const response = await fetch('https://pathoguide.co.zw:1338/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
});
*/

// NEW SUPABASE FORGOT PASSWORD
await ApiHelper.auth.resetPassword(email);

// ====================
// DATA RETRIEVAL EXAMPLES
// ====================

// OLD STRAPI GET CLINIC RECEIVES
/*
const response = await fetch('https://pathoguide.co.zw:1338/api/clinicreceives', {
    method: 'GET',
    headers: { ...TokenManager.getAuthHeader() }
});
const data = await response.json();
*/

// NEW SUPABASE GET CLINIC RECEIVES
const data = await ApiHelper.get('clinicReceives');

// OLD STRAPI GET WITH PAGINATION
/*
const response = await fetch(`https://pathoguide.co.zw:1338/api/pharmacyrecords?pagination[page]=${page}&pagination[pageSize]=${limit}`, {
    headers: { ...TokenManager.getAuthHeader() }
});
*/

// NEW SUPABASE GET WITH PAGINATION
const pagedData = await ApiHelper.get('pharmacyRecords', {
    range: { from: (page - 1) * limit, to: page * limit - 1 }
});

// OLD STRAPI GET WITH FILTERS
/*
const response = await fetch('https://pathoguide.co.zw:1338/api/clinicprocessings?filters[completion_status][$eq]=completed', {
    headers: { ...TokenManager.getAuthHeader() }
});
*/

// NEW SUPABASE GET WITH FILTERS
const filteredData = await ApiHelper.get('clinicProcessings', {
    filters: [
        { column: 'completion_status', operator: 'eq', value: 'completed' }
    ]
});

// ====================
// DATA INSERTION EXAMPLES
// ====================

// OLD STRAPI POST
/*
const response = await fetch('https://pathoguide.co.zw:1338/api/clinicreceives', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        ...TokenManager.getAuthHeader()
    },
    body: JSON.stringify({
        data: {
            patient_name: 'John Doe',
            patient_id: 'P123',
            doctor_name: 'Dr. Smith'
        }
    })
});
*/

// NEW SUPABASE POST
const newRecord = await ApiHelper.post('clinicReceives', {
    patient_name: 'John Doe',
    patient_id: 'P123', 
    doctor_name: 'Dr. Smith'
});

// ====================
// DATA UPDATE EXAMPLES  
// ====================

// OLD STRAPI PUT
/*
const response = await fetch(`https://pathoguide.co.zw:1338/api/clinicprocessings/${id}`, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        ...TokenManager.getAuthHeader()
    },
    body: JSON.stringify({
        data: {
            completion_status: 'completed',
            test_results: 'Normal'
        }
    })
});
*/

// NEW SUPABASE PUT
const updatedRecord = await ApiHelper.put('clinicProcessings', id, {
    completion_status: 'completed',
    test_results: 'Normal'
});

// ====================
// DATA DELETION EXAMPLES
// ====================

// OLD STRAPI DELETE
/*
const response = await fetch(`https://pathoguide.co.zw:1338/api/archives/${id}`, {
    method: 'DELETE',
    headers: { ...TokenManager.getAuthHeader() }
});
*/

// NEW SUPABASE DELETE
await ApiHelper.delete('archives', id);

// ====================
// USER PROFILE EXAMPLES
// ====================

// OLD STRAPI GET USER PROFILE
/*
const response = await fetch('https://pathoguide.co.zw:1338/api/users/me', {
    headers: { ...TokenManager.getAuthHeader() }
});
*/

// NEW SUPABASE GET USER PROFILE
const user = await TokenManager.getCurrentUser();

// ====================
// COMPLEX QUERY EXAMPLES
// ====================

// Get records created today
const today = new Date().toISOString().split('T')[0];
const todayRecords = await ApiHelper.get('clinicReceives', {
    filters: [
        { column: 'created_at', operator: 'gte', value: `${today}T00:00:00` },
        { column: 'created_at', operator: 'lt', value: `${today}T23:59:59` }
    ]
});

// Get records with ordering
const orderedRecords = await ApiHelper.get('pharmacyRecords', {
    orderBy: { column: 'created_at', ascending: false },
    range: { from: 0, to: 9 } // First 10 records
});

// Count total records
const totalCount = await ApiHelper.count('clinicProcessings');

// Count filtered records
const completedCount = await ApiHelper.count('clinicProcessings', {
    filters: [
        { column: 'completion_status', operator: 'eq', value: 'completed' }
    ]
});

// ====================
// REAL-TIME SUBSCRIPTIONS (NEW FEATURE)
// ====================

// Listen for new clinic receives
const subscription = ApiHelper.getClient()
    .from('clinic_receives')
    .on('INSERT', payload => {
        console.log('New record:', payload.new);
        // Update UI with new record
    })
    .subscribe();

// Clean up subscription
// subscription.unsubscribe();

export default {
    // Migration helpers
    migrateEndpointToTable: function(endpoint) {
        const mapping = {
            'clinicreceives': 'clinicReceives',
            'clinicprocessings': 'clinicProcessings', 
            'pharmacyrecords': 'pharmacyRecords',
            'archives': 'archives'
        };
        return mapping[endpoint] || endpoint;
    },
    
    // Convert Strapi format to Supabase format
    convertStrapiData: function(strapiData) {
        if (strapiData.data) {
            return strapiData.data.map(item => ({
                id: item.id,
                ...item.attributes
            }));
        }
        return strapiData;
    },
    
    // Convert Supabase format to Strapi format (for compatibility)
    convertToStrapiFormat: function(supabaseData) {
        if (Array.isArray(supabaseData)) {
            return {
                data: supabaseData.map(item => ({
                    id: item.id,
                    attributes: item
                }))
            };
        }
        return supabaseData;
    }
};
