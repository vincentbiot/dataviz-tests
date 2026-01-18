class Visualizations {
    constructor() {
        this.width = 600;
        this.height = 400;
        this.margin = { top: 30, right: 30, bottom: 50, left: 60 };
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
    }

    clear() {
        d3.select('#mainChart').selectAll('*').remove();
    }

    // Méthode principale pour dessiner le graphique sélectionné
    draw(data, chartType, showDataPoints) {
        this.clear();

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

    // Dessiner les data points à gauche
    drawDataPoints(g, data, y, leftBoundary, rightBoundary) {
        const MAX_VISUAL_POINTS = 2000;
        let displayData = data;
        let isSampled = false;

        if (data.length > MAX_VISUAL_POINTS) {
            const indices = d3.shuffle(d3.range(data.length)).slice(0, MAX_VISUAL_POINTS);
            displayData = indices.map(i => data[i]);
            isSampled = true;
        }

        const pointRadius = data.length > 5000 ? 1.5 : (data.length > 2000 ? 2 : 2.5);
        const pointOpacity = data.length > 5000 ? 0.3 : (data.length > 2000 ? 0.4 : 0.5);
        const jitterWidth = rightBoundary - leftBoundary - 10;
        const center = (leftBoundary + rightBoundary) / 2;

        g.selectAll('circle.datapoint')
            .data(displayData)
            .join('circle')
            .attr('class', 'datapoint')
            .attr('cx', () => center + (Math.random() - 0.5) * jitterWidth)
            .attr('cy', d => y(d))
            .attr('r', pointRadius)
            .attr('fill', '#e67e22')
            .attr('opacity', pointOpacity)
            .attr('stroke', 'none');

        if (isSampled) {
            g.append('text')
                .attr('class', 'sample-info')
                .attr('x', center)
                .attr('y', -10)
                .attr('text-anchor', 'middle')
                .style('font-size', '9px')
                .style('fill', '#666')
                .text(`(${MAX_VISUAL_POINTS}/${data.length} points)`);
        }
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

        // Si data points activés, le box plot est à droite
        const boxCenter = showDataPoints ? this.innerWidth * 0.65 : this.innerWidth / 2;
        const boxWidth = 80;

        // Zone des data points à gauche
        if (showDataPoints) {
            const pointsLeftBoundary = 20;
            const pointsRightBoundary = this.innerWidth * 0.35;
            this.drawDataPoints(g, data, y, pointsLeftBoundary, pointsRightBoundary);

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

        // Boîte
        g.append('rect')
            .attr('x', boxCenter - boxWidth / 2)
            .attr('y', y(q3))
            .attr('width', boxWidth)
            .attr('height', y(q1) - y(q3))
            .attr('fill', '#4682b4')
            .attr('stroke', 'black')
            .attr('opacity', 0.7);

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

        // Outliers
        const outliers = sorted.filter(value => value < min || value > max);
        const MAX_OUTLIERS_DISPLAY = 500;
        let displayOutliers = outliers;
        if (outliers.length > MAX_OUTLIERS_DISPLAY) {
            const indices = d3.shuffle(d3.range(outliers.length)).slice(0, MAX_OUTLIERS_DISPLAY);
            displayOutliers = indices.map(i => outliers[i]);
        }

        displayOutliers.forEach(value => {
            g.append('circle')
                .attr('class', 'outlier')
                .attr('cx', boxCenter)
                .attr('cy', y(value))
                .attr('r', outliers.length > 200 ? 2 : 3)
                .attr('fill', 'red')
                .attr('opacity', outliers.length > 200 ? 0.3 : 0.5);
        });

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
            this.drawDataPoints(g, data, y, pointsLeftBoundary, pointsRightBoundary);

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

            g.append('path')
                .datum(bins)
                .attr('d', halfArea)
                .attr('fill', '#4682b4')
                .attr('opacity', 0.7)
                .attr('stroke', 'black')
                .attr('stroke-width', 1);

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

            g.append('path')
                .datum(bins)
                .attr('d', area)
                .attr('fill', '#4682b4')
                .attr('opacity', 0.7)
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
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

        // Zone des data points à gauche
        if (showDataPoints) {
            const pointsLeftBoundary = 20;
            const pointsRightBoundary = this.innerWidth * 0.35;
            this.drawDataPoints(g, data, y, pointsLeftBoundary, pointsRightBoundary);

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

        g.append('path')
            .datum(densityData)
            .attr('d', area)
            .attr('fill', '#4682b4')
            .attr('opacity', 0.5);

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
