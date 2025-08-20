/**
 * Strapi to Supabase Migration Script
 * This script helps migrate all Strapi API calls to Supabase
 */

// Common patterns to replace in HTML files
const migrationPatterns = [
    // Authentication endpoints
    {
        old: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/auth\/local', \{[\s\S]*?\}\);/g,
        new: 'const { user, session, error } = await ApiHelper.auth.login(email, password);'
    },
    {
        old: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/auth\/local\/register', \{[\s\S]*?\}\);/g,
        new: 'const { user, session, error } = await ApiHelper.auth.register(email, password, userData);'
    },
    {
        old: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/auth\/forgot-password', \{[\s\S]*?\}\);/g,
        new: 'const { error } = await ApiHelper.auth.resetPassword(email);'
    },
    {
        old: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/auth\/reset-password', \{[\s\S]*?\}\);/g,
        new: 'const { error } = await ApiHelper.auth.updatePassword(newPassword);'
    },

    // Data endpoints
    {
        old: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/clinicreceives'[^;]*;[\s\S]*?const data = await response\.json\(\);[\s\S]*?const (\w+) = data\.data;/g,
        new: 'const { data: $1, error } = await ApiHelper.clinicReceives.getAll();'
    },
    {
        old: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/clinicprocessings'[^;]*;[\s\S]*?const data = await response\.json\(\);[\s\S]*?const (\w+) = data\.data;/g,
        new: 'const { data: $1, error } = await ApiHelper.clinicProcessings.getAll();'
    },
    {
        old: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/pharmacyrecords'[^;]*;[\s\S]*?const data = await response\.json\(\);[\s\S]*?const (\w+) = data\.data;/g,
        new: 'const { data: $1, error } = await ApiHelper.pharmacyRecords.getAll();'
    },
    {
        old: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/archives'[^;]*;[\s\S]*?const data = await response\.json\(\);[\s\S]*?const (\w+) = data\.data;/g,
        new: 'const { data: $1, error } = await ApiHelper.archives.getAll();'
    },

    // User profile endpoint
    {
        old: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/users\/me'[^;]*;[\s\S]*?const data = await response\.json\(\);/g,
        new: 'const { data: user, error } = await ApiHelper.auth.getCurrentUser();'
    },

    // Attribute access patterns
    {
        old: /\.attributes\.createdAt/g,
        new: '.created_at'
    },
    {
        old: /\.attributes\.updatedAt/g,
        new: '.updated_at'
    },
    {
        old: /\.attributes\.availability/g,
        new: '.availability'
    },
    {
        old: /\.attributes\.(\w+)/g,
        new: '.$1'
    },

    // Error handling
    {
        old: /if \(!response\.ok\) \{[\s\S]*?throw new Error\('[^']*'\);[\s\S]*?\}/g,
        new: 'if (error) { throw new Error(`Failed to fetch data: ${error.message}`); }'
    }
];

// Manual replacements needed for specific files
const manualReplacements = {
    // Files that need special handling
    'clinician/home.html': [
        // Already handled above
    ],
    'pages/processing-page.html': [
        {
            old: 'fetch(`https://pathoguide.co.zw:1338/api/pharmacyrecords?pagination[page]=${page}&pagination[pageSize]=${limit}`',
            new: 'ApiHelper.pharmacyRecords.getPage(page, limit)'
        }
    ]
};

console.log('Migration patterns defined. Use these to systematically update your files.');
console.log('Key changes:');
console.log('1. Replace fetch() calls with ApiHelper methods');
console.log('2. Update data.data to just data');
console.log('3. Change .attributes.field to .field');
console.log('4. Update error handling to check for error object');
