/**
 * Classe de visualisation pour données de questionnaires
 * Supporte : barres horizontales, barres verticales, mode comparaison
 */
class SurveyVisualizations {
    constructor(svgId, width = 700, height = 400) {
        this.svg = d3.select(svgId);
        this.width = width;
        this.height = height;
        this.margin = { top: 30, right: 140, bottom: 60, left: 160 };
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        // Couleurs
        this.colors = {
            sample1: '#3A9484',
            sample2: '#D276CA',
            single: ['#3A9484', '#79C4B6', '#1C7E6D', '#B2DBD3', '#054237', '#E6F2F0'],
            multiple: [
                '#3A9484', '#D276CA', '#1C7E6D', '#AC54A4',
                '#79C4B6', '#DF6277', '#B2DBD3', '#E6F2F0',
                '#054237', '#7B3970'
            ]
        };

        // Configuration du tooltip
        this.tooltip = d3.select('#tooltip');
    }

    /**
     * Méthode principale de dessin
     */
    draw(samples, chartType, options = {}) {
        // Options par défaut
        const {
            showPercentages = true,
            showCounts = true,
            sortDescending = false
        } = options;

        // Effacer le contenu précédent
        this.svg.selectAll('*').remove();

        // Dessiner selon le type de graphique
        switch (chartType) {
            case 'bar-horizontal':
                if (samples.length === 1) {
                    this.drawHorizontalBarChart(samples[0], { showPercentages, showCounts, sortDescending });
                } else {
                    this.drawComparisonBarChart(samples, 'horizontal', { showPercentages, showCounts, sortDescending });
                }
                break;

            case 'bar-vertical':
                if (samples.length === 1) {
                    this.drawVerticalBarChart(samples[0], { showPercentages, showCounts, sortDescending });
                } else {
                    this.drawComparisonBarChart(samples, 'vertical', { showPercentages, showCounts, sortDescending });
                }
                break;
        }
    }

