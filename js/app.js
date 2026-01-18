// Initialisation
const dataGenerator1 = new DataGenerator();
const dataGenerator2 = new DataGenerator();
const visualizations = new Visualizations();

// Mode comparaison
let comparisonMode = false;

// Éléments du DOM - Échantillon 1
const sampleSize1Input = document.getElementById('sampleSize1');
const sampleSizeValue1 = document.getElementById('sampleSizeValue1');
const minValue1Input = document.getElementById('minValue1');
const maxValue1Input = document.getElementById('maxValue1');
const distribution1Select = document.getElementById('distribution1');
const mean1Input = document.getElementById('mean1');
const stdDev1Input = document.getElementById('stdDev1');
const outliers1Input = document.getElementById('outliers1');
const outliersValue1 = document.getElementById('outliersValue1');
const normalParams1 = document.getElementById('normalParams1');

// Éléments du DOM - Échantillon 2
const sampleSize2Input = document.getElementById('sampleSize2');
const sampleSizeValue2 = document.getElementById('sampleSizeValue2');
const minValue2Input = document.getElementById('minValue2');
const maxValue2Input = document.getElementById('maxValue2');
const distribution2Select = document.getElementById('distribution2');
const mean2Input = document.getElementById('mean2');
const stdDev2Input = document.getElementById('stdDev2');
const outliers2Input = document.getElementById('outliers2');
const outliersValue2 = document.getElementById('outliersValue2');
const normalParams2 = document.getElementById('normalParams2');

// Éléments du DOM - Boutons et sections
const generateBtn = document.getElementById('generateBtn');
const exportBtn = document.getElementById('exportBtn');
const addSampleBtn = document.getElementById('addSampleBtn');
const removeSampleBtn = document.getElementById('removeSampleBtn');
const addSampleContainer = document.getElementById('addSampleContainer');
const sample2Section = document.getElementById('sample2Section');

// Éléments du DOM - Configuration du graphique
const chartTypeSelect = document.getElementById('chartType');
const showDataPointsCheckbox = document.getElementById('showDataPoints');
const chartTitle1 = document.getElementById('chartTitle1');
const chartTitle2 = document.getElementById('chartTitle2');
const chart1Container = document.getElementById('chart1Container');
const chart2Container = document.getElementById('chart2Container');
const vizContainer = document.getElementById('vizContainer');

// Éléments de statistiques - Échantillon 1
const statElements1 = {
    n: document.getElementById('statN1'),
    mean: document.getElementById('statMean1'),
    median: document.getElementById('statMedian1'),
    stdDev: document.getElementById('statStdDev1'),
    q1: document.getElementById('statQ11'),
    q3: document.getElementById('statQ31'),
    min: document.getElementById('statMin1'),
    max: document.getElementById('statMax1')
};

// Éléments de statistiques - Échantillon 2
const statElements2 = {
    n: document.getElementById('statN2'),
    mean: document.getElementById('statMean2'),
    median: document.getElementById('statMedian2'),
    stdDev: document.getElementById('statStdDev2'),
    q1: document.getElementById('statQ12'),
    q3: document.getElementById('statQ32'),
    min: document.getElementById('statMin2'),
    max: document.getElementById('statMax2')
};

const statsSample2 = document.getElementById('statsSample2');

// Mapping des titres
const chartTitles = {
    boxplot: 'Box Plot',
    violinplot: 'Violin Plot',
    density: 'Density Plot'
};

// Stockage des données courantes
let currentData1 = null;
let currentStats1 = null;
let currentData2 = null;
let currentStats2 = null;

// Fonction pour configurer les sliders de taille d'échantillon
function setupSampleSizeSlider(input, display) {
    input.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        display.textContent = value.toLocaleString('fr-FR');

        if (value >= 2000) {
            input.step = 100;
        } else if (value >= 500) {
            input.step = 50;
        } else {
            input.step = 10;
        }
    });
}

// Configurer les sliders
setupSampleSizeSlider(sampleSize1Input, sampleSizeValue1);
setupSampleSizeSlider(sampleSize2Input, sampleSizeValue2);

// Configurer les sliders d'outliers
outliers1Input.addEventListener('input', (e) => {
    outliersValue1.textContent = e.target.value + '%';
});

outliers2Input.addEventListener('input', (e) => {
    outliersValue2.textContent = e.target.value + '%';
});

// Afficher/masquer les paramètres de distribution normale
function setupDistributionSelect(select, normalParams) {
    select.addEventListener('change', (e) => {
        if (e.target.value === 'normal' || e.target.value === 'bimodal') {
            normalParams.style.display = 'block';
        } else {
            normalParams.style.display = 'none';
        }
    });
}

setupDistributionSelect(distribution1Select, normalParams1);
setupDistributionSelect(distribution2Select, normalParams2);

// Gestion du mode comparaison
addSampleBtn.addEventListener('click', () => {
    comparisonMode = true;
    sample2Section.style.display = 'block';
    addSampleContainer.style.display = 'none';
    chart2Container.style.display = 'block';
    statsSample2.style.display = 'block';
    vizContainer.classList.add('comparison-mode');

    // Générer les données pour le second échantillon
    generateAndVisualize();
});

