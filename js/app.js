// Initialisation
const dataGenerator = new DataGenerator();
const visualizations = new Visualizations();

// Éléments du DOM - Paramètres de génération
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

// Éléments du DOM - Configuration du graphique
const chartTypeSelect = document.getElementById('chartType');
const showDataPointsCheckbox = document.getElementById('showDataPoints');
const chartTitle = document.getElementById('chartTitle');

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

// Mapping des titres
const chartTitles = {
    boxplot: 'Box Plot',
    violinplot: 'Violin Plot',
    density: 'Density Plot'
};

// Stockage des données courantes
let currentData = null;
let currentStats = null;

// Mise à jour des affichages de valeurs avec step dynamique
sampleSizeInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    sampleSizeValue.textContent = value.toLocaleString('fr-FR');

    // Ajuster le step dynamiquement pour une meilleure UX sur les grandes plages
    if (value >= 2000) {
        sampleSizeInput.step = 100;
    } else if (value >= 500) {
        sampleSizeInput.step = 50;
    } else {
        sampleSizeInput.step = 10;
    }
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

// Écouter les changements de configuration du graphique
chartTypeSelect.addEventListener('change', () => {
    updateVisualization();
});

showDataPointsCheckbox.addEventListener('change', () => {
    updateVisualization();
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

// Fonction pour mettre à jour la visualisation (sans régénérer les données)
function updateVisualization() {
    if (!currentData) return;

    const chartType = chartTypeSelect.value;
    const showDataPoints = showDataPointsCheckbox.checked;

    // Mettre à jour le titre
    chartTitle.textContent = chartTitles[chartType] || 'Box Plot';

    // Dessiner le graphique avec les statistiques pour les tooltips
    visualizations.draw(currentData, chartType, showDataPoints, currentStats);
}

// Fonction principale pour générer et visualiser
function generateAndVisualize() {
    const params = getParameters();

    if (!validateParameters(params)) {
        return;
    }

    // Générer les données
    currentData = dataGenerator.generate(params);

    // Calculer les statistiques
    currentStats = dataGenerator.getStats();

    // Mettre à jour les statistiques affichées
    updateStats(currentStats);

    // Mettre à jour la visualisation
    updateVisualization();
}

// Event listener pour le bouton de génération
generateBtn.addEventListener('click', generateAndVisualize);

// Fonction d'export
exportBtn.addEventListener('click', () => {
    const svg = document.getElementById('mainChart');
    const chartType = chartTypeSelect.value;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${chartType}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert('Graphique exporté avec succès !');
});

// Génération initiale au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    generateAndVisualize();
});
