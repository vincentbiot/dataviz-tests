/**
 * Application principale pour la visualisation de réponses aux questionnaires
 */
class SurveyApp {
    constructor() {
        // État de l'application
        this.comparisonMode = false;
        this.dataGenerator1 = null;
        this.dataGenerator2 = null;
        this.currentData1 = null;
        this.currentData2 = null;
        this.currentStats1 = null;
        this.currentStats2 = null;

        // Visualisations - hauteur de base, sera ajustée dynamiquement
        this.baseHeight = 400;
        this.visualizations = new SurveyVisualizations('#surveyChart', 700, this.baseHeight);

        // Mapping des titres de graphiques
        this.chartTitles = {
            'bar-horizontal': 'Diagramme en barres horizontales',
            'bar-vertical': 'Diagramme en barres verticales'
        };

        // Initialisation
        this.initEventListeners();
        this.updateGenerationModeVisibility(1);
        this.updateOptionLabels(); // Générer les champs de libellés initiaux
    }

    /**
     * Initialise tous les event listeners
     */
    initEventListeners() {
        // Échantillon 1 - Sliders avec affichage de valeur
        this.initSlider('numRespondents1', 'numRespondentsValue1', null);
        this.initSlider('numOptions1', 'numOptionsValue1', () => {
            this.updateOptionLabels();
            this.updateResponseSliders(1);
            // Mettre à jour aussi les sliders de l'échantillon 2 si en mode comparaison
            if (this.comparisonMode) {
                this.updateResponseSliders(2);
            }
        });

        // Mode de réponse
        document.getElementById('responseMode1').addEventListener('change', (e) => {
            this.toggleMultipleParams(1, e.target.value === 'multiple');
        });

        document.getElementById('avgResponsesPerPerson1')?.addEventListener('input', (e) => {
            document.getElementById('avgResponsesValue1').textContent = e.target.value;
        });

        // Mode de génération
        document.querySelectorAll('input[name="generationMode1"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateGenerationModeVisibility(1);
            });
        });

        // Nombre d'options change => régénérer les sliders
        document.getElementById('numOptions1').addEventListener('change', () => {
            this.updateResponseSliders(1);
        });

        // Échantillon 2 - Seulement nombre de répondants (les autres params viennent de l'échantillon 1)
        this.initSlider('numRespondents2', 'numRespondentsValue2', null);

        // Mode de génération pour échantillon 2
        document.querySelectorAll('input[name="generationMode2"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateGenerationModeVisibility(2);
            });
        });

        // Upload de fichiers
        document.getElementById('fileUpload1').addEventListener('change', (e) => {
            this.handleFileUpload(e, 1);
        });

        document.getElementById('fileUpload2').addEventListener('change', (e) => {
            this.handleFileUpload(e, 2);
        });

        // Boutons principaux
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateAndVisualize();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportChart();
        });

        // Mode comparaison
        document.getElementById('addSurveyBtn').addEventListener('click', () => {
            this.toggleComparisonMode(true);
        });

        document.getElementById('removeSurveyBtn').addEventListener('click', () => {
            this.toggleComparisonMode(false);
        });

        // Options de visualisation
        document.getElementById('showPercentages').addEventListener('change', () => {
            this.updateVisualization();
        });

        document.getElementById('showCounts').addEventListener('change', () => {
            this.updateVisualization();
        });

        document.getElementById('sortDescending').addEventListener('change', () => {
            this.updateVisualization();
        });

        document.getElementById('labelDisplayMode').addEventListener('change', () => {
            this.updateVisualization();
        });
    }

    /**
     * Initialise un slider avec affichage de valeur
     */
    initSlider(sliderId, displayId, callback) {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(displayId);

        if (slider && display) {
            slider.addEventListener('input', (e) => {
                display.textContent = e.target.value;
                if (callback) callback();
            });
        }
    }

    /**
     * Toggle les paramètres pour réponses multiples
     */
    toggleMultipleParams(questionnaireNum, show) {
        const paramsDiv = document.getElementById(`multipleParams${questionnaireNum}`);
        if (paramsDiv) {
            paramsDiv.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Met à jour la visibilité de la configuration manuelle
     */
    updateGenerationModeVisibility(questionnaireNum) {
        const generationMode = document.querySelector(`input[name="generationMode${questionnaireNum}"]:checked`)?.value;
        const manualConfig = document.getElementById(`manualConfig${questionnaireNum}`);

        if (manualConfig) {
            manualConfig.style.display = generationMode === 'manual' ? 'block' : 'none';

            if (generationMode === 'manual') {
                this.updateResponseSliders(questionnaireNum);
            }
        }
    }

    /**
     * Met à jour les sliders de configuration manuelle
     */
    updateResponseSliders(questionnaireNum) {
        // Toujours utiliser numOptions de l'échantillon 1
        const numOptions = parseInt(document.getElementById('numOptions1').value);
        const numRespondents = parseInt(document.getElementById(`numRespondents${questionnaireNum}`).value);
        const container = document.getElementById(`responseSliders${questionnaireNum}`);

        if (!container) return;

        // Récupérer les libellés depuis l'échantillon 1
        const optionLabels = this.getOptionLabels();

        // Effacer les sliders existants
        container.innerHTML = '';

        // Créer les sliders
        for (let i = 0; i < numOptions; i++) {
            const label = optionLabels[i] || String.fromCharCode(65 + i);
            const sliderId = `responseSlider${questionnaireNum}_${i}`;
            const valueId = `responseValue${questionnaireNum}_${i}`;

            const sliderItem = document.createElement('div');
            sliderItem.className = 'response-slider-item';

            sliderItem.innerHTML = `
                <div class="response-slider-label">
                    <span class="slider-label-text">${label}</span>
                    <span class="slider-value" id="${valueId}">0</span>
                </div>
                <input type="range" id="${sliderId}" min="0" max="${numRespondents * 2}" value="0" step="1" />
            `;

            container.appendChild(sliderItem);

            // Ajouter event listener
            const slider = document.getElementById(sliderId);
            slider.addEventListener('input', () => {
                document.getElementById(valueId).textContent = slider.value;
                this.updateTotalDisplay(questionnaireNum);
            });
        }

        // Mettre à jour l'affichage du total
        this.updateTotalDisplay(questionnaireNum);
    }

    /**
     * Met à jour l'affichage du total des réponses
     */
    updateTotalDisplay(questionnaireNum) {
        // Toujours utiliser numOptions de l'échantillon 1
        const numOptions = parseInt(document.getElementById('numOptions1').value);
        const numRespondents = parseInt(document.getElementById(`numRespondents${questionnaireNum}`).value);

        let total = 0;
        for (let i = 0; i < numOptions; i++) {
            const slider = document.getElementById(`responseSlider${questionnaireNum}_${i}`);
            if (slider) {
                total += parseInt(slider.value);
            }
        }

        const totalDisplay = document.getElementById(`totalResponses${questionnaireNum}`);
        const targetDisplay = document.getElementById(`targetTotal${questionnaireNum}`);

        if (totalDisplay) {
            totalDisplay.textContent = total;

            // Colorer en rouge si invalide (utiliser responseMode de l'échantillon 1)
            const responseMode = document.getElementById('responseMode1').value;
            if (responseMode === 'single' && total !== numRespondents) {
                totalDisplay.style.color = '#e74c3c';
            } else if (responseMode === 'multiple' && total < numRespondents) {
                totalDisplay.style.color = '#e74c3c';
            } else {
                totalDisplay.style.color = 'var(--btn-primary-bg)';
            }
        }

        if (targetDisplay) {
            targetDisplay.textContent = `(Objectif: ${numRespondents})`;
        }
    }

    /**
     * Gère l'upload de fichiers
     */
    handleFileUpload(event, questionnaireNum) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;
                let data;

                if (file.name.endsWith('.csv')) {
                    data = SurveyDataGenerator.parseCSV(content);
                } else if (file.name.endsWith('.json')) {
                    data = SurveyDataGenerator.parseJSON(content);
                } else {
                    throw new Error('Format de fichier non supporté. Utilisez .csv ou .json');
                }

                // Mettre à jour l'interface avec les données importées
                this.applyUploadedData(data, questionnaireNum);

                // Afficher le nom du fichier
                document.getElementById(`fileName${questionnaireNum}`).textContent = file.name;

            } catch (error) {
                alert('Erreur lors de l\'import : ' + error.message);
                event.target.value = '';
            }
        };

        reader.readAsText(file);
    }

    /**
     * Applique les données uploadées à l'interface
     */
    applyUploadedData(data, questionnaireNum) {
        const labels = Object.keys(data);
        const values = Object.values(data);

        // Pour l'échantillon 1 : mettre à jour les options et libellés
        if (questionnaireNum === 1) {
            // Mettre à jour le nombre d'options
            document.getElementById('numOptions1').value = labels.length;
            document.getElementById('numOptionsValue1').textContent = labels.length;

            // Mettre à jour les champs de libellés
            this.updateOptionLabels();

            setTimeout(() => {
                labels.forEach((label, index) => {
                    const labelInput = document.getElementById(`optionLabel1_${index}`);
                    if (labelInput) labelInput.value = label;
                });
            }, 50);
        }

        // Passer en mode manuel
        const manualRadio = document.querySelector(`input[name="generationMode${questionnaireNum}"][value="manual"]`);
        if (manualRadio) {
            manualRadio.checked = true;
            this.updateGenerationModeVisibility(questionnaireNum);
        }

        // Attendre que les sliders soient générés
        setTimeout(() => {
            // Remplir les sliders avec les valeurs
            labels.forEach((label, index) => {
                const slider = document.getElementById(`responseSlider${questionnaireNum}_${index}`);
                const valueDisplay = document.getElementById(`responseValue${questionnaireNum}_${index}`);

                if (slider) slider.value = values[index];
                if (valueDisplay) valueDisplay.textContent = values[index];
            });

            this.updateTotalDisplay(questionnaireNum);
        }, 100);
    }

    /**
     * Active/désactive le mode comparaison
     */
    toggleComparisonMode(enable) {
        this.comparisonMode = enable;

        const survey2Section = document.getElementById('survey2Section');
        const addSurveyContainer = document.getElementById('addSurveyContainer');
        const statsSurvey2 = document.getElementById('statsSurvey2');
        const chartLegend = document.getElementById('chartLegend');

        if (enable) {
            survey2Section.style.display = 'block';
            addSurveyContainer.style.display = 'none';
            statsSurvey2.style.display = 'block';
            chartLegend.style.display = 'flex';

            // Initialiser les sliders de l'échantillon 2 avec les mêmes labels que l'échantillon 1
            this.updateGenerationModeVisibility(2);
        } else {
            survey2Section.style.display = 'none';
            addSurveyContainer.style.display = 'block';
            statsSurvey2.style.display = 'none';
            chartLegend.style.display = 'none';

            // Régénérer avec un seul échantillon
            if (this.currentData1) {
                this.updateVisualization();
            }
        }
    }

    /**
     * Génère les données et met à jour la visualisation
     */
    generateAndVisualize() {
        try {
            // Générer questionnaire 1
            const params1 = this.getQuestionnaireParams(1);
            this.dataGenerator1 = new SurveyDataGenerator(params1);
            this.currentData1 = this.dataGenerator1.generate();
            this.currentStats1 = this.dataGenerator1.getStats();

            // Mettre à jour les statistiques
            this.updateStats(1, this.currentStats1);

            // Générer questionnaire 2 si en mode comparaison
            if (this.comparisonMode) {
                const params2 = this.getQuestionnaireParams(2);
                this.dataGenerator2 = new SurveyDataGenerator(params2);
                this.currentData2 = this.dataGenerator2.generate();
                this.currentStats2 = this.dataGenerator2.getStats();

                // Mettre à jour les statistiques
                this.updateStats(2, this.currentStats2);
            }

            // Dessiner la visualisation
            this.updateVisualization();

        } catch (error) {
            alert('Erreur lors de la génération : ' + error.message);
            console.error(error);
        }
    }

    /**
     * Récupère les paramètres d'un questionnaire
     * L'échantillon 2 utilise les mêmes questions/options que l'échantillon 1
     */
    getQuestionnaireParams(questionnaireNum) {
        const numRespondents = parseInt(document.getElementById(`numRespondents${questionnaireNum}`).value);

        // L'échantillon 2 utilise les mêmes paramètres de questions que l'échantillon 1
        const numOptions = parseInt(document.getElementById('numOptions1').value);
        const responseMode = document.getElementById('responseMode1').value;
        const generationMode = document.querySelector(`input[name="generationMode${questionnaireNum}"]:checked`)?.value || 'auto';

        const params = {
            numRespondents,
            numOptions,
            responseMode,
            generationMode
        };

        // Paramètres spécifiques au mode multiple (toujours depuis échantillon 1)
        if (responseMode === 'multiple') {
            const avgResponsesInput = document.getElementById('avgResponsesPerPerson1');
            if (avgResponsesInput) {
                params.avgResponsesPerPerson = parseFloat(avgResponsesInput.value);
            }
        }

        // Récupérer les libellés depuis l'échantillon 1
        const optionLabels = this.getOptionLabels();
        if (optionLabels.length > 0) {
            params.optionLabels = optionLabels;
        }

        // Paramètres spécifiques au mode manuel
        if (generationMode === 'manual') {
            const manualValues = [];

            for (let i = 0; i < numOptions; i++) {
                const slider = document.getElementById(`responseSlider${questionnaireNum}_${i}`);
                if (slider) {
                    manualValues.push(parseInt(slider.value));
                }
            }

            // Valider les données manuelles
            const validation = SurveyDataGenerator.validateManualData(manualValues, numRespondents, responseMode);
            if (validation !== true) {
                throw new Error(validation);
            }

            params.manualValues = manualValues;
        }

        return params;
    }

    /**
     * Récupère les libellés des options depuis l'échantillon 1
     */
    getOptionLabels() {
        const numOptions = parseInt(document.getElementById('numOptions1').value);
        const labels = [];

        for (let i = 0; i < numOptions; i++) {
            const labelInput = document.getElementById(`optionLabel1_${i}`);
            if (labelInput && labelInput.value.trim()) {
                labels.push(labelInput.value.trim());
            } else {
                labels.push(String.fromCharCode(65 + i)); // A, B, C...
            }
        }

        return labels;
    }

    /**
     * Met à jour les champs de libellés des options
     */
    updateOptionLabels() {
        const numOptions = parseInt(document.getElementById('numOptions1').value);
        const container = document.getElementById('optionLabelsContainer');

        if (!container) return;

        // Sauvegarder les valeurs existantes
        const existingValues = [];
        for (let i = 0; i < 20; i++) {
            const input = document.getElementById(`optionLabel1_${i}`);
            if (input) {
                existingValues[i] = input.value;
            }
        }

        // Effacer et régénérer
        container.innerHTML = '';

        for (let i = 0; i < numOptions; i++) {
            const letter = String.fromCharCode(65 + i);
            const item = document.createElement('div');
            item.className = 'option-label-item';

            item.innerHTML = `
                <span class="option-label-letter">${letter}</span>
                <input type="text"
                       id="optionLabel1_${i}"
                       class="option-label-input"
                       placeholder="Réponse ${letter}"
                       value="${existingValues[i] || ''}">
            `;

            container.appendChild(item);
        }
    }

    /**
     * Ajuste la hauteur du SVG selon le nombre d'options (pour barres horizontales)
     */
    adjustChartHeight(numOptions, chartType) {
        let height = this.baseHeight;

        // Pour les barres horizontales, augmenter la hauteur si beaucoup d'options
        if (chartType === 'bar-horizontal' && numOptions > 10) {
            height = Math.max(this.baseHeight, numOptions * 35);
        }

        this.visualizations.height = height;
        this.visualizations.innerHeight = height - this.visualizations.margin.top - this.visualizations.margin.bottom;
    }

    /**
     * Met à jour la visualisation (sans régénérer les données)
     */
    updateVisualization() {
        if (!this.currentData1) {
            return;
        }

        const chartType = document.getElementById('chartType').value;
        const showPercentages = document.getElementById('showPercentages').checked;
        const showCounts = document.getElementById('showCounts').checked;
        const sortDescending = document.getElementById('sortDescending').checked;
        const labelDisplayMode = document.getElementById('labelDisplayMode').value;

        // Préparer les échantillons
        const samples = [];

        const data1Array = this.dataGenerator1.getDataArray(sortDescending);
        samples.push({
            data: data1Array,
            name: 'Échantillon 1',
            color: '#3A9484'
        });

        if (this.comparisonMode && this.currentData2) {
            const data2Array = this.dataGenerator2.getDataArray(sortDescending);
            samples.push({
                data: data2Array,
                name: 'Échantillon 2',
                color: '#D276CA'
            });
        }

        // Ajuster la hauteur selon le nombre d'options
        const numOptions = data1Array.length;
        this.adjustChartHeight(numOptions, chartType);

        // Dessiner
        this.visualizations.draw(samples, chartType, {
            showPercentages,
            showCounts,
            sortDescending,
            labelDisplayMode
        });

        // Mettre à jour le titre
        document.getElementById('chartTitle').textContent = this.chartTitles[chartType];
    }

    /**
     * Met à jour les statistiques affichées
     */
    updateStats(questionnaireNum, stats) {
        document.getElementById(`statRespondents${questionnaireNum}`).textContent = stats.numRespondents;
        document.getElementById(`statTotalResponses${questionnaireNum}`).textContent = stats.totalResponses;
        document.getElementById(`statMode${questionnaireNum}`).textContent = stats.responseModeLabel;
        document.getElementById(`statDominant${questionnaireNum}`).textContent =
            `${stats.dominantResponse} (${stats.dominantCount})`;
    }

    /**
     * Exporte le graphique en SVG
     */
    exportChart() {
        const svgElement = document.getElementById('surveyChart');
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);

        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'questionnaire-chart.svg';
        link.click();

        URL.revokeObjectURL(url);
    }
}

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const app = new SurveyApp();
});
