class Visualizations {
    constructor() {
        this.width = 700;
        this.height = 400;
        this.margin = { top: 30, right: 30, bottom: 50, left: 60 };
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
        this.tooltip = null;
        this.colors = {
            sample1: '#3A9484',
            sample2: '#D276CA'
        };
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

        if (left + tooltipRect.width > window.innerWidth - padding) {
            left = event.clientX - tooltipRect.width - padding;
        }

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
    getStatsTooltipContent(stats, sampleName) {
        if (!stats) return '';

        return `
            <div class="tooltip-title">${sampleName}</div>
            <div class="tooltip-row">
                <span class="tooltip-label">Moyenne</span>
                <span class="tooltip-value">${stats.mean}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Médiane</span>
                <span class="tooltip-value">${stats.median}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Q1 (25%)</span>
                <span class="tooltip-value">${stats.q1}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Q3 (75%)</span>
                <span class="tooltip-value">${stats.q3}</span>
            </div>
        `;
    }

    // Générer le contenu HTML du tooltip pour un point de données
    getPointTooltipContent(index, value, sampleName) {
        return `
            <div class="tooltip-title">${sampleName} - Point ${index + 1}</div>
            <div class="tooltip-row">
                <span class="tooltip-label">Valeur</span>
                <span class="tooltip-value">${value.toFixed(2)}</span>
            </div>
        `;
    }

    // Méthode principale pour dessiner
    draw(samples, chartType, showDataPoints = false, establishment = null, showOutliers = true) {
        this.clear();
        this.initTooltip();

        const isComparison = samples.length === 2;

        switch (chartType) {
            case 'boxplot':
                this.drawBoxPlot(samples, showDataPoints, isComparison, establishment, showOutliers);
                break;
            case 'violinplot':
                this.drawViolinPlot(samples, showDataPoints, isComparison, establishment, showOutliers);
                break;
            case 'density':
                this.drawDensityPlot(samples, showDataPoints, isComparison, establishment, showOutliers);
                break;
            default:
                this.drawBoxPlot(samples, showDataPoints, isComparison, establishment, showOutliers);
        }
    }

    // Calculer l'échelle Y commune pour tous les échantillons
    getCommonYScale(samples, showOutliers = true) {
        let allMin = Infinity;
        let allMax = -Infinity;

        samples.forEach(sample => {
            if (showOutliers) {
                // Inclure tous les points
                const min = d3.min(sample.data);
                const max = d3.max(sample.data);
                if (min < allMin) allMin = min;
                if (max > allMax) allMax = max;
            } else {
                // Exclure les outliers - utiliser les bornes IQR
                const bounds = this.getOutlierBounds(sample.data);
                if (bounds.min < allMin) allMin = bounds.min;
                if (bounds.max > allMax) allMax = bounds.max;
            }
        });

        return d3.scaleLinear()
            .domain([allMin, allMax])
            .range([this.innerHeight, 0]);
    }

    // Calculer les statistiques pour les outliers
    getOutlierBounds(data) {
        const sorted = data.slice().sort(d3.ascending);
        const q1 = d3.quantile(sorted, 0.25);
        const q3 = d3.quantile(sorted, 0.75);
        const iqr = q3 - q1;
        return {
            min: Math.max(d3.min(sorted), q1 - 1.5 * iqr),
            max: Math.min(d3.max(sorted), q3 + 1.5 * iqr),
            q1,
            q3,
            median: d3.quantile(sorted, 0.5)
        };
    }

    // Dessiner la ligne de référence de l'établissement
    drawEstablishmentLine(g, y, establishment) {
        if (!establishment || establishment.value === null) {
            return; // Pas de ligne si pas de valeur
        }

        const yPos = y(establishment.value);

        // Vérifier que la valeur est dans le domaine
        const [yMin, yMax] = y.domain();
        if (establishment.value < yMin || establishment.value > yMax) {
            console.warn(`Établissement value ${establishment.value} is outside range [${yMin}, ${yMax}]`);
            return; // Ne pas afficher si hors limites
        }

        // Ligne horizontale en pointillés
        g.append('line')
            .attr('class', 'establishment-line')
            .attr('x1', 0)
            .attr('x2', this.innerWidth)
            .attr('y1', yPos)
            .attr('y2', yPos)
            .attr('stroke', '#233546') // Couleur text-title du design kit
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '8,4')
            .attr('opacity', 0.8);

        // Label avec le nom de l'établissement
        g.append('text')
            .attr('class', 'establishment-label')
            .attr('x', this.innerWidth - 5)
            .attr('y', yPos - 6)
            .attr('text-anchor', 'end')
            .attr('font-size', '12px')
            .attr('font-weight', '600')
            .attr('fill', '#233546')
            .text(`${establishment.name}: ${establishment.value.toFixed(2)}`);

        // Petit marqueur circulaire sur l'axe Y
        g.append('circle')
            .attr('class', 'establishment-marker')
            .attr('cx', -10)
            .attr('cy', yPos)
            .attr('r', 4)
            .attr('fill', '#233546')
            .attr('opacity', 0.8);
    }

