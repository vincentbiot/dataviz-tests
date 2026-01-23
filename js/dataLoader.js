/**
 * DataLoader - Module pour charger et filtrer les données axe1
 */
class DataLoader {
    constructor() {
        this.data = null;           // Données brutes CSV parsées
        this.columns = [];          // Noms des colonnes
        this.years = [];            // Années disponibles
        this.questions = [];        // Colonnes de questions (code + description)
        this.loaded = false;        // Indicateur de chargement
    }

    /**
     * Charge et parse le fichier CSV
     * @param {string} csvPath - Chemin vers le fichier CSV
     * @returns {Promise<boolean>} - True si chargement réussi
     */
    async load(csvPath) {
        try {
            const response = await fetch(csvPath);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const text = await response.text();
            this.parseCSV(text);
            this.loaded = true;
            return true;
        } catch (error) {
            console.error('Erreur lors du chargement du CSV:', error);
            this.loaded = false;
            return false;
        }
    }

    /**
     * Parse le contenu CSV
     * @param {string} text - Contenu du fichier CSV
     */
    parseCSV(text) {
        const lines = text.split('\n');

        // Parse l'en-tête
        const headerLine = lines[0];
        this.columns = this.parseCSVLine(headerLine);

        // Identifier les colonnes de questions (entre les colonnes fixes et panel1)
        // Colonnes fixes: "", numero_finess_geographique, annee
        // Dernière colonne: panel1
        const questionStartIndex = 3;  // Première question après "annee"
        const questionEndIndex = this.columns.length - 1;  // Avant "panel1"

        this.questions = this.columns.slice(questionStartIndex, questionEndIndex).map((col, index) => ({
            index: questionStartIndex + index,
            code: col.split('-')[0],
            label: col,
            shortLabel: this.truncateLabel(col, 60)
        }));

        // Parser les données
        this.data = [];
        const yearsSet = new Set();

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = this.parseCSVLine(line);
            if (values.length < this.columns.length) continue;

            const year = parseInt(values[2], 10);
            if (!isNaN(year)) {
                yearsSet.add(year);
            }

            this.data.push(values);
        }

        // Trier les années
        this.years = Array.from(yearsSet).sort((a, b) => b - a);  // Plus récentes en premier
    }

    /**
     * Parse une ligne CSV en tenant compte des guillemets
     * @param {string} line - Ligne CSV
     * @returns {string[]} - Tableau de valeurs
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        // Ajouter la dernière valeur
        result.push(current.trim());

        return result;
    }

    /**
     * Tronque un label pour l'affichage
     * @param {string} label - Label complet
     * @param {number} maxLength - Longueur maximale
     * @returns {string} - Label tronqué
     */
    truncateLabel(label, maxLength) {
        if (label.length <= maxLength) return label;
        return label.substring(0, maxLength - 3) + '...';
    }

    /**
     * Retourne les années disponibles
     * @returns {number[]} - Liste des années
     */
    getYears() {
        return this.years;
    }

    /**
     * Retourne les questions disponibles
     * @returns {Object[]} - Liste des questions avec code et label
     */
    getQuestions() {
        return this.questions;
    }

    /**
     * Récupère les données filtrées pour une année, question et panel
     * @param {number} year - Année
     * @param {number} questionIndex - Index de la colonne de question
     * @param {string} panel - Panel ("A", "B" ou "all")
     * @returns {Object} - Données et statistiques
     */
    getData(year, questionIndex, panel = 'all') {
        if (!this.loaded || !this.data) {
            return { values: [], totalCount: 0, validCount: 0, naCount: 0 };
        }

        const panelColumnIndex = this.columns.length - 1;  // Dernière colonne
        const yearString = year.toString();

        const values = [];
        let totalCount = 0;
        let naCount = 0;

        for (const row of this.data) {
            // Filtrer par année
            if (row[2] !== yearString) continue;

            // Filtrer par panel si spécifié
            const rowPanel = row[panelColumnIndex];
            if (panel !== 'all' && rowPanel !== panel) continue;

            totalCount++;

            // Extraire la valeur
            const rawValue = row[questionIndex];

            // Vérifier les valeurs NA ou vides
            if (rawValue === 'NA' || rawValue === '' || rawValue === undefined) {
                naCount++;
                continue;
            }

            // Convertir en nombre
            const value = parseFloat(rawValue);
            if (!isNaN(value)) {
                values.push(value);
            } else {
                naCount++;
            }
        }

        return {
            values,
            totalCount,
            validCount: values.length,
            naCount,
            naPercent: totalCount > 0 ? ((naCount / totalCount) * 100).toFixed(1) : 0
        };
    }

    /**
     * Vérifie si les données sont chargées
     * @returns {boolean}
     */
    isLoaded() {
        return this.loaded;
    }

    /**
     * Retourne le nombre total de lignes
     * @returns {number}
     */
    getRowCount() {
        return this.data ? this.data.length : 0;
    }
}
