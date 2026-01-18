class Visualizations {
    constructor() {
        this.width = 600;
        this.height = 400;
        this.margin = { top: 30, right: 30, bottom: 50, left: 60 };
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
        this.tooltip = null;
        this.stats = null;
    }

    clear() {
        d3.select('#mainChart').selectAll('*').remove();
    }

    // Initialiser le tooltip
    initTooltip() {
        this.tooltip = d3.select('#tooltip');
    }

    // Afficher le tooltip
    showTooltip(content, event) {
        if (!this.tooltip) this.initTooltip();

        this.tooltip
            .html(content)
            .classed('visible', true);

        this.positionTooltip(event);
    }

    // Positionner le tooltip
    positionTooltip(event) {
        if (!this.tooltip) return;

        const tooltipNode = this.tooltip.node();
        const tooltipRect = tooltipNode.getBoundingClientRect();
        const padding = 12;

        let left = event.clientX + padding;
        let top = event.clientY - tooltipRect.height / 2;

        // Éviter le débordement à droite
        if (left + tooltipRect.width > window.innerWidth - padding) {
            left = event.clientX - tooltipRect.width - padding;
        }

        // Éviter le débordement en haut et en bas
        if (top < padding) {
            top = padding;
        } else if (top + tooltipRect.height > window.innerHeight - padding) {
            top = window.innerHeight - tooltipRect.height - padding;
        }

        this.tooltip
            .style('left', left + 'px')
            .style('top', top + 'px');
    }

    // Masquer le tooltip
    hideTooltip() {
        if (!this.tooltip) this.initTooltip();
        this.tooltip.classed('visible', false);
    }

    // Générer le contenu HTML du tooltip pour les stats
    getStatsTooltipContent() {
        if (!this.stats) return '';

        return `
            <div class="tooltip-title">Statistiques de la distribution</div>
            <div class="tooltip-row">
                <span class="tooltip-label">Moyenne</span>
                <span class="tooltip-value">${this.stats.mean}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Médiane</span>
                <span class="tooltip-value">${this.stats.median}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Q1 (25%)</span>
                <span class="tooltip-value">${this.stats.q1}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Q3 (75%)</span>
                <span class="tooltip-value">${this.stats.q3}</span>
            </div>
        `;
    }

    // Générer le contenu HTML du tooltip pour un point de données
    getPointTooltipContent(index, value) {
        return `
            <div class="tooltip-title">Établissement ${index + 1}</div>
            <div class="tooltip-row">
                <span class="tooltip-label">Valeur</span>
                <span class="tooltip-value">${value.toFixed(2)}</span>
            </div>
        `;
    }

    // Méthode principale pour dessiner le graphique sélectionné
    draw(data, chartType, showDataPoints, stats) {
        this.clear();
        this.initTooltip();
        this.stats = stats;

        switch (chartType) {
            case 'boxplot':
                this.drawBoxPlotWithPoints(data, showDataPoints);
                break;
            case 'violinplot':
                this.drawViolinPlotWithPoints(data, showDataPoints);
                break;
            case 'density':
                this.drawDensityPlotWithPoints(data, showDataPoints);
                break;
            default:
                this.drawBoxPlotWithPoints(data, showDataPoints);
        }
    }

    // Dessiner les data points à gauche avec interactions
    drawDataPoints(g, data, y, leftBoundary, rightBoundary, outlierIndices = new Set()) {
        const MAX_VISUAL_POINTS = 2000;
        const totalPoints = data.length;
        const enableHoverForAll = totalPoints < MAX_VISUAL_POINTS;

        // Créer les données avec index
        const indexedData = data.map((value, index) => ({ value, index }));

        let displayData = indexedData;
        let isSampled = false;

        if (totalPoints > MAX_VISUAL_POINTS) {
            const indices = d3.shuffle(d3.range(totalPoints)).slice(0, MAX_VISUAL_POINTS);
            displayData = indices.map(i => indexedData[i]);
            isSampled = true;
        }

        const pointRadius = totalPoints > 5000 ? 1.5 : (totalPoints > 2000 ? 2 : 2.5);
        const pointOpacity = totalPoints > 5000 ? 0.3 : (totalPoints > 2000 ? 0.4 : 0.5);
        const jitterWidth = rightBoundary - leftBoundary - 10;
        const center = (leftBoundary + rightBoundary) / 2;

        const self = this;

        g.selectAll('circle.datapoint')
            .data(displayData)
            .join('circle')
            .attr('class', d => {
                const isOutlier = outlierIndices.has(d.index);
                const isInteractive = enableHoverForAll || isOutlier;
                return `datapoint${isInteractive ? ' interactive' : ''}${isOutlier ? ' outlier-point' : ''}`;
            })
            .attr('cx', () => center + (Math.random() - 0.5) * jitterWidth)
            .attr('cy', d => y(d.value))
            .attr('r', pointRadius)
            .attr('fill', d => outlierIndices.has(d.index) ? '#e74c3c' : '#e67e22')
            .attr('opacity', pointOpacity)
            .attr('stroke', 'none')
            .on('mouseenter', function(event, d) {
                const isOutlier = outlierIndices.has(d.index);
                if (enableHoverForAll || isOutlier) {
                    d3.select(this)
                        .attr('r', pointRadius * 1.8)
                        .attr('opacity', 1);
                    self.showTooltip(self.getPointTooltipContent(d.index, d.value), event);
                }
            })
            .on('mousemove', function(event, d) {
                const isOutlier = outlierIndices.has(d.index);
                if (enableHoverForAll || isOutlier) {
                    self.positionTooltip(event);
                }
            })
            .on('mouseleave', function(event, d) {
                const isOutlier = outlierIndices.has(d.index);
                if (enableHoverForAll || isOutlier) {
                    d3.select(this)
                        .attr('r', pointRadius)
                        .attr('opacity', pointOpacity);
                    self.hideTooltip();
                }
            });

        if (isSampled) {
            g.append('text')
                .attr('class', 'sample-info')
                .attr('x', center)
                .attr('y', -10)
                .attr('text-anchor', 'middle')
                .style('font-size', '9px')
                .style('fill', '#666')
                .text(`(${MAX_VISUAL_POINTS}/${totalPoints} points)`);
        }
    }

    // Ajouter une zone interactive pour les stats
    addStatsHoverZone(g, element) {
        const self = this;

        element
            .attr('class', (element.attr('class') || '') + ' distribution-area')
            .style('cursor', 'crosshair')
            .on('mouseenter', function(event) {
                self.showTooltip(self.getStatsTooltipContent(), event);
            })
            .on('mousemove', function(event) {
                self.positionTooltip(event);
            })
            .on('mouseleave', function() {
                self.hideTooltip();
            });
    }

    // Box Plot avec option data points
    drawBoxPlotWithPoints(data, showDataPoints) {
        const svg = d3.select('#mainChart')
            .attr('width', this.width)
            .attr('height', this.height);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        const sorted = data.slice().sort(d3.ascending);
        const q1 = d3.quantile(sorted, 0.25);
        const median = d3.quantile(sorted, 0.5);
        const q3 = d3.quantile(sorted, 0.75);
        const iqr = q3 - q1;
        const min = Math.max(d3.min(sorted), q1 - 1.5 * iqr);
        const max = Math.min(d3.max(sorted), q3 + 1.5 * iqr);

        const y = d3.scaleLinear()
            .domain([d3.min(data), d3.max(data)])
            .range([this.innerHeight, 0]);

        // Identifier les outliers avec leurs indices
        const outlierIndices = new Set();
        data.forEach((value, index) => {
            if (value < min || value > max) {
                outlierIndices.add(index);
            }
        });

        // Si data points activés, le box plot est à droite
        const boxCenter = showDataPoints ? this.innerWidth * 0.65 : this.innerWidth / 2;
        const boxWidth = 80;

        // Zone des data points à gauche
        if (showDataPoints) {
            const pointsLeftBoundary = 20;
            const pointsRightBoundary = this.innerWidth * 0.35;
            this.drawDataPoints(g, data, y, pointsLeftBoundary, pointsRightBoundary, outlierIndices);

            // Ligne de séparation
            g.append('line')
                .attr('x1', this.innerWidth * 0.45)
                .attr('x2', this.innerWidth * 0.45)
                .attr('y1', 0)
                .attr('y2', this.innerHeight)
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '5,5');
        }

        // Ligne verticale (whiskers)
        g.append('line')
            .attr('x1', boxCenter)
            .attr('x2', boxCenter)
            .attr('y1', y(min))
            .attr('y2', y(max))
            .attr('stroke', 'black')
            .attr('stroke-width', 1);

        // Boîte (avec hover pour les stats)
        const box = g.append('rect')
            .attr('x', boxCenter - boxWidth / 2)
            .attr('y', y(q3))
            .attr('width', boxWidth)
            .attr('height', y(q1) - y(q3))
            .attr('fill', '#4682b4')
            .attr('stroke', 'black')
            .attr('opacity', 0.7);

        this.addStatsHoverZone(g, box);

        // Médiane
        g.append('line')
            .attr('x1', boxCenter - boxWidth / 2)
            .attr('x2', boxCenter + boxWidth / 2)
            .attr('y1', y(median))
            .attr('y2', y(median))
            .attr('stroke', 'black')
            .attr('stroke-width', 2);

        // Whisker caps
        [min, max].forEach(value => {
            g.append('line')
                .attr('x1', boxCenter - boxWidth / 4)
                .attr('x2', boxCenter + boxWidth / 4)
                .attr('y1', y(value))
                .attr('y2', y(value))
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
        });

        // Outliers (seulement si data points désactivés)
        if (!showDataPoints) {
            const outliers = sorted.filter(value => value < min || value > max);
            const MAX_OUTLIERS_DISPLAY = 500;
            let displayOutliers = outliers;
            if (outliers.length > MAX_OUTLIERS_DISPLAY) {
                const indices = d3.shuffle(d3.range(outliers.length)).slice(0, MAX_OUTLIERS_DISPLAY);
                displayOutliers = indices.map(i => outliers[i]);
            }

            const self = this;
            const outlierRadius = outliers.length > 200 ? 2 : 3;
            const outlierOpacity = outliers.length > 200 ? 0.3 : 0.5;

            // Trouver les indices des outliers dans les données originales
            const outlierData = [];
            data.forEach((value, index) => {
                if (value < min || value > max) {
                    outlierData.push({ value, index });
                }
            });

            // Sampler si nécessaire
            let displayOutlierData = outlierData;
            if (outlierData.length > MAX_OUTLIERS_DISPLAY) {
                const indices = d3.shuffle(d3.range(outlierData.length)).slice(0, MAX_OUTLIERS_DISPLAY);
                displayOutlierData = indices.map(i => outlierData[i]);
            }

            displayOutlierData.forEach(d => {
                g.append('circle')
                    .attr('class', 'outlier interactive')
                    .attr('cx', boxCenter)
                    .attr('cy', y(d.value))
                    .attr('r', outlierRadius)
                    .attr('fill', 'red')
                    .attr('opacity', outlierOpacity)
                    .style('cursor', 'pointer')
                    .on('mouseenter', function(event) {
                        d3.select(this)
                            .attr('r', outlierRadius * 1.8)
                            .attr('opacity', 1);
                        self.showTooltip(self.getPointTooltipContent(d.index, d.value), event);
                    })
                    .on('mousemove', function(event) {
                        self.positionTooltip(event);
                    })
                    .on('mouseleave', function() {
                        d3.select(this)
                            .attr('r', outlierRadius)
                            .attr('opacity', outlierOpacity);
                        self.hideTooltip();
                    });
            });
        }

        // Axe Y
        g.append('g')
            .call(d3.axisLeft(y).ticks(8));

        // Label Y
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Valeur');
    }

    // Violin Plot avec option data points (moitié droite si points activés)
    drawViolinPlotWithPoints(data, showDataPoints) {
        const svg = d3.select('#mainChart')
            .attr('width', this.width)
            .attr('height', this.height);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        const y = d3.scaleLinear()
            .domain(d3.extent(data))
            .range([this.innerHeight, 0]);

        // Calculer les outliers pour le violin plot (même règle que box plot)
        const sorted = data.slice().sort(d3.ascending);
        const q1 = d3.quantile(sorted, 0.25);
        const q3 = d3.quantile(sorted, 0.75);
        const iqr = q3 - q1;
        const minWhisker = Math.max(d3.min(sorted), q1 - 1.5 * iqr);
        const maxWhisker = Math.min(d3.max(sorted), q3 + 1.5 * iqr);

        const outlierIndices = new Set();
        data.forEach((value, index) => {
            if (value < minWhisker || value > maxWhisker) {
                outlierIndices.add(index);
            }
        });

        // Calcul de la densité
        const bins = d3.bin()
            .domain(y.domain())
            .thresholds(40)(data);

        const maxBinLength = d3.max(bins, d => d.length);

        // Position du violin selon si data points ou non
        const violinCenter = showDataPoints ? this.innerWidth * 0.65 : this.innerWidth / 2;
        const violinMaxWidth = showDataPoints ? this.innerWidth * 0.3 : this.innerWidth * 0.4;

        const x = d3.scaleLinear()
            .domain([0, maxBinLength])
            .range([0, violinMaxWidth]);

        // Zone des data points à gauche
        if (showDataPoints) {
            const pointsLeftBoundary = 20;
            const pointsRightBoundary = this.innerWidth * 0.35;
            this.drawDataPoints(g, data, y, pointsLeftBoundary, pointsRightBoundary, outlierIndices);

            // Ligne de séparation
            g.append('line')
                .attr('x1', this.innerWidth * 0.45)
                .attr('x2', this.innerWidth * 0.45)
                .attr('y1', 0)
                .attr('y2', this.innerHeight)
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '5,5');

            // Demi-violin (seulement à droite)
            const halfArea = d3.area()
                .curve(d3.curveCatmullRom)
                .y(d => y((d.x0 + d.x1) / 2))
                .x0(violinCenter)
                .x1(d => violinCenter + x(d.length));

            const violinPath = g.append('path')
                .datum(bins)
                .attr('d', halfArea)
                .attr('fill', '#4682b4')
                .attr('opacity', 0.7)
                .attr('stroke', 'black')
                .attr('stroke-width', 1);

            this.addStatsHoverZone(g, violinPath);

            // Ligne centrale du demi-violin
            g.append('line')
                .attr('x1', violinCenter)
                .attr('x2', violinCenter)
                .attr('y1', y(d3.min(data)))
                .attr('y2', y(d3.max(data)))
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
        } else {
            // Violin complet (symétrique)
            const area = d3.area()
                .curve(d3.curveCatmullRom)
                .y(d => y((d.x0 + d.x1) / 2))
                .x0(d => violinCenter - x(d.length))
                .x1(d => violinCenter + x(d.length));

            const violinPath = g.append('path')
                .datum(bins)
                .attr('d', area)
                .attr('fill', '#4682b4')
                .attr('opacity', 0.7)
                .attr('stroke', 'black')
                .attr('stroke-width', 1);

            this.addStatsHoverZone(g, violinPath);
        }

        // Axe Y
        g.append('g')
            .call(d3.axisLeft(y).ticks(8));

        // Label Y
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Valeur');
    }

    // Density Plot avec option data points
    drawDensityPlotWithPoints(data, showDataPoints) {
        const svg = d3.select('#mainChart')
            .attr('width', this.width)
            .attr('height', this.height);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Pour density plot, on utilise une échelle verticale pour les valeurs
        const y = d3.scaleLinear()
            .domain(d3.extent(data))
            .range([this.innerHeight, 0]);

        // Calculer les outliers (même règle que box plot)
        const sorted = data.slice().sort(d3.ascending);
        const q1 = d3.quantile(sorted, 0.25);
        const q3 = d3.quantile(sorted, 0.75);
        const iqr = q3 - q1;
        const minWhisker = Math.max(d3.min(sorted), q1 - 1.5 * iqr);
        const maxWhisker = Math.min(d3.max(sorted), q3 + 1.5 * iqr);

        const outlierIndices = new Set();
        data.forEach((value, index) => {
            if (value < minWhisker || value > maxWhisker) {
                outlierIndices.add(index);
            }
        });

        // Zone des data points à gauche
        if (showDataPoints) {
            const pointsLeftBoundary = 20;
            const pointsRightBoundary = this.innerWidth * 0.35;
            this.drawDataPoints(g, data, y, pointsLeftBoundary, pointsRightBoundary, outlierIndices);

            // Ligne de séparation
            g.append('line')
                .attr('x1', this.innerWidth * 0.45)
                .attr('x2', this.innerWidth * 0.45)
                .attr('y1', 0)
                .attr('y2', this.innerHeight)
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '5,5');
        }

        // Calculer la densité
        const bandwidth = (d3.max(data) - d3.min(data)) / 20;
        const densityData = this.kernelDensityEstimator(
            this.kernelEpanechnikov(bandwidth),
            y.ticks(50),
            data
        );

        // La densité sera affichée horizontalement (vers la droite)
        const densityCenter = showDataPoints ? this.innerWidth * 0.55 : this.innerWidth * 0.3;
        const densityMaxWidth = showDataPoints ? this.innerWidth * 0.4 : this.innerWidth * 0.6;

        const xDensity = d3.scaleLinear()
            .domain([0, d3.max(densityData, d => d[1])])
            .range([0, densityMaxWidth]);

        // Courbe de densité (affichée horizontalement)
        const area = d3.area()
            .curve(d3.curveBasis)
            .y(d => y(d[0]))
            .x0(densityCenter)
            .x1(d => densityCenter + xDensity(d[1]));

        const densityPath = g.append('path')
            .datum(densityData)
            .attr('d', area)
            .attr('fill', '#4682b4')
            .attr('opacity', 0.5);

        this.addStatsHoverZone(g, densityPath);

        // Ligne de contour
        const line = d3.line()
            .curve(d3.curveBasis)
            .y(d => y(d[0]))
            .x(d => densityCenter + xDensity(d[1]));

        g.append('path')
            .datum(densityData)
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', '#4682b4')
            .attr('stroke-width', 2);

        // Ligne de base
        g.append('line')
            .attr('x1', densityCenter)
            .attr('x2', densityCenter)
            .attr('y1', 0)
            .attr('y2', this.innerHeight)
            .attr('stroke', 'black')
            .attr('stroke-width', 1);

        // Axe Y
        g.append('g')
            .call(d3.axisLeft(y).ticks(8));

        // Label Y
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Valeur');

        // Label densité
        g.append('text')
            .attr('x', densityCenter + densityMaxWidth / 2)
            .attr('y', this.innerHeight + 35)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Densité');
    }

    // Kernel Density Estimation helpers
    kernelDensityEstimator(kernel, X, data) {
        return X.map(x => [x, d3.mean(data, v => kernel(x - v))]);
    }

    kernelEpanechnikov(bandwidth) {
        return x => Math.abs(x /= bandwidth) <= 1 ? 0.75 * (1 - x * x) / bandwidth : 0;
    }
}
