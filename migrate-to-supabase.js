#!/usr/bin/env node

/**
 * Automated Strapi to Supabase Migration Script
 * This script updates all HTML files to replace Strapi API calls with Supabase
 */

const fs = require('fs');
const path = require('path');

// Define replacement patterns
const replacements = [
    // Clinic Receives API calls
    {
        pattern: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/clinicreceives'[^;]*;[\s\S]*?const data = await response\.json\(\);[\s\S]*?const (\w+) = data\.data;/g,
        replacement: 'const { data: $1, error } = await ApiHelper.clinicReceives.getAll();\n                          \n                          if (error) {\n                            throw new Error(`Failed to fetch clinic receives: ${error.message}`);\n                          }'
    },
    
    // Clinic Processings API calls
    {
        pattern: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/clinicprocessings'[^;]*;[\s\S]*?const data = await response\.json\(\);[\s\S]*?const (\w+) = data\.data;/g,
        replacement: 'const { data: $1, error } = await ApiHelper.clinicProcessings.getAll();\n                      \n                      if (error) {\n                        throw new Error(`Failed to fetch clinic processings: ${error.message}`);\n                      }'
    },
    
    // Pharmacy Records API calls
    {
        pattern: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/pharmacyrecords'[^;]*;[\s\S]*?const data = await response\.json\(\);[\s\S]*?const (\w+) = data\.data;/g,
        replacement: 'const { data: $1, error } = await ApiHelper.pharmacyRecords.getAll();\n                          \n                          if (error) {\n                            throw new Error(`Failed to fetch pharmacy records: ${error.message}`);\n                          }'
    },
    
    // Archives API calls
    {
        pattern: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/archives'[^;]*;[\s\S]*?const data = await response\.json\(\);[\s\S]*?const (\w+) = data\.data;/g,
        replacement: 'const { data: $1, error } = await ApiHelper.archives.getAll();\n                              \n                              if (error) {\n                                throw new Error(`Failed to fetch archives: ${error.message}`);\n                              }'
    },
    
    // Authentication calls
    {
        pattern: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/auth\/local'[^;]*;[\s\S]*?const data = await response\.json\(\);/g,
        replacement: 'const { user, session, error } = await ApiHelper.auth.login(email, password);\n                  \n                  if (error) {\n                    throw new Error(`Login failed: ${error.message}`);\n                  }'
    },
    
    {
        pattern: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/auth\/forgot-password'[^;]*;[\s\S]*?const data = await response\.json\(\);/g,
        replacement: 'const { error } = await ApiHelper.auth.resetPassword(email);\n                  \n                  if (error) {\n                    throw new Error(`Password reset failed: ${error.message}`);\n                  }'
    },
    
    {
        pattern: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/auth\/reset-password'[^;]*;[\s\S]*?const data = await response\.json\(\);/g,
        replacement: 'const { error } = await ApiHelper.auth.updatePassword(newPassword);\n                  \n                  if (error) {\n                    throw new Error(`Password update failed: ${error.message}`);\n                  }'
    },
    
    {
        pattern: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/users\/me'[^;]*;[\s\S]*?const data = await response\.json\(\);/g,
        replacement: 'const { data: user, error } = await ApiHelper.auth.getCurrentUser();\n    \n    if (error) {\n      throw new Error(`Failed to fetch user profile: ${error.message}`);\n    }'
    },
    
    // POST requests for creating data
    {
        pattern: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/clinicreceives',\s*\{\s*method:\s*'POST'[^}]*\}\);[\s\S]*?const data = await response\.json\(\);/g,
        replacement: 'const { data, error } = await ApiHelper.clinicReceives.create(clinicData);\n                  \n                  if (error) {\n                    throw new Error(`Failed to create clinic receive: ${error.message}`);\n                  }'
    },
    
    {
        pattern: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/clinicprocessings',\s*\{\s*method:\s*'POST'[^}]*\}\);[\s\S]*?const data = await response\.json\(\);/g,
        replacement: 'const { data, error } = await ApiHelper.clinicProcessings.create(processingData);\n                          \n                          if (error) {\n                            throw new Error(`Failed to create processing record: ${error.message}`);\n                          }'
    },
    
    {
        pattern: /const response = await fetch\('https:\/\/pathoguide\.co\.zw:1338\/api\/pharmacyrecords',\s*\{\s*method:\s*'POST'[^}]*\}\);[\s\S]*?const data = await response\.json\(\);/g,
        replacement: 'const { data, error } = await ApiHelper.pharmacyRecords.create(pharmacyData);\n                                          \n                                          if (error) {\n                                            throw new Error(`Failed to create pharmacy record: ${error.message}`);\n                                          }'
    },
    
    // Update attribute access patterns
    {
        pattern: /\.attributes\.createdAt/g,
        replacement: '.created_at'
    },
    {
        pattern: /\.attributes\.updatedAt/g,
        replacement: '.updated_at'
    },
    {
        pattern: /\.attributes\.availability/g,
        replacement: '.availability'
    },
    {
        pattern: /\.attributes\.(\w+)/g,
        replacement: '.$1'
    },
    
    // Update pagination access
    {
        pattern: /fetch\(`https:\/\/pathoguide\.co\.zw:1338\/api\/pharmacyrecords\?pagination\[page\]=\$\{page\}&pagination\[pageSize\]=\$\{limit\}`/g,
        replacement: 'ApiHelper.pharmacyRecords.getPage(page, limit)'
    }
];

// Files that have been manually updated and should be skipped
const skipFiles = [
    'clinician/home.html',
    'labscientist/processing-page.html'
];

// Function to process a single file
function processFile(filePath) {
    if (skipFiles.some(skip => filePath.includes(skip))) {
        console.log(`Skipping ${filePath} (manually updated)`);
        return;
    }
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        replacements.forEach(({ pattern, replacement }) => {
            if (pattern.test(content)) {
                content = content.replace(pattern, replacement);
                modified = true;
            }
        });
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

// Function to find all HTML files with Strapi calls
function findFilesToUpdate(dir) {
    const files = [];
    
    function scanDirectory(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        items.forEach(item => {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            } else if (item.endsWith('.html')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    if (content.includes('pathoguide.co.zw:1338')) {
                        files.push(fullPath);
                    }
                } catch (error) {
                    console.error(`Error reading ${fullPath}:`, error.message);
                }
            }
        });
    }
    
    scanDirectory(dir);
    return files;
}

// Main execution
if (require.main === module) {
    const rootDir = process.argv[2] || '.';
    console.log('Scanning for files with Strapi API calls...');
    
    const filesToUpdate = findFilesToUpdate(rootDir);
    console.log(`Found ${filesToUpdate.length} files to update:`);
    
    filesToUpdate.forEach(file => {
        console.log(`  ${file}`);
    });
    
    console.log('\nStarting migration...');
    filesToUpdate.forEach(processFile);
    console.log('\nMigration complete!');
}

module.exports = { replacements, processFile, findFilesToUpdate };