removeSampleBtn.addEventListener('click', () => {
    comparisonMode = false;
    sample2Section.style.display = 'none';
    addSampleContainer.style.display = 'block';
    chart2Container.style.display = 'none';
    statsSample2.style.display = 'none';
    vizContainer.classList.remove('comparison-mode');

    // Nettoyer les données du second échantillon
    currentData2 = null;
    currentStats2 = null;

    // Mettre à jour la visualisation
    updateVisualization();
});

// Écouter les changements de configuration du graphique
chartTypeSelect.addEventListener('change', () => {
    updateVisualization();
});

showDataPointsCheckbox.addEventListener('change', () => {
    updateVisualization();
});

// Fonction pour récupérer les paramètres d'un échantillon
function getParameters(sampleNumber) {
    if (sampleNumber === 1) {
        return {
            sampleSize: parseInt(sampleSize1Input.value),
            minValue: parseFloat(minValue1Input.value),
            maxValue: parseFloat(maxValue1Input.value),
            distribution: distribution1Select.value,
            mean: parseFloat(mean1Input.value),
            stdDev: parseFloat(stdDev1Input.value),
            outlierPercent: parseFloat(outliers1Input.value)
        };
    } else {
        return {
            sampleSize: parseInt(sampleSize2Input.value),
            minValue: parseFloat(minValue2Input.value),
            maxValue: parseFloat(maxValue2Input.value),
            distribution: distribution2Select.value,
            mean: parseFloat(mean2Input.value),
            stdDev: parseFloat(stdDev2Input.value),
            outlierPercent: parseFloat(outliers2Input.value)
        };
    }
}

// Fonction pour valider les paramètres
function validateParameters(params, sampleName) {
    if (params.minValue >= params.maxValue) {
        alert(`${sampleName}: La valeur minimale doit être inférieure à la valeur maximale`);
        return false;
    }

    if (params.distribution === 'normal' || params.distribution === 'bimodal') {
        if (params.stdDev <= 0) {
            alert(`${sampleName}: L'écart-type doit être supérieur à 0`);
            return false;
        }
        if (params.mean < params.minValue || params.mean > params.maxValue) {
            alert(`${sampleName}: La moyenne doit être comprise entre les valeurs min et max`);
            return false;
        }
    }

    return true;
}

// Fonction pour mettre à jour les statistiques
function updateStats(stats, statElements) {
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
    if (!currentData1) return;

    const chartType = chartTypeSelect.value;
    const showDataPoints = showDataPointsCheckbox.checked;
    const chartTypeName = chartTitles[chartType] || 'Box Plot';

    // Mettre à jour les titres
    chartTitle1.textContent = comparisonMode ? `${chartTypeName} - Échantillon 1` : chartTypeName;

    // Dessiner le graphique 1
    visualizations.draw(currentData1, chartType, showDataPoints, currentStats1, 'chart1');

    // Si mode comparaison, dessiner le graphique 2
    if (comparisonMode && currentData2) {
        chartTitle2.textContent = `${chartTypeName} - Échantillon 2`;
        visualizations.draw(currentData2, chartType, showDataPoints, currentStats2, 'chart2', '#e67e22');
    }
}

// Fonction principale pour générer et visualiser
function generateAndVisualize() {
    // Valider et générer l'échantillon 1
    const params1 = getParameters(1);
    if (!validateParameters(params1, 'Échantillon 1')) {
        return;
    }

    currentData1 = dataGenerator1.generate(params1);
    currentStats1 = dataGenerator1.getStats();
    updateStats(currentStats1, statElements1);

    // Si mode comparaison, valider et générer l'échantillon 2
    if (comparisonMode) {
        const params2 = getParameters(2);
        if (!validateParameters(params2, 'Échantillon 2')) {
            return;
        }

        currentData2 = dataGenerator2.generate(params2);
        currentStats2 = dataGenerator2.getStats();
        updateStats(currentStats2, statElements2);
    }

    // Mettre à jour la visualisation
    updateVisualization();
}

// Event listener pour le bouton de génération
generateBtn.addEventListener('click', generateAndVisualize);

// Fonction d'export
exportBtn.addEventListener('click', () => {
    const chartType = chartTypeSelect.value;

    // Exporter le graphique 1
    const svg1 = document.getElementById('chart1');
    const serializer = new XMLSerializer();
    const svgString1 = serializer.serializeToString(svg1);
    const blob1 = new Blob([svgString1], { type: 'image/svg+xml' });
    const url1 = URL.createObjectURL(blob1);

    const link1 = document.createElement('a');
    link1.href = url1;
    link1.download = comparisonMode ? `${chartType}_sample1.svg` : `${chartType}.svg`;
    document.body.appendChild(link1);
    link1.click();
    document.body.removeChild(link1);
    URL.revokeObjectURL(url1);

    // Si mode comparaison, exporter aussi le graphique 2
    if (comparisonMode) {
        const svg2 = document.getElementById('chart2');
        const svgString2 = serializer.serializeToString(svg2);
        const blob2 = new Blob([svgString2], { type: 'image/svg+xml' });
        const url2 = URL.createObjectURL(blob2);

        const link2 = document.createElement('a');
        link2.href = url2;
        link2.download = `${chartType}_sample2.svg`;
        document.body.appendChild(link2);
        link2.click();
        document.body.removeChild(link2);
        URL.revokeObjectURL(url2);
    }

    alert(comparisonMode ? 'Graphiques exportés avec succès !' : 'Graphique exporté avec succès !');
});

// Génération initiale au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    generateAndVisualize();
});
