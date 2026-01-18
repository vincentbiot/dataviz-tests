class DataGenerator {
    constructor() {
        this.data = [];
    }

    // Générateur de distribution normale (Box-Muller transform)
    normalRandom(mean, stdDev) {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return z * stdDev + mean;
    }

    // Générateur de distribution uniforme
    uniformRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Générateur de distribution asymétrique (skewed right)
    skewedRightRandom(min, max) {
        // Utilise une transformation de puissance pour créer une asymétrie
        const uniform = Math.random();
        const skewed = Math.pow(uniform, 2); // Skewed to the right
        return skewed * (max - min) + min;
    }

    // Générateur de distribution asymétrique (skewed left)
    skewedLeftRandom(min, max) {
        const uniform = Math.random();
        const skewed = 1 - Math.pow(1 - uniform, 2); // Skewed to the left
        return skewed * (max - min) + min;
    }

    // Générateur de distribution bimodale
    bimodalRandom(min, max) {
        const center = (min + max) / 2;
        const range = (max - min) / 2;
        const mean1 = center - range * 0.5;
        const mean2 = center + range * 0.5;
        const stdDev = range * 0.2;

        // 50% de chance de choisir l'une ou l'autre distribution
        if (Math.random() < 0.5) {
            return this.normalRandom(mean1, stdDev);
        } else {
            return this.normalRandom(mean2, stdDev);
        }
    }

    // Génère les données selon les paramètres
    generate(params) {
        const { sampleSize, minValue, maxValue, distribution, mean, stdDev, outlierPercent } = params;
        this.data = [];

        const numOutliers = Math.floor(sampleSize * outlierPercent / 100);
        const numNormal = sampleSize - numOutliers;

        // Génération des données normales
        for (let i = 0; i < numNormal; i++) {
            let value;

            switch(distribution) {
                case 'normal':
                    value = this.normalRandom(mean, stdDev);
                    break;
                case 'uniform':
                    value = this.uniformRandom(minValue, maxValue);
                    break;
                case 'bimodal':
                    value = this.bimodalRandom(minValue, maxValue);
                    break;
                case 'skewed':
                    value = this.skewedRightRandom(minValue, maxValue);
                    break;
                case 'skewed-left':
                    value = this.skewedLeftRandom(minValue, maxValue);
                    break;
                default:
                    value = this.normalRandom(mean, stdDev);
            }

            // Clamp les valeurs pour la distribution normale
            if (distribution === 'normal' || distribution === 'bimodal') {
                value = Math.max(minValue, Math.min(maxValue, value));
            }

            this.data.push(value);
        }

        // Génération des outliers
        const range = maxValue - minValue;
        for (let i = 0; i < numOutliers; i++) {
            // Outliers en dehors de la plage normale
            let outlier;
            if (Math.random() < 0.5) {
                // Outlier vers le bas
                outlier = minValue - Math.random() * range * 0.3;
            } else {
                // Outlier vers le haut
                outlier = maxValue + Math.random() * range * 0.3;
            }
            this.data.push(outlier);
        }

        return this.data;
    }

    // Calcule les statistiques descriptives
    getStats() {
        if (this.data.length === 0) return null;

        const sorted = [...this.data].sort((a, b) => a - b);
        const n = sorted.length;

        const mean = d3.mean(sorted);
        const median = d3.median(sorted);
        const stdDev = d3.deviation(sorted);
        const min = d3.min(sorted);
        const max = d3.max(sorted);

        // Calcul des quartiles
        const q1 = d3.quantile(sorted, 0.25);
        const q3 = d3.quantile(sorted, 0.75);

        return {
            n,
            mean: mean.toFixed(2),
            median: median.toFixed(2),
            stdDev: stdDev.toFixed(2),
            min: min.toFixed(2),
            max: max.toFixed(2),
            q1: q1.toFixed(2),
            q3: q3.toFixed(2)
        };
    }

    getData() {
        return this.data;
    }
}
