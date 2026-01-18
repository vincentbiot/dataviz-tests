class Visualizations {
    constructor() {
        this.width = 400;
        this.height = 300;
        this.margin = { top: 20, right: 20, bottom: 40, left: 50 };
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;
    }

    clearAll() {
        d3.select('#histogram').selectAll('*').remove();
        d3.select('#boxplot').selectAll('*').remove();
        d3.select('#violinplot').selectAll('*').remove();
        d3.select('#dotplot').selectAll('*').remove();
        d3.select('#densityplot').selectAll('*').remove();
        d3.select('#barchart').selectAll('*').remove();
    }

    // 1. Histogramme
    drawHistogram(data) {
        const svg = d3.select('#histogram')
            .attr('width', this.width)
            .attr('height', this.height);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        const x = d3.scaleLinear()
            .domain(d3.extent(data))
            .range([0, this.innerWidth]);

        const bins = d3.bin()
            .domain(x.domain())
            .thresholds(20)(data);

        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([this.innerHeight, 0]);

        // Barres
        g.selectAll('rect')
            .data(bins)
            .join('rect')
            .attr('x', d => x(d.x0) + 1)
            .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 2))
            .attr('y', d => y(d.length))
            .attr('height', d => this.innerHeight - y(d.length))
            .attr('fill', '#4682b4')
            .attr('opacity', 0.7);

        // Axes
        g.append('g')
            .attr('transform', `translate(0,${this.innerHeight})`)
            .call(d3.axisBottom(x).ticks(5));

        g.append('g')
            .call(d3.axisLeft(y).ticks(5));

        // Labels
        g.append('text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight + 35)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Valeur');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -35)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Fréquence');
    }

    // 2. Box Plot
    drawBoxPlot(data) {
        const svg = d3.select('#boxplot')
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

        const center = this.innerWidth / 2;
        const boxWidth = 60;

        // Ligne verticale (whiskers)
        g.append('line')
            .attr('x1', center)
            .attr('x2', center)
            .attr('y1', y(min))
            .attr('y2', y(max))
            .attr('stroke', 'black')
            .attr('stroke-width', 1);

        // Boîte
        g.append('rect')
            .attr('x', center - boxWidth / 2)
            .attr('y', y(q3))
            .attr('width', boxWidth)
            .attr('height', y(q1) - y(q3))
            .attr('fill', '#4682b4')
            .attr('stroke', 'black')
            .attr('opacity', 0.7);

        // Médiane
        g.append('line')
            .attr('x1', center - boxWidth / 2)
            .attr('x2', center + boxWidth / 2)
            .attr('y1', y(median))
            .attr('y2', y(median))
            .attr('stroke', 'black')
            .attr('stroke-width', 2);

        // Whisker caps
        [min, max].forEach(value => {
            g.append('line')
                .attr('x1', center - boxWidth / 4)
                .attr('x2', center + boxWidth / 4)
                .attr('y1', y(value))
                .attr('y2', y(value))
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
        });

        // Outliers (avec échantillonnage si trop nombreux)
        const outliers = sorted.filter(value => value < min || value > max);
        const MAX_OUTLIERS_DISPLAY = 500;
        let displayOutliers = outliers;
        if (outliers.length > MAX_OUTLIERS_DISPLAY) {
            const indices = d3.shuffle(d3.range(outliers.length)).slice(0, MAX_OUTLIERS_DISPLAY);
            displayOutliers = indices.map(i => outliers[i]);
        }

        displayOutliers.forEach(value => {
            g.append('circle')
                .attr('cx', center)
                .attr('cy', y(value))
                .attr('r', outliers.length > 200 ? 2 : 3)
                .attr('fill', 'red')
                .attr('opacity', outliers.length > 200 ? 0.3 : 0.5);
        });

        // Axe Y
        g.append('g')
            .call(d3.axisLeft(y).ticks(5));

        // Label
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -35)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Valeur');
    }

    // 3. Violin Plot
    drawViolinPlot(data) {
        const svg = d3.select('#violinplot')
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

        const x = d3.scaleLinear()
            .domain([0, maxBinLength])
            .range([0, this.innerWidth / 2]);

        const center = this.innerWidth / 2;

        // Créer le chemin du violon
        const area = d3.area()
            .curve(d3.curveCatmullRom)
            .y(d => y((d.x0 + d.x1) / 2))
            .x0(d => center - x(d.length))
            .x1(d => center + x(d.length));

        g.append('path')
            .datum(bins)
            .attr('d', area)
            .attr('fill', '#4682b4')
            .attr('opacity', 0.7)
            .attr('stroke', 'black')
            .attr('stroke-width', 1);

        // Axe Y
        g.append('g')
            .call(d3.axisLeft(y).ticks(5));

        // Label
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -35)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Valeur');
    }

    // 4. Dot Plot (optimisé pour grands échantillons)
    drawDotPlot(data) {
        const svg = d3.select('#dotplot')
            .attr('width', this.width)
            .attr('height', this.height);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        const y = d3.scaleLinear()
            .domain(d3.extent(data))
            .range([this.innerHeight, 0]);

        const center = this.innerWidth / 2;

        // Optimisation pour les grands échantillons
        const MAX_VISUAL_POINTS = 2000;
        let displayData = data;
        let isSampled = false;

        if (data.length > MAX_VISUAL_POINTS) {
            // Échantillonnage aléatoire stratifié pour préserver la distribution
            const indices = d3.shuffle(d3.range(data.length)).slice(0, MAX_VISUAL_POINTS);
            displayData = indices.map(i => data[i]);
            isSampled = true;
        }

        // Ajuster la taille et l'opacité selon le nombre de points
        const pointRadius = data.length > 5000 ? 1.5 : (data.length > 2000 ? 2 : 3);
        const pointOpacity = data.length > 5000 ? 0.3 : (data.length > 2000 ? 0.4 : 0.5);
        const jitterWidth = data.length > 5000 ? 60 : (data.length > 2000 ? 50 : 40);

        // Points avec jitter
        g.selectAll('circle')
            .data(displayData)
            .join('circle')
            .attr('cx', () => center + (Math.random() - 0.5) * jitterWidth)
            .attr('cy', d => y(d))
            .attr('r', pointRadius)
            .attr('fill', '#4682b4')
            .attr('opacity', pointOpacity)
            .attr('stroke', 'none');

        // Axe Y
        g.append('g')
            .call(d3.axisLeft(y).ticks(5));

        // Label
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -35)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Valeur');

        // Indication si échantillonnage visuel appliqué
        if (isSampled) {
            g.append('text')
                .attr('x', this.innerWidth - 5)
                .attr('y', 10)
                .attr('text-anchor', 'end')
                .style('font-size', '9px')
                .style('fill', '#666')
                .text(`(${MAX_VISUAL_POINTS}/${data.length} affichés)`);
        }
    }

    // 5. Density Plot
    drawDensityPlot(data) {
        const svg = d3.select('#densityplot')
            .attr('width', this.width)
            .attr('height', this.height);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        const x = d3.scaleLinear()
            .domain(d3.extent(data))
            .range([0, this.innerWidth]);

        // Calculer la densité avec kernel density estimation
        const bandwidth = (d3.max(data) - d3.min(data)) / 20;
        const density = this.kernelDensityEstimator(this.kernelEpanechnikov(bandwidth), x.ticks(50), data);

        const y = d3.scaleLinear()
            .domain([0, d3.max(density, d => d[1])])
            .range([this.innerHeight, 0]);

        // Courbe de densité
        const line = d3.line()
            .curve(d3.curveBasis)
            .x(d => x(d[0]))
            .y(d => y(d[1]));

        g.append('path')
            .datum(density)
            .attr('d', line)
            .attr('fill', 'none')
            .attr('stroke', '#4682b4')
            .attr('stroke-width', 2);

        // Aire sous la courbe
        const area = d3.area()
            .curve(d3.curveBasis)
            .x(d => x(d[0]))
            .y0(this.innerHeight)
            .y1(d => y(d[1]));

        g.append('path')
            .datum(density)
            .attr('d', area)
            .attr('fill', '#4682b4')
            .attr('opacity', 0.3);

        // Axes
        g.append('g')
            .attr('transform', `translate(0,${this.innerHeight})`)
            .call(d3.axisBottom(x).ticks(5));

        g.append('g')
            .call(d3.axisLeft(y).ticks(5));

        // Labels
        g.append('text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight + 35)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Valeur');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -35)
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

    // 6. Bar Chart avec statistiques
    drawBarChart(stats) {
        const svg = d3.select('#barchart')
            .attr('width', this.width)
            .attr('height', this.height);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        const categories = [
            { label: 'Min', value: parseFloat(stats.min) },
            { label: 'Q1', value: parseFloat(stats.q1) },
            { label: 'Médiane', value: parseFloat(stats.median) },
            { label: 'Moyenne', value: parseFloat(stats.mean) },
            { label: 'Q3', value: parseFloat(stats.q3) },
            { label: 'Max', value: parseFloat(stats.max) }
        ];

        const x = d3.scaleBand()
            .domain(categories.map(d => d.label))
            .range([0, this.innerWidth])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(categories, d => d.value)])
            .range([this.innerHeight, 0]);

        // Barres
        g.selectAll('rect')
            .data(categories)
            .join('rect')
            .attr('x', d => x(d.label))
            .attr('y', d => y(d.value))
            .attr('width', x.bandwidth())
            .attr('height', d => this.innerHeight - y(d.value))
            .attr('fill', '#4682b4')
            .attr('opacity', 0.7);

        // Valeurs au-dessus des barres
        g.selectAll('text.value')
            .data(categories)
            .join('text')
            .attr('class', 'value')
            .attr('x', d => x(d.label) + x.bandwidth() / 2)
            .attr('y', d => y(d.value) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .text(d => d.value.toFixed(1));

        // Axes
        g.append('g')
            .attr('transform', `translate(0,${this.innerHeight})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('font-size', '10px');

        g.append('g')
            .call(d3.axisLeft(y).ticks(5));

        // Label
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -35)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text('Valeur');
    }

    // Méthode pour tout dessiner
    drawAll(data, stats) {
        this.clearAll();
        this.drawHistogram(data);
        this.drawBoxPlot(data);
        this.drawViolinPlot(data);
        this.drawDotPlot(data);
        this.drawDensityPlot(data);
        this.drawBarChart(stats);
    }
}
