/**
 * MediTrack Treatment Recommendation Engine
 * Core algorithm for medicine efficacy tracking and best fit analysis
 */
window.TreatmentEngine = {
    // Treatment efficacy database
    efficacyDatabase: new Map(),
    
    // Pharmacy inventory cache
    pharmacyInventory: new Map(),
    
    // Treatment history for outcome tracking
    treatmentHistory: new Map(),

    /**
     * Initialize the treatment engine
     */
    init: function() {
        console.log('🧬 Initializing Treatment Recommendation Engine...');
        this.loadEfficacyData();
        this.loadPharmacyInventory();
        this.loadTreatmentHistory();
        console.log('✅ Treatment Engine ready!');
    },

    /**
     * Load medicine efficacy data from API
     */
    loadEfficacyData: async function() {
        try {
            const response = await ApiHelper.get(`${MediTrackConfig.endpoints.clinicProcessings}?populate=*`);
            
            if (response.success && response.data?.data) {
                this.processEfficacyData(response.data.data);
            }
        } catch (error) {
            console.error('Error loading efficacy data:', error);
        }
    },

    /**
     * Process raw data into efficacy metrics
     */
    processEfficacyData: function(rawData) {
        const efficacyMap = new Map();
        
        rawData.forEach(record => {
            const data = record.attributes;
            const condition = data.condition;
            
            if (data.processingdata && data.processingdata.length > 0) {
                data.processingdata.forEach(treatment => {
                    const drugName = treatment.drugused;
                    if (!drugName) return;
                    
                    const key = `${condition}:${drugName}`;
                    
                    if (!efficacyMap.has(key)) {
                        efficacyMap.set(key, {
                            condition: condition,
                            medicine: drugName,
                            totalCases: 0,
                            successfulTreatments: 0,
                            averageRecoveryTime: 0,
                            sideEffects: [],
                            ageGroups: {},
                            dosageInfo: [],
                            efficacyRate: 0
                        });
                    }
                    
                    const efficacyData = efficacyMap.get(key);
                    efficacyData.totalCases++;
                    
                    // Simulate treatment outcomes (replace with real outcome data)
                    const success = Math.random() > 0.2; // 80% success rate simulation
                    if (success) {
                        efficacyData.successfulTreatments++;
                    }
                    
                    // Age group tracking
                    const age = parseInt(data.age);
                    const ageGroup = this.getAgeGroup(age);
                    efficacyData.ageGroups[ageGroup] = (efficacyData.ageGroups[ageGroup] || 0) + 1;
                    
                    // Calculate efficacy rate
                    efficacyData.efficacyRate = (efficacyData.successfulTreatments / efficacyData.totalCases) * 100;
                    
                    // Simulate recovery time (replace with real data)
                    efficacyData.averageRecoveryTime = Math.floor(Math.random() * 14) + 3; // 3-17 days
                    
                    // Simulate dosage information
                    if (treatment.dosage) {
                        efficacyData.dosageInfo.push(treatment.dosage);
                    }
                });
            }
        });
        
        this.efficacyDatabase = efficacyMap;
        console.log(`📊 Processed efficacy data for ${efficacyMap.size} medicine-condition combinations`);
    },

    /**
     * Load pharmacy inventory data
     */
    loadPharmacyInventory: async function() {
        try {
            // This would typically fetch from a pharmacy API endpoint
            // For now, we'll simulate pharmacy inventory
            this.simulatePharmacyInventory();
        } catch (error) {
            console.error('Error loading pharmacy inventory:', error);
        }
    },

    /**
     * Simulate pharmacy inventory (replace with real API calls)
     */
    simulatePharmacyInventory: function() {
        const commonMedicines = [
            { name: 'Amoxicillin', category: 'Antibiotic', stock: 150, price: 25.50, pharmacy: 'CityMed Pharmacy' },
            { name: 'Ciprofloxacin', category: 'Antibiotic', stock: 89, price: 35.00, pharmacy: 'HealthPlus Pharmacy' },
            { name: 'Azithromycin', category: 'Antibiotic', stock: 200, price: 45.25, pharmacy: 'CityMed Pharmacy' },
            { name: 'Cephalexin', category: 'Antibiotic', stock: 75, price: 30.00, pharmacy: 'MediCare Pharmacy' },
            { name: 'Doxycycline', category: 'Antibiotic', stock: 120, price: 28.75, pharmacy: 'HealthPlus Pharmacy' },
            { name: 'Metronidazole', category: 'Antibiotic', stock: 95, price: 22.50, pharmacy: 'CityMed Pharmacy' },
            { name: 'Trimethoprim', category: 'Antibiotic', stock: 60, price: 18.00, pharmacy: 'MediCare Pharmacy' },
            { name: 'Fluconazole', category: 'Antifungal', stock: 45, price: 55.00, pharmacy: 'HealthPlus Pharmacy' },
            { name: 'Acyclovir', category: 'Antiviral', stock: 30, price: 42.25, pharmacy: 'CityMed Pharmacy' },
            { name: 'Ibuprofen', category: 'Anti-inflammatory', stock: 300, price: 12.50, pharmacy: 'All Pharmacies' }
        ];

        commonMedicines.forEach(medicine => {
            this.pharmacyInventory.set(medicine.name.toLowerCase(), medicine);
        });

        console.log(`💊 Loaded ${commonMedicines.length} medicines from pharmacy inventory`);
    },

    /**
     * Load treatment history for outcome tracking
     */
    loadTreatmentHistory: function() {
        // This would typically load from a treatments API endpoint
        // For now, we'll initialize an empty history
        console.log('📋 Treatment history tracking initialized');
    },

    /**
     * Get the best treatment recommendations for a condition
     */
    getRecommendations: function(condition, patientAge = null, availableOnly = true) {
        const recommendations = [];
        
        // Find all medicines for this condition
        for (let [key, efficacyData] of this.efficacyDatabase) {
            if (efficacyData.condition.toLowerCase() === condition.toLowerCase()) {
                // Check if medicine is available in pharmacy
                const availability = this.checkMedicineAvailability(efficacyData.medicine);
                
                if (!availableOnly || availability.available) {
                    recommendations.push({
                        medicine: efficacyData.medicine,
                        efficacyRate: efficacyData.efficacyRate,
                        totalCases: efficacyData.totalCases,
                        averageRecoveryTime: efficacyData.averageRecoveryTime,
                        availability: availability,
                        ageGroupFit: patientAge ? this.calculateAgeGroupFit(efficacyData, patientAge) : null,
                        recommendationScore: this.calculateRecommendationScore(efficacyData, patientAge, availability)
                    });
                }
            }
        }
        
        // Sort by recommendation score (highest first)
        recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
        
        return recommendations;
    },

    /**
     * Check if a medicine is available in pharmacies
     */
    checkMedicineAvailability: function(medicineName) {
        const medicine = this.pharmacyInventory.get(medicineName.toLowerCase());
        
        if (medicine) {
            return {
                available: medicine.stock > 0,
                stock: medicine.stock,
                price: medicine.price,
                pharmacy: medicine.pharmacy,
                category: medicine.category
            };
        }
        
        return {
            available: false,
            stock: 0,
            price: null,
            pharmacy: null,
            category: null
        };
    },

    /**
     * Calculate recommendation score based on multiple factors
     */
    calculateRecommendationScore: function(efficacyData, patientAge, availability) {
        let score = 0;
        
        // Efficacy rate (0-40 points)
        score += (efficacyData.efficacyRate / 100) * 40;
        
        // Number of cases (0-20 points) - more data = more reliable
        const caseScore = Math.min(efficacyData.totalCases / 50, 1) * 20;
        score += caseScore;
        
        // Recovery time (0-20 points) - faster recovery = higher score
        const recoveryScore = Math.max(0, (21 - efficacyData.averageRecoveryTime) / 21) * 20;
        score += recoveryScore;
        
        // Availability (0-15 points)
        if (availability.available) {
            score += 15;
            // Bonus for higher stock
            if (availability.stock > 100) score += 2;
            if (availability.stock > 200) score += 3;
        }
        
        // Age group fit (0-5 points)
        if (patientAge) {
            const ageGroupFit = this.calculateAgeGroupFit(efficacyData, patientAge);
            score += ageGroupFit * 5;
        }
        
        return Math.round(score * 100) / 100; // Round to 2 decimal places
    },

    /**
     * Calculate how well a medicine fits a specific age group
     */
    calculateAgeGroupFit: function(efficacyData, patientAge) {
        const patientAgeGroup = this.getAgeGroup(patientAge);
        const totalCases = efficacyData.totalCases;
        const ageGroupCases = efficacyData.ageGroups[patientAgeGroup] || 0;
        
        // Return the proportion of cases in this age group (0-1)
        return totalCases > 0 ? ageGroupCases / totalCases : 0;
    },

    /**
     * Get age group for a given age
     */
    getAgeGroup: function(age) {
        if (age <= 12) return 'child';
        if (age <= 18) return 'teen';
        if (age <= 35) return 'young_adult';
        if (age <= 55) return 'adult';
        return 'senior';
    },

    /**
     * Record treatment outcome for continuous learning
     */
    recordTreatmentOutcome: function(patientId, condition, medicine, outcome, recoveryTime, sideEffects = []) {
        const treatmentRecord = {
            patientId: patientId,
            condition: condition,
            medicine: medicine,
            outcome: outcome, // 'success', 'partial', 'failure'
            recoveryTime: recoveryTime,
            sideEffects: sideEffects,
            timestamp: new Date(),
            followUpRequired: outcome !== 'success'
        };
        
        this.treatmentHistory.set(`${patientId}-${Date.now()}`, treatmentRecord);
        
        // Update efficacy database with new outcome
        this.updateEfficacyData(condition, medicine, outcome, recoveryTime);
        
        console.log('📝 Treatment outcome recorded:', treatmentRecord);
        return treatmentRecord;
    },

    /**
     * Update efficacy data with new treatment outcome
     */
    updateEfficacyData: function(condition, medicine, outcome, recoveryTime) {
        const key = `${condition}:${medicine}`;
        
        if (this.efficacyDatabase.has(key)) {
            const efficacyData = this.efficacyDatabase.get(key);
            efficacyData.totalCases++;
            
            if (outcome === 'success') {
                efficacyData.successfulTreatments++;
            }
            
            // Update average recovery time
            efficacyData.averageRecoveryTime = (
                (efficacyData.averageRecoveryTime * (efficacyData.totalCases - 1) + recoveryTime) / 
                efficacyData.totalCases
            );
            
            // Recalculate efficacy rate
            efficacyData.efficacyRate = (efficacyData.successfulTreatments / efficacyData.totalCases) * 100;
        }
    },

    /**
     * Get comprehensive treatment analytics
     */
    getAnalytics: function() {
        const analytics = {
            totalConditions: new Set(),
            totalMedicines: new Set(),
            totalCases: 0,
            averageEfficacyRate: 0,
            topPerformingMedicines: [],
            treatmentTrends: {}
        };
        
        for (let [key, efficacyData] of this.efficacyDatabase) {
            analytics.totalConditions.add(efficacyData.condition);
            analytics.totalMedicines.add(efficacyData.medicine);
            analytics.totalCases += efficacyData.totalCases;
            
            analytics.topPerformingMedicines.push({
                medicine: efficacyData.medicine,
                condition: efficacyData.condition,
                efficacyRate: efficacyData.efficacyRate,
                totalCases: efficacyData.totalCases
            });
        }
        
        // Calculate average efficacy rate
        if (this.efficacyDatabase.size > 0) {
            const totalEfficacy = Array.from(this.efficacyDatabase.values())
                .reduce((sum, data) => sum + data.efficacyRate, 0);
            analytics.averageEfficacyRate = totalEfficacy / this.efficacyDatabase.size;
        }
        
        // Sort top performing medicines
        analytics.topPerformingMedicines.sort((a, b) => b.efficacyRate - a.efficacyRate);
        analytics.topPerformingMedicines = analytics.topPerformingMedicines.slice(0, 10);
        
        // Convert sets to counts
        analytics.totalConditions = analytics.totalConditions.size;
        analytics.totalMedicines = analytics.totalMedicines.size;
        
        return analytics;
    },

    /**
     * Search for alternative treatments
     */
    findAlternatives: function(condition, excludeMedicines = []) {
        const alternatives = this.getRecommendations(condition);
        
        return alternatives.filter(rec => 
            !excludeMedicines.includes(rec.medicine.toLowerCase())
        );
    },

    /**
     * Get drug interaction warnings (simplified)
     */
    checkDrugInteractions: function(medicines) {
        // This would typically integrate with a drug interaction database
        // For now, we'll provide a simplified check
        const interactions = [];
        
        const knownInteractions = {
            'amoxicillin': ['methotrexate'],
            'ciprofloxacin': ['warfarin', 'theophylline'],
            'azithromycin': ['digoxin', 'warfarin'],
            'doxycycline': ['warfarin', 'lithium']
        };
        
        medicines.forEach(medicine1 => {
            medicines.forEach(medicine2 => {
                if (medicine1 !== medicine2) {
                    const interactions1 = knownInteractions[medicine1.toLowerCase()] || [];
                    if (interactions1.includes(medicine2.toLowerCase())) {
                        interactions.push({
                            drug1: medicine1,
                            drug2: medicine2,
                            severity: 'moderate',
                            description: `Potential interaction between ${medicine1} and ${medicine2}`
                        });
                    }
                }
            });
        });
        
        return interactions;
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.ApiHelper && window.MediTrackConfig) {
        setTimeout(() => {
            TreatmentEngine.init();
        }, 1500);
    }
});
