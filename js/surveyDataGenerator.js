/**
 * Générateur de données pour questionnaires à choix multiples
 * Supporte deux modalités : réponse unique et réponses multiples
 */
class SurveyDataGenerator {
    constructor(params) {
        this.numRespondents = params.numRespondents;
        this.numOptions = params.numOptions;
        this.responseMode = params.responseMode; // 'single' ou 'multiple'
        this.avgResponsesPerPerson = params.avgResponsesPerPerson || 2;
        this.generationMode = params.generationMode || 'auto'; // 'auto' ou 'manual'
        this.manualValues = params.manualValues || null;
        this.optionLabels = params.optionLabels || this.generateDefaultLabels();

        this.data = null;
        this.stats = null;
    }

    /**
     * Génère les labels par défaut pour les options de réponse
     */
    generateDefaultLabels() {
        const labels = [];
        for (let i = 0; i < this.numOptions; i++) {
            labels.push(`Réponse ${String.fromCharCode(65 + i)}`); // A, B, C, D, ...
        }
        return labels;
    }

    /**
     * Génère les données selon le mode choisi
     */
    generate() {
        if (this.generationMode === 'manual' && this.manualValues) {
            this.data = this.generateManual();
        } else {
            this.data = this.generateAuto();
        }

        this.stats = this.calculateStats();
        return this.data;
    }

    /**
     * Génération automatique avec distribution aléatoire
     */
    generateAuto() {
        const data = {};

        // Initialiser les compteurs
        this.optionLabels.forEach(label => {
            data[label] = 0;
        });

        if (this.responseMode === 'single') {
            // Mode réponse unique : exactement 1 réponse par répondant
            for (let i = 0; i < this.numRespondents; i++) {
                const randomIndex = Math.floor(Math.random() * this.numOptions);
                const label = this.optionLabels[randomIndex];
                data[label]++;
            }
        } else {
            // Mode réponses multiples : plusieurs réponses possibles par répondant
            for (let i = 0; i < this.numRespondents; i++) {
                // Nombre de réponses pour ce répondant (1 à max, avec moyenne ciblée)
                const numResponses = this.getRandomNumResponses();

                // Sélectionner des réponses uniques pour ce répondant
                const selectedIndices = new Set();
                while (selectedIndices.size < numResponses) {
                    const randomIndex = Math.floor(Math.random() * this.numOptions);
                    selectedIndices.add(randomIndex);
                }

                // Incrémenter les compteurs
                selectedIndices.forEach(index => {
                    const label = this.optionLabels[index];
                    data[label]++;
                });
            }
        }

        return data;
    }

    /**
     * Obtient un nombre aléatoire de réponses par répondant
     * Suit une distribution autour de la moyenne spécifiée
     */
    getRandomNumResponses() {
        // Distribution autour de la moyenne avec écart-type de 1
        const mean = this.avgResponsesPerPerson;
        const stdDev = 1;

        // Box-Muller transform pour distribution normale
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

        let numResponses = Math.round(mean + z * stdDev);

        // Contraintes : au moins 1, au max numOptions
        numResponses = Math.max(1, Math.min(this.numOptions, numResponses));

        return numResponses;
    }

    /**
     * Génération manuelle avec valeurs spécifiées
     */
    generateManual() {
        const data = {};

        this.optionLabels.forEach((label, index) => {
            data[label] = this.manualValues[index] || 0;
        });

        return data;
    }

    /**
     * Calcule les statistiques descriptives
     */
    calculateStats() {
        const values = Object.values(this.data);
        const total = values.reduce((sum, val) => sum + val, 0);

        // Trouver la réponse dominante (mode)
        let maxValue = -1;
        let dominantResponse = null;

        Object.entries(this.data).forEach(([label, count]) => {
            if (count > maxValue) {
                maxValue = count;
                dominantResponse = label;
            }
        });

        // Calculer les pourcentages
        const percentages = {};
        Object.entries(this.data).forEach(([label, count]) => {
            percentages[label] = total > 0 ? (count / total * 100).toFixed(1) : 0;
        });

        return {
            numRespondents: this.numRespondents,
            totalResponses: total,
            responseMode: this.responseMode,
            responseModeLabel: this.responseMode === 'single' ? 'Unique' : 'Multiple',
            dominantResponse: dominantResponse,
            dominantCount: maxValue,
            dominantPercentage: total > 0 ? (maxValue / total * 100).toFixed(1) : 0,
            percentages: percentages,
            avgResponsesPerRespondent: (total / this.numRespondents).toFixed(2)
        };
    }

    /**
     * Retourne les données sous forme de tableau trié
     */
    getDataArray(sortDescending = false) {
        const array = Object.entries(this.data).map(([label, count]) => ({
            label: label,
            count: count,
            percentage: this.stats.percentages[label]
        }));

        if (sortDescending) {
            array.sort((a, b) => b.count - a.count);
        }

        return array;
    }

    /**
     * Retourne les statistiques
     */
    getStats() {
        return this.stats;
    }

    /**
     * Valide les données manuelles
     * Retourne true si valide, sinon un message d'erreur
     */
    static validateManualData(values, numRespondents, responseMode) {
        const total = values.reduce((sum, val) => sum + val, 0);

        if (responseMode === 'single') {
            if (total !== numRespondents) {
                return `Le total des réponses (${total}) doit être égal au nombre de répondants (${numRespondents}) en mode réponse unique.`;
            }
        } else {
            if (total < numRespondents) {
                return `Le total des réponses (${total}) doit être au moins égal au nombre de répondants (${numRespondents}) en mode réponses multiples.`;
            }
        }

        return true;
    }

    /**
     * Parse un fichier CSV
     * Format attendu : label,count (avec ou sans en-tête)
     */
    static parseCSV(csvContent) {
        const lines = csvContent.trim().split('\n');
        const data = {};
        let hasHeader = false;

        // Détection de l'en-tête
        const firstLine = lines[0].toLowerCase();
        if (firstLine.includes('label') || firstLine.includes('réponse') || firstLine.includes('option')) {
            hasHeader = true;
        }

        const startIndex = hasHeader ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',');
            if (parts.length >= 2) {
                const label = parts[0].trim();
                const count = parseInt(parts[1].trim());

                if (label && !isNaN(count)) {
                    data[label] = count;
                }
            }
        }

        return data;
    }

    /**
     * Parse un fichier JSON
     * Format attendu : {"Réponse A": 45, "Réponse B": 30, ...}
     * ou [{"label": "Réponse A", "count": 45}, ...]
     */
    static parseJSON(jsonContent) {
        try {
            const parsed = JSON.parse(jsonContent);

            if (Array.isArray(parsed)) {
                // Format tableau
                const data = {};
                parsed.forEach(item => {
                    if (item.label && item.count !== undefined) {
                        data[item.label] = item.count;
                    }
                });
                return data;
            } else if (typeof parsed === 'object') {
                // Format objet
                return parsed;
            }

            throw new Error('Format JSON non reconnu');
        } catch (e) {
            throw new Error('Erreur de parsing JSON : ' + e.message);
        }
    }
}