    // Box Plot
    drawBoxPlot(samples, showDataPoints, isComparison, establishment = null, showOutliers = true) {
        const svg = d3.select('#mainChart')
            .attr('width', this.width)
            .attr('height', this.height);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        const y = this.getCommonYScale(samples, showOutliers);
        const self = this;

        // Définir les positions des box plots
        const boxWidth = isComparison ? 70 : 80;
        let positions;

        if (isComparison) {
            if (showDataPoints) {
                positions = [this.innerWidth * 0.35, this.innerWidth * 0.75];
            } else {
                positions = [this.innerWidth * 0.33, this.innerWidth * 0.67];
            }
        } else {
            positions = [showDataPoints ? this.innerWidth * 0.65 : this.innerWidth / 2];
        }

        // Zone des data points à gauche (si activée)
        if (showDataPoints) {
            const pointsLeftBoundary = 10;
            const pointsRightBoundary = isComparison ? this.innerWidth * 0.18 : this.innerWidth * 0.35;

            samples.forEach((sample, idx) => {
                const bounds = this.getOutlierBounds(sample.data);
                const outlierIndices = new Set();
                sample.data.forEach((value, index) => {
                    if (value < bounds.min || value > bounds.max) {
                        outlierIndices.add(index);
                    }
                });

                const leftBound = isComparison ?
                    (idx === 0 ? pointsLeftBoundary : this.innerWidth * 0.52) :
                    pointsLeftBoundary;
                const rightBound = isComparison ?
                    (idx === 0 ? pointsRightBoundary : this.innerWidth * 0.68) :
                    pointsRightBoundary;

                this.drawDataPoints(g, sample.data, y, leftBound, rightBound, outlierIndices, sample.color, sample.name, showOutliers);
            });

            // Ligne de séparation
            const separatorX = isComparison ? this.innerWidth * 0.22 : this.innerWidth * 0.45;
            g.append('line')
                .attr('x1', separatorX)
                .attr('x2', separatorX)
                .attr('y1', 0)
                .attr('y2', this.innerHeight)
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '5,5');

            if (isComparison) {
                g.append('line')
                    .attr('x1', this.innerWidth * 0.72)
                    .attr('x2', this.innerWidth * 0.72)
                    .attr('y1', 0)
                    .attr('y2', this.innerHeight)
                    .attr('stroke', '#ddd')
                    .attr('stroke-width', 1)
                    .attr('stroke-dasharray', '5,5');
            }
        }

