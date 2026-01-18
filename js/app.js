// Initialisation
const dataGenerator = new DataGenerator();
const visualizations = new Visualizations();

// Éléments du DOM
const sampleSizeInput = document.getElementById('sampleSize');
const sampleSizeValue = document.getElementById('sampleSizeValue');
const minValueInput = document.getElementById('minValue');
const maxValueInput = document.getElementById('maxValue');
const distributionSelect = document.getElementById('distribution');
const meanInput = document.getElementById('mean');
const stdDevInput = document.getElementById('stdDev');
const outliersInput = document.getElementById('outliers');
const outliersValue = document.getElementById('outliersValue');
const generateBtn = document.getElementById('generateBtn');
const exportBtn = document.getElementById('exportBtn');
const normalParams = document.getElementById('normalParams');

// Éléments de statistiques
const statElements = {
    n: document.getElementById('statN'),
    mean: document.getElementById('statMean'),
    median: document.getElementById('statMedian'),
    stdDev: document.getElementById('statStdDev'),
    q1: document.getElementById('statQ1'),
    q3: document.getElementById('statQ3'),
    min: document.getElementById('statMin'),
    max: document.getElementById('statMax')
};

// Mise à jour des affichages de valeurs
sampleSizeInput.addEventListener('input', (e) => {
    sampleSizeValue.textContent = e.target.value;
});

outliersInput.addEventListener('input', (e) => {
    outliersValue.textContent = e.target.value + '%';
});

// Afficher/masquer les paramètres de distribution normale
distributionSelect.addEventListener('change', (e) => {
    if (e.target.value === 'normal' || e.target.value === 'bimodal') {
        normalParams.style.display = 'block';
    } else {
        normalParams.style.display = 'none';
    }
});

// Fonction pour récupérer les paramètres
function getParameters() {
    return {
        sampleSize: parseInt(sampleSizeInput.value),
        minValue: parseFloat(minValueInput.value),
        maxValue: parseFloat(maxValueInput.value),
        distribution: distributionSelect.value,
        mean: parseFloat(meanInput.value),
        stdDev: parseFloat(stdDevInput.value),
        outlierPercent: parseFloat(outliersInput.value)
    };
}

// Fonction pour valider les paramètres
function validateParameters(params) {
    if (params.minValue >= params.maxValue) {
        alert('La valeur minimale doit être inférieure à la valeur maximale');
        return false;
    }

    if (params.distribution === 'normal' || params.distribution === 'bimodal') {
        if (params.stdDev <= 0) {
            alert('L\'écart-type doit être supérieur à 0');
            return false;
        }
        if (params.mean < params.minValue || params.mean > params.maxValue) {
            alert('La moyenne doit être comprise entre les valeurs min et max');
            return false;
        }
    }

    return true;
}

// Fonction pour mettre à jour les statistiques
function updateStats(stats) {
    if (!stats) return;

    statElements.n.textContent = stats.n;
    statElements.mean.textContent = stats.mean;
    statElements.median.textContent = stats.median;
    statElements.stdDev.textContent = stats.stdDev;
    statElements.q1.textContent = stats.q1;
    statElements.q3.textContent = stats.q3;
    statElements.min.textContent = stats.min;
    statElements.max.textContent = stats.max;
}

// Fonction principale pour générer et visualiser
function generateAndVisualize() {
    const params = getParameters();

    if (!validateParameters(params)) {
        return;
    }

    // Générer les données
    const data = dataGenerator.generate(params);

    // Calculer les statistiques
    const stats = dataGenerator.getStats();

    // Mettre à jour les statistiques affichées
    updateStats(stats);

    // Dessiner toutes les visualisations
    visualizations.drawAll(data, stats);
}

// Event listener pour le bouton de génération
generateBtn.addEventListener('click', generateAndVisualize);

// Fonction d'export
exportBtn.addEventListener('click', () => {
    const svgElements = document.querySelectorAll('svg');

    svgElements.forEach((svg, index) => {
        const vizNames = ['histogram', 'boxplot', 'violinplot', 'dotplot', 'densityplot', 'barchart'];
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${vizNames[index]}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    alert('Graphiques exportés avec succès !');
});

// Génération initiale au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    generateAndVisualize();
});