    /**
     * Diagramme en barres horizontales (1 échantillon)
     */
    drawHorizontalBarChart(sample, options) {
        const { data, name, color } = sample;
        const { showPercentages, showCounts, sortDescending } = options;

        // Créer le groupe principal
        const g = this.svg
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Trier les données si nécessaire
        const sortedData = sortDescending
            ? [...data].sort((a, b) => b.count - a.count)
            : data;

        // Échelles
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(sortedData, d => d.count)])
            .range([0, this.innerWidth])
            .nice();

        const yScale = d3.scaleBand()
            .domain(sortedData.map(d => d.label))
            .range([0, this.innerHeight])
            .padding(0.2);

        // Obtenir les couleurs
        const colorScale = this.getColorScale(sortedData.length);

        // Dessiner les barres
        g.selectAll('.bar')
            .data(sortedData)
            .join('rect')
            .attr('class', 'bar')
            .attr('x', 0)
            .attr('y', d => yScale(d.label))
            .attr('width', d => xScale(d.count))
            .attr('height', yScale.bandwidth())
            .attr('fill', (d, i) => colorScale(i))
            .attr('opacity', 0.8)
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mousemove', (event) => this.positionTooltip(event))
            .on('mouseout', () => this.hideTooltip())
            .style('cursor', 'pointer');

        // Labels à droite des barres
        if (showCounts || showPercentages) {
            g.selectAll('.bar-label')
                .data(sortedData)
                .join('text')
                .attr('class', 'bar-label')
                .attr('x', d => xScale(d.count) + 8)
                .attr('y', d => yScale(d.label) + yScale.bandwidth() / 2)
                .attr('dy', '0.35em')
                .attr('font-size', '12px')
                .attr('font-weight', '600')
                .attr('fill', '#333')
                .text(d => {
                    const parts = [];
                    if (showCounts) parts.push(d.count);
                    if (showPercentages) parts.push(`(${d.percentage}%)`);
                    return parts.join(' ');
                });
        }

        // Axe X
        const xAxis = d3.axisBottom(xScale)
            .ticks(5)
            .tickFormat(d3.format('d'));

        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.innerHeight})`)
            .call(xAxis)
            .selectAll('text')
            .attr('font-size', '11px');

        // Axe Y
        const yAxis = d3.axisLeft(yScale);

        g.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .selectAll('text')
            .attr('font-size', '12px')
            .attr('font-weight', '500');

        // Titre de l'axe X
        g.append('text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight + 45)
            .attr('text-anchor', 'middle')
            .attr('font-size', '13px')
            .attr('font-weight', '600')
            .attr('fill', '#495057')
            .text('Nombre de réponses');
    }

    /**
     * Diagramme en barres verticales (1 échantillon)
     */
    drawVerticalBarChart(sample, options) {
        const { data, name, color } = sample;
        const { showPercentages, showCounts, sortDescending } = options;

        // Ajuster les marges pour les barres verticales
        const margin = { top: 30, right: 40, bottom: 100, left: 70 };
        const innerWidth = this.width - margin.left - margin.right;
        const innerHeight = this.height - margin.top - margin.bottom;

        // Créer le groupe principal
        const g = this.svg
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Trier les données si nécessaire
        const sortedData = sortDescending
            ? [...data].sort((a, b) => b.count - a.count)
            : data;

        // Échelles
        const xScale = d3.scaleBand()
            .domain(sortedData.map(d => d.label))
            .range([0, innerWidth])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(sortedData, d => d.count)])
            .range([innerHeight, 0])
            .nice();

        // Obtenir les couleurs
        const colorScale = this.getColorScale(sortedData.length);

        // Dessiner les barres
        g.selectAll('.bar')
            .data(sortedData)
            .join('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.label))
            .attr('y', d => yScale(d.count))
            .attr('width', xScale.bandwidth())
            .attr('height', d => innerHeight - yScale(d.count))
            .attr('fill', (d, i) => colorScale(i))
            .attr('opacity', 0.8)
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mousemove', (event) => this.positionTooltip(event))
            .on('mouseout', () => this.hideTooltip())
            .style('cursor', 'pointer');

        // Labels au-dessus des barres
        if (showCounts || showPercentages) {
            g.selectAll('.bar-label')
                .data(sortedData)
                .join('text')
                .attr('class', 'bar-label')
                .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2)
                .attr('y', d => yScale(d.count) - 5)
                .attr('text-anchor', 'middle')
                .attr('font-size', '11px')
                .attr('font-weight', '600')
                .attr('fill', '#333')
                .text(d => {
                    const parts = [];
                    if (showCounts) parts.push(d.count);
                    if (showPercentages) parts.push(`(${d.percentage}%)`);
                    return parts.join(' ');
                });
        }

        // Axe X
        const xAxis = d3.axisBottom(xScale);

        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .attr('text-anchor', 'end')
            .attr('dx', '-0.5em')
            .attr('dy', '0.5em')
            .attr('font-size', '11px')
            .attr('font-weight', '500');

        // Axe Y
        const yAxis = d3.axisLeft(yScale)
            .ticks(5)
            .tickFormat(d3.format('d'));

        g.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .selectAll('text')
            .attr('font-size', '11px');

        // Titre de l'axe Y
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -50)
            .attr('text-anchor', 'middle')
            .attr('font-size', '13px')
            .attr('font-weight', '600')
            .attr('fill', '#495057')
            .text('Nombre de réponses');
    }

    /**
     * Diagramme en barres groupées pour comparaison
     */
    drawComparisonBarChart(samples, orientation, options) {
        const { showPercentages, showCounts, sortDescending } = options;

        // Utiliser les données du premier échantillon pour les labels
        const labels = samples[0].data.map(d => d.label);

        // Trier si nécessaire
        let sortedLabels = labels;
        if (sortDescending) {
            // Trier par la somme des deux échantillons
            const combined = labels.map(label => {
                const count1 = samples[0].data.find(d => d.label === label)?.count || 0;
                const count2 = samples[1].data.find(d => d.label === label)?.count || 0;
                return { label, total: count1 + count2 };
            });
            combined.sort((a, b) => b.total - a.total);
            sortedLabels = combined.map(d => d.label);
        }

        if (orientation === 'horizontal') {
            this.drawHorizontalComparisonChart(samples, sortedLabels, { showPercentages, showCounts });
        } else {
            this.drawVerticalComparisonChart(samples, sortedLabels, { showPercentages, showCounts });
        }
    }

    /**
     * Barres horizontales groupées
     */
    drawHorizontalComparisonChart(samples, labels, options) {
        const { showPercentages, showCounts } = options;

        // Créer le groupe principal
        const g = this.svg
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Trouver le maximum pour l'échelle
        const maxCount = d3.max(samples.flatMap(s => s.data.map(d => d.count)));

        // Échelles
        const xScale = d3.scaleLinear()
            .domain([0, maxCount])
            .range([0, this.innerWidth])
            .nice();

        const yScale = d3.scaleBand()
            .domain(labels)
            .range([0, this.innerHeight])
            .padding(0.3);

        const ySubScale = d3.scaleBand()
            .domain([0, 1])
            .range([0, yScale.bandwidth()])
            .padding(0.05);

        // Dessiner les barres pour chaque échantillon
        samples.forEach((sample, sampleIndex) => {
            const bars = g.selectAll(`.bar-sample${sampleIndex}`)
                .data(sample.data)
                .join('rect')
                .attr('class', `bar-sample${sampleIndex}`)
                .attr('x', 0)
                .attr('y', d => yScale(d.label) + ySubScale(sampleIndex))
                .attr('width', d => xScale(d.count))
                .attr('height', ySubScale.bandwidth())
                .attr('fill', sample.color)
                .attr('opacity', 0.8)
                .on('mouseover', (event, d) => this.showComparisonTooltip(event, d, sample.name))
                .on('mousemove', (event) => this.positionTooltip(event))
                .on('mouseout', () => this.hideTooltip())
                .style('cursor', 'pointer');

            // Labels
            if (showCounts || showPercentages) {
                g.selectAll(`.label-sample${sampleIndex}`)
                    .data(sample.data)
                    .join('text')
                    .attr('class', `label-sample${sampleIndex}`)
                    .attr('x', d => xScale(d.count) + 5)
                    .attr('y', d => yScale(d.label) + ySubScale(sampleIndex) + ySubScale.bandwidth() / 2)
                    .attr('dy', '0.35em')
                    .attr('font-size', '10px')
                    .attr('font-weight', '600')
                    .attr('fill', '#333')
                    .text(d => {
                        const parts = [];
                        if (showCounts) parts.push(d.count);
                        if (showPercentages) parts.push(`(${d.percentage}%)`);
                        return parts.join(' ');
                    });
            }
        });

        // Axe X
        const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('d'));
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.innerHeight})`)
            .call(xAxis)
            .selectAll('text')
            .attr('font-size', '11px');

        // Axe Y
        const yAxis = d3.axisLeft(yScale);
        g.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .selectAll('text')
            .attr('font-size', '12px')
            .attr('font-weight', '500');

        // Titre de l'axe X
        g.append('text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight + 45)
            .attr('text-anchor', 'middle')
            .attr('font-size', '13px')
            .attr('font-weight', '600')
            .attr('fill', '#495057')
            .text('Nombre de réponses');
    }

    /**
     * Barres verticales groupées
     */
    drawVerticalComparisonChart(samples, labels, options) {
        const { showPercentages, showCounts } = options;

        // Ajuster les marges
        const margin = { top: 30, right: 40, bottom: 100, left: 70 };
        const innerWidth = this.width - margin.left - margin.right;
        const innerHeight = this.height - margin.top - margin.bottom;

        // Créer le groupe principal
        const g = this.svg
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Trouver le maximum pour l'échelle
        const maxCount = d3.max(samples.flatMap(s => s.data.map(d => d.count)));

        // Échelles
        const xScale = d3.scaleBand()
            .domain(labels)
            .range([0, innerWidth])
            .padding(0.3);

        const xSubScale = d3.scaleBand()
            .domain([0, 1])
            .range([0, xScale.bandwidth()])
            .padding(0.05);

        const yScale = d3.scaleLinear()
            .domain([0, maxCount])
            .range([innerHeight, 0])
            .nice();

        // Dessiner les barres pour chaque échantillon
        samples.forEach((sample, sampleIndex) => {
            const bars = g.selectAll(`.bar-sample${sampleIndex}`)
                .data(sample.data)
                .join('rect')
                .attr('class', `bar-sample${sampleIndex}`)
                .attr('x', d => xScale(d.label) + xSubScale(sampleIndex))
                .attr('y', d => yScale(d.count))
                .attr('width', xSubScale.bandwidth())
                .attr('height', d => innerHeight - yScale(d.count))
                .attr('fill', sample.color)
                .attr('opacity', 0.8)
                .on('mouseover', (event, d) => this.showComparisonTooltip(event, d, sample.name))
                .on('mousemove', (event) => this.positionTooltip(event))
                .on('mouseout', () => this.hideTooltip())
                .style('cursor', 'pointer');

            // Labels
            if (showCounts || showPercentages) {
                g.selectAll(`.label-sample${sampleIndex}`)
                    .data(sample.data)
                    .join('text')
                    .attr('class', `label-sample${sampleIndex}`)
                    .attr('x', d => xScale(d.label) + xSubScale(sampleIndex) + xSubScale.bandwidth() / 2)
                    .attr('y', d => yScale(d.count) - 5)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '10px')
                    .attr('font-weight', '600')
                    .attr('fill', '#333')
                    .text(d => {
                        const parts = [];
                        if (showCounts) parts.push(d.count);
                        if (showPercentages) parts.push(`(${d.percentage}%)`);
                        return parts.join(' ');
                    });
            }
        });

        // Axe X
        const xAxis = d3.axisBottom(xScale);
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .attr('text-anchor', 'end')
            .attr('dx', '-0.5em')
            .attr('dy', '0.5em')
            .attr('font-size', '11px')
            .attr('font-weight', '500');

        // Axe Y
        const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('d'));
        g.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
            .selectAll('text')
            .attr('font-size', '11px');

        // Titre de l'axe Y
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerHeight / 2)
            .attr('y', -50)
            .attr('text-anchor', 'middle')
            .attr('font-size', '13px')
            .attr('font-weight', '600')
            .attr('fill', '#495057')
            .text('Nombre de réponses');
    }

    /**
     * Obtient une échelle de couleurs
     */
    getColorScale(numItems) {
        const palette = numItems <= 6 ? this.colors.single : this.colors.multiple;
        return (index) => palette[index % palette.length];
    }

    /**
     * Affiche le tooltip
     */
    showTooltip(event, data) {
        const html = `
            <div class="tooltip-title">${data.label}</div>
            <div class="tooltip-row">
                <span class="tooltip-label">Réponses :</span>
                <span class="tooltip-value">${data.count}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Pourcentage :</span>
                <span class="tooltip-value">${data.percentage}%</span>
            </div>
        `;

        this.tooltip
            .html(html)
            .classed('visible', true);

        this.positionTooltip(event);
    }

    /**
     * Affiche le tooltip en mode comparaison
     */
    showComparisonTooltip(event, data, sampleName) {
        const html = `
            <div class="tooltip-title">${sampleName}</div>
            <div class="tooltip-row">
                <span class="tooltip-label">${data.label} :</span>
                <span class="tooltip-value">${data.count}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Pourcentage :</span>
                <span class="tooltip-value">${data.percentage}%</span>
            </div>
        `;

        this.tooltip
            .html(html)
            .classed('visible', true);

        this.positionTooltip(event);
    }

    /**
     * Positionne le tooltip
     */
    positionTooltip(event) {
        const tooltipNode = this.tooltip.node();
        const tooltipWidth = tooltipNode.offsetWidth;
        const tooltipHeight = tooltipNode.offsetHeight;

        let left = event.clientX + 15;
        let top = event.clientY - 10;

        // Ajustements pour éviter le débordement
        if (left + tooltipWidth > window.innerWidth) {
            left = event.clientX - tooltipWidth - 15;
        }

        if (top + tooltipHeight > window.innerHeight) {
            top = event.clientY - tooltipHeight - 10;
        }

        this.tooltip
            .style('left', `${left}px`)
            .style('top', `${top}px`);
    }

    /**
     * Cache le tooltip
     */
    hideTooltip() {
        this.tooltip.classed('visible', false);
    }
}