        // Dessiner chaque box plot
        samples.forEach((sample, idx) => {
            const bounds = this.getOutlierBounds(sample.data);
            const boxCenter = positions[idx];

            // Ligne verticale (whiskers)
            g.append('line')
                .attr('x1', boxCenter)
                .attr('x2', boxCenter)
                .attr('y1', y(bounds.min))
                .attr('y2', y(bounds.max))
                .attr('stroke', 'black')
                .attr('stroke-width', 1);

            // Boîte
            const box = g.append('rect')
                .attr('x', boxCenter - boxWidth / 2)
                .attr('y', y(bounds.q3))
                .attr('width', boxWidth)
                .attr('height', y(bounds.q1) - y(bounds.q3))
                .attr('fill', sample.color)
                .attr('stroke', 'black')
                .attr('opacity', 0.7)
                .attr('class', 'distribution-area')
                .style('cursor', 'crosshair');

            box.on('mouseenter', function(event) {
                    self.showTooltip(self.getStatsTooltipContent(sample.stats, sample.name), event);
                })
                .on('mousemove', function(event) {
                    self.positionTooltip(event);
                })
                .on('mouseleave', function() {
                    self.hideTooltip();
                });

            // Médiane
            g.append('line')
                .attr('x1', boxCenter - boxWidth / 2)
                .attr('x2', boxCenter + boxWidth / 2)
                .attr('y1', y(bounds.median))
                .attr('y2', y(bounds.median))
                .attr('stroke', 'black')
                .attr('stroke-width', 2);

            // Whisker caps
            [bounds.min, bounds.max].forEach(value => {
                g.append('line')
                    .attr('x1', boxCenter - boxWidth / 4)
                    .attr('x2', boxCenter + boxWidth / 4)
                    .attr('y1', y(value))
                    .attr('y2', y(value))
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1);
            });

            // Outliers (si data points désactivés et showOutliers activé)
            if (!showDataPoints && showOutliers) {
                const outlierData = [];
                sample.data.forEach((value, index) => {
                    if (value < bounds.min || value > bounds.max) {
                        outlierData.push({ value, index });
                    }
                });

                const MAX_OUTLIERS = Infinity; // Pas de limite - afficher tous les outliers
                let displayOutlierData = outlierData;
                if (outlierData.length > MAX_OUTLIERS) {
                    const indices = d3.shuffle(d3.range(outlierData.length)).slice(0, MAX_OUTLIERS);
                    displayOutlierData = indices.map(i => outlierData[i]);
                }

                const outlierRadius = outlierData.length > 200 ? 2 : 3;
                const outlierOpacity = outlierData.length > 200 ? 0.3 : 0.5;

                displayOutlierData.forEach(d => {
                    g.append('circle')
                        .attr('class', 'outlier interactive')
                        .attr('cx', boxCenter)
                        .attr('cy', y(d.value))
                        .attr('r', outlierRadius)
                        .attr('fill', '#DF6277')
                        .attr('opacity', outlierOpacity)
                        .style('cursor', 'pointer')
                        .on('mouseenter', function(event) {
                            d3.select(this).attr('r', outlierRadius * 1.8).attr('opacity', 1);
                            self.showTooltip(self.getPointTooltipContent(d.index, d.value, sample.name), event);
                        })
                        .on('mousemove', function(event) {
                            self.positionTooltip(event);
                        })
                        .on('mouseleave', function() {
                            d3.select(this).attr('r', outlierRadius).attr('opacity', outlierOpacity);
                            self.hideTooltip();
                        });
                });
            }

            // Labels sous les box plots
            if (isComparison) {
                g.append('text')
                    .attr('x', boxCenter)
                    .attr('y', this.innerHeight + 25)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '12px')
                    .style('fill', sample.color)
                    .style('font-weight', '600')
                    .text(sample.name);
            }
        });

        // Axe Y
        g.append('g').call(d3.axisLeft(y).ticks(8));

        // Dessiner la ligne d'établissement
        this.drawEstablishmentLine(g, y, establishment);

        // Label Y
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Valeur');
    }

    // Violin Plot
    drawViolinPlot(samples, showDataPoints, isComparison, establishment = null, showOutliers = true) {
        const svg = d3.select('#mainChart')
            .attr('width', this.width)
            .attr('height', this.height);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        const y = this.getCommonYScale(samples, showOutliers);
        const self = this;

        // Définir les positions des violins
        let positions;
        const violinMaxWidth = isComparison ? this.innerWidth * 0.18 : this.innerWidth * 0.35;

        if (isComparison) {
            if (showDataPoints) {
                positions = [this.innerWidth * 0.35, this.innerWidth * 0.75];
            } else {
                positions = [this.innerWidth * 0.33, this.innerWidth * 0.67];
            }
        } else {
            positions = [showDataPoints ? this.innerWidth * 0.65 : this.innerWidth / 2];
        }

        // Zone des data points à gauche (si activée)
        if (showDataPoints) {
            samples.forEach((sample, idx) => {
                const bounds = this.getOutlierBounds(sample.data);
                const outlierIndices = new Set();
                sample.data.forEach((value, index) => {
                    if (value < bounds.min || value > bounds.max) {
                        outlierIndices.add(index);
                    }
                });

                const leftBound = isComparison ?
                    (idx === 0 ? 10 : this.innerWidth * 0.52) : 10;
                const rightBound = isComparison ?
                    (idx === 0 ? this.innerWidth * 0.18 : this.innerWidth * 0.68) : this.innerWidth * 0.35;

                this.drawDataPoints(g, sample.data, y, leftBound, rightBound, outlierIndices, sample.color, sample.name, showOutliers);
            });

            // Lignes de séparation
            const separatorX = isComparison ? this.innerWidth * 0.22 : this.innerWidth * 0.45;
            g.append('line')
                .attr('x1', separatorX)
                .attr('x2', separatorX)
                .attr('y1', 0)
                .attr('y2', this.innerHeight)
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '5,5');

            if (isComparison) {
                g.append('line')
                    .attr('x1', this.innerWidth * 0.72)
                    .attr('x2', this.innerWidth * 0.72)
                    .attr('y1', 0)
                    .attr('y2', this.innerHeight)
                    .attr('stroke', '#ddd')
                    .attr('stroke-width', 1)
                    .attr('stroke-dasharray', '5,5');
            }
        }

        // Dessiner chaque violin
        samples.forEach((sample, idx) => {
            const violinCenter = positions[idx];

            // Calcul de la densité
            const bins = d3.bin()
                .domain(y.domain())
                .thresholds(40)(sample.data);

            const maxBinLength = d3.max(bins, d => d.length);
            const x = d3.scaleLinear()
                .domain([0, maxBinLength])
                .range([0, violinMaxWidth]);

            if (showDataPoints) {
                // Demi-violin (seulement à droite)
                const halfArea = d3.area()
                    .curve(d3.curveCatmullRom)
                    .y(d => y((d.x0 + d.x1) / 2))
                    .x0(violinCenter)
                    .x1(d => violinCenter + x(d.length));

                const violinPath = g.append('path')
                    .datum(bins)
                    .attr('d', halfArea)
                    .attr('fill', sample.color)
                    .attr('opacity', 0.7)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1)
                    .attr('class', 'distribution-area')
                    .style('cursor', 'crosshair');

                violinPath.on('mouseenter', function(event) {
                        self.showTooltip(self.getStatsTooltipContent(sample.stats, sample.name), event);
                    })
                    .on('mousemove', function(event) {
                        self.positionTooltip(event);
                    })
                    .on('mouseleave', function() {
                        self.hideTooltip();
                    });

                // Ligne centrale
                g.append('line')
                    .attr('x1', violinCenter)
                    .attr('x2', violinCenter)
                    .attr('y1', y(d3.min(sample.data)))
                    .attr('y2', y(d3.max(sample.data)))
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
                    .attr('fill', sample.color)
                    .attr('opacity', 0.7)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1)
                    .attr('class', 'distribution-area')
                    .style('cursor', 'crosshair');

                violinPath.on('mouseenter', function(event) {
                        self.showTooltip(self.getStatsTooltipContent(sample.stats, sample.name), event);
                    })
                    .on('mousemove', function(event) {
                        self.positionTooltip(event);
                    })
                    .on('mouseleave', function() {
                        self.hideTooltip();
                    });
            }

            // Labels
            if (isComparison) {
                g.append('text')
                    .attr('x', violinCenter)
                    .attr('y', this.innerHeight + 25)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '12px')
                    .style('fill', sample.color)
                    .style('font-weight', '600')
                    .text(sample.name);
            }
        });

        // Axe Y
        g.append('g').call(d3.axisLeft(y).ticks(8));

        // Dessiner la ligne d'établissement
        this.drawEstablishmentLine(g, y, establishment);

        // Label Y
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Valeur');
    }

    // Density Plot
    drawDensityPlot(samples, showDataPoints, isComparison, establishment = null, showOutliers = true) {
        const svg = d3.select('#mainChart')
            .attr('width', this.width)
            .attr('height', this.height);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        const y = this.getCommonYScale(samples, showOutliers);
        const self = this;

        // Définir les positions des density plots
        let positions;
        const densityMaxWidth = isComparison ? this.innerWidth * 0.18 : this.innerWidth * 0.35;

        if (isComparison) {
            if (showDataPoints) {
                positions = [this.innerWidth * 0.32, this.innerWidth * 0.72];
            } else {
                positions = [this.innerWidth * 0.28, this.innerWidth * 0.62];
            }
        } else {
            positions = [showDataPoints ? this.innerWidth * 0.55 : this.innerWidth * 0.3];
        }

        // Zone des data points à gauche (si activée)
        if (showDataPoints) {
            samples.forEach((sample, idx) => {
                const bounds = this.getOutlierBounds(sample.data);
                const outlierIndices = new Set();
                sample.data.forEach((value, index) => {
                    if (value < bounds.min || value > bounds.max) {
                        outlierIndices.add(index);
                    }
                });

                const leftBound = isComparison ?
                    (idx === 0 ? 10 : this.innerWidth * 0.50) : 10;
                const rightBound = isComparison ?
                    (idx === 0 ? this.innerWidth * 0.16 : this.innerWidth * 0.64) : this.innerWidth * 0.35;

                this.drawDataPoints(g, sample.data, y, leftBound, rightBound, outlierIndices, sample.color, sample.name, showOutliers);
            });

            // Lignes de séparation
            const separatorX = isComparison ? this.innerWidth * 0.20 : this.innerWidth * 0.45;
            g.append('line')
                .attr('x1', separatorX)
                .attr('x2', separatorX)
                .attr('y1', 0)
                .attr('y2', this.innerHeight)
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '5,5');

            if (isComparison) {
                g.append('line')
                    .attr('x1', this.innerWidth * 0.68)
                    .attr('x2', this.innerWidth * 0.68)
                    .attr('y1', 0)
                    .attr('y2', this.innerHeight)
                    .attr('stroke', '#ddd')
                    .attr('stroke-width', 1)
                    .attr('stroke-dasharray', '5,5');
            }
        }

        // Dessiner chaque density plot
        samples.forEach((sample, idx) => {
            const densityCenter = positions[idx];

            // Calculer la densité
            const bandwidth = (d3.max(sample.data) - d3.min(sample.data)) / 20;
            const densityData = this.kernelDensityEstimator(
                this.kernelEpanechnikov(bandwidth),
                y.ticks(50),
                sample.data
            );

            const xDensity = d3.scaleLinear()
                .domain([0, d3.max(densityData, d => d[1])])
                .range([0, densityMaxWidth]);

            // Courbe de densité
            const area = d3.area()
                .curve(d3.curveBasis)
                .y(d => y(d[0]))
                .x0(densityCenter)
                .x1(d => densityCenter + xDensity(d[1]));

            const densityPath = g.append('path')
                .datum(densityData)
                .attr('d', area)
                .attr('fill', sample.color)
                .attr('opacity', 0.5)
                .attr('class', 'distribution-area')
                .style('cursor', 'crosshair');

            densityPath.on('mouseenter', function(event) {
                    self.showTooltip(self.getStatsTooltipContent(sample.stats, sample.name), event);
                })
                .on('mousemove', function(event) {
                    self.positionTooltip(event);
                })
                .on('mouseleave', function() {
                    self.hideTooltip();
                });

            // Ligne de contour
            const line = d3.line()
                .curve(d3.curveBasis)
                .y(d => y(d[0]))
                .x(d => densityCenter + xDensity(d[1]));

            g.append('path')
                .datum(densityData)
                .attr('d', line)
                .attr('fill', 'none')
                .attr('stroke', sample.color)
                .attr('stroke-width', 2);

            // Ligne de base
            g.append('line')
                .attr('x1', densityCenter)
                .attr('x2', densityCenter)
                .attr('y1', 0)
                .attr('y2', this.innerHeight)
                .attr('stroke', 'black')
                .attr('stroke-width', 1);

            // Labels
            if (isComparison) {
                g.append('text')
                    .attr('x', densityCenter + densityMaxWidth / 2)
                    .attr('y', this.innerHeight + 25)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '12px')
                    .style('fill', sample.color)
                    .style('font-weight', '600')
                    .text(sample.name);
            } else {
                g.append('text')
                    .attr('x', densityCenter + densityMaxWidth / 2)
                    .attr('y', this.innerHeight + 35)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '12px')
                    .text('Densité');
            }
        });

        // Axe Y
        g.append('g').call(d3.axisLeft(y).ticks(8));

        // Dessiner la ligne d'établissement
        this.drawEstablishmentLine(g, y, establishment);

        // Label Y
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Valeur');
    }

    // Dessiner les data points
    drawDataPoints(g, data, y, leftBoundary, rightBoundary, outlierIndices, color, sampleName, showOutliers = true) {
        const MAX_VISUAL_POINTS = Infinity; // Pas de limite - afficher tous les points
        const totalPoints = data.length;
        const enableHoverForAll = totalPoints < MAX_VISUAL_POINTS;

        let indexedData = data.map((value, index) => ({ value, index }));

        // Si showOutliers est false, filtrer les outliers
        if (!showOutliers) {
            indexedData = indexedData.filter(d => !outlierIndices.has(d.index));
        }

        let displayData = indexedData;
        let isSampled = false;

        if (indexedData.length > MAX_VISUAL_POINTS) {
            const indices = d3.shuffle(d3.range(indexedData.length)).slice(0, MAX_VISUAL_POINTS);
            displayData = indices.map(i => indexedData[i]);
            isSampled = true;
        }

        const displayCount = indexedData.length;
        const pointRadius = displayCount > 5000 ? 1.5 : (displayCount > 2000 ? 2 : 2.5);
        const pointOpacity = displayCount > 5000 ? 0.3 : (displayCount > 2000 ? 0.4 : 0.5);
        const jitterWidth = rightBoundary - leftBoundary - 10;
        const center = (leftBoundary + rightBoundary) / 2;

        const self = this;

        g.selectAll(`circle.datapoint-${sampleName.replace(/\s+/g, '')}`)
            .data(displayData)
            .join('circle')
            .attr('class', d => {
                const isOutlier = showOutliers && outlierIndices.has(d.index);
                const isInteractive = enableHoverForAll || isOutlier;
                return `datapoint datapoint-${sampleName.replace(/\s+/g, '')}${isInteractive ? ' interactive' : ''}${isOutlier ? ' outlier-point' : ''}`;
            })
            .attr('cx', () => center + (Math.random() - 0.5) * jitterWidth)
            .attr('cy', d => y(d.value))
            .attr('r', pointRadius)
            .attr('fill', d => (showOutliers && outlierIndices.has(d.index)) ? '#DF6277' : color)
            .attr('opacity', pointOpacity)
            .attr('stroke', 'none')
            .on('mouseenter', function(event, d) {
                const isOutlier = showOutliers && outlierIndices.has(d.index);
                if (enableHoverForAll || isOutlier) {
                    d3.select(this)
                        .attr('r', pointRadius * 1.8)
                        .attr('opacity', 1);
                    self.showTooltip(self.getPointTooltipContent(d.index, d.value, sampleName), event);
                }
            })
            .on('mousemove', function(event, d) {
                const isOutlier = showOutliers && outlierIndices.has(d.index);
                if (enableHoverForAll || isOutlier) {
                    self.positionTooltip(event);
                }
            })
            .on('mouseleave', function(_event, d) {
                const isOutlier = showOutliers && outlierIndices.has(d.index);
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
                .text(`(${MAX_VISUAL_POINTS}/${displayCount})`);
        }
    }

    // Kernel Density Estimation helpers
    kernelDensityEstimator(kernel, X, data) {
        return X.map(x => [x, d3.mean(data, v => kernel(x - v))]);
    }

    kernelEpanechnikov(bandwidth) {
        return x => Math.abs(x /= bandwidth) <= 1 ? 0.75 * (1 - x * x) / bandwidth : 0;
    }
}
