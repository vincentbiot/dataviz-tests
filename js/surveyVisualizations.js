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

        // Couleurs - alternance de deux verts pour les barres
        this.colors = {
            sample1: '#3A9484',
            sample2: '#D276CA',
            green1: '#3A9484',  // Vert foncé
            green2: '#5AB5A5'   // Vert clair
        };

        // Configuration du tooltip
        this.tooltip = d3.select('#tooltip');

        // Configuration de troncature des libellés
        this.maxLabelLength = 20;
    }

    /**
     * Tronque un libellé s'il dépasse la longueur max
     */
    truncateLabel(label, maxLength = this.maxLabelLength) {
        if (label.length <= maxLength) return label;
        return label.substring(0, maxLength - 3) + '...';
    }

    /**
     * Méthode principale de dessin
     */
    draw(samples, chartType, options = {}) {
        // Options par défaut
        const {
            showPercentages = true,
            showCounts = true,
            sortDescending = false,
            labelDisplayMode = 'truncate'
        } = options;

        // Effacer le contenu précédent
        this.svg.selectAll('*').remove();

        // Dessiner selon le type de graphique
        switch (chartType) {
            case 'bar-horizontal':
                if (samples.length === 1) {
                    this.drawHorizontalBarChart(samples[0], { showPercentages, showCounts, sortDescending, labelDisplayMode });
                } else {
                    this.drawComparisonBarChart(samples, 'horizontal', { showPercentages, showCounts, sortDescending, labelDisplayMode });
                }
                break;

            case 'bar-vertical':
                if (samples.length === 1) {
                    this.drawVerticalBarChart(samples[0], { showPercentages, showCounts, sortDescending, labelDisplayMode });
                } else {
                    this.drawComparisonBarChart(samples, 'vertical', { showPercentages, showCounts, sortDescending, labelDisplayMode });
                }
                break;
        }
    }

    /**
     * Diagramme en barres horizontales (1 échantillon)
     */
    drawHorizontalBarChart(sample, options) {
        const { data } = sample;
        const { showPercentages, showCounts, sortDescending, labelDisplayMode } = options;

        // Ajuster les marges selon le mode d'affichage des libellés
        const margin = { ...this.margin };
        if (labelDisplayMode === 'above') {
            margin.left = 60; // Moins de marge car pas d'axe Y avec libellés
        }
        const innerWidth = this.width - margin.left - margin.right;

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
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(sortedData, d => d.count)])
            .range([0, innerWidth])
            .nice();

        const yScale = d3.scaleBand()
            .domain(sortedData.map(d => d.label))
            .range([0, this.innerHeight])
            .padding(labelDisplayMode === 'above' ? 0.4 : 0.2);

        // Obtenir les couleurs
        const colorScale = this.getColorScale();

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

        // Labels à droite des barres (effectifs/pourcentages)
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

        // Affichage des libellés selon le mode choisi
        if (labelDisplayMode === 'above') {
            // Mode "au-dessus" : libellés au-dessus de chaque barre
            g.selectAll('.label-above')
                .data(sortedData)
                .join('text')
                .attr('class', 'label-above')
                .attr('x', 5)
                .attr('y', d => yScale(d.label) - 5)
                .attr('font-size', '11px')
                .attr('font-weight', '500')
                .attr('fill', '#495057')
                .text(d => d.label);

            // Axe Y sans libellés
            const yAxis = d3.axisLeft(yScale).tickFormat('');
            g.append('g')
                .attr('class', 'y-axis')
                .call(yAxis);

        } else if (labelDisplayMode === 'multiline') {
            // Mode multi-lignes : découper le texte
            const yAxis = d3.axisLeft(yScale).tickFormat('');
            g.append('g')
                .attr('class', 'y-axis')
                .call(yAxis);

            // Ajouter les libellés multi-lignes manuellement
            sortedData.forEach(d => {
                const textGroup = g.append('text')
                    .attr('x', -10)
                    .attr('y', yScale(d.label) + yScale.bandwidth() / 2)
                    .attr('text-anchor', 'end')
                    .attr('font-size', '11px')
                    .attr('font-weight', '500')
                    .attr('fill', '#495057')
                    .style('cursor', 'pointer')
                    .on('mouseover', (event) => this.showLabelTooltip(event, d.label))
                    .on('mousemove', (event) => this.positionTooltip(event))
                    .on('mouseout', () => this.hideTooltip());

                // Découper en lignes de ~15 caractères max
                const words = d.label.split(' ');
                let lines = [];
                let currentLine = '';

                words.forEach(word => {
                    if ((currentLine + ' ' + word).trim().length <= 18) {
                        currentLine = (currentLine + ' ' + word).trim();
                    } else {
                        if (currentLine) lines.push(currentLine);
                        currentLine = word;
                    }
                });
                if (currentLine) lines.push(currentLine);

                // Limiter à 2 lignes max
                if (lines.length > 2) {
                    lines = [lines[0], lines[1].substring(0, 15) + '...'];
                }

                lines.forEach((line, i) => {
                    textGroup.append('tspan')
                        .attr('x', -10)
                        .attr('dy', i === 0 ? `${-0.3 * (lines.length - 1)}em` : '1.1em')
                        .text(line);
                });
            });

        } else {
            // Mode tronqué (par défaut) : avec tooltip
            const yAxis = d3.axisLeft(yScale)
                .tickFormat(d => this.truncateLabel(d));

            const yAxisGroup = g.append('g')
                .attr('class', 'y-axis')
                .call(yAxis);

            yAxisGroup.selectAll('text')
                .attr('font-size', '12px')
                .attr('font-weight', '500')
                .style('cursor', 'pointer')
                .on('mouseover', (event, label) => {
                    if (label.length > this.maxLabelLength) {
                        this.showLabelTooltip(event, label);
                    }
                })
                .on('mousemove', (event) => this.positionTooltip(event))
                .on('mouseout', () => this.hideTooltip());
        }

        // Titre de l'axe X
        g.append('text')
            .attr('x', innerWidth / 2)
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
        const { data } = sample;
        const { showPercentages, showCounts, sortDescending, labelDisplayMode } = options;

        // Ajuster les marges selon le mode d'affichage des libellés
        const margin = { top: 30, right: 40, bottom: 100, left: 70 };
        if (labelDisplayMode === 'above') {
            margin.bottom = 50; // Moins de marge car pas de labels en bas
            margin.top = 50;    // Plus de marge en haut pour les labels
        } else if (labelDisplayMode === 'multiline') {
            margin.bottom = 120; // Plus de marge pour les labels multi-lignes
        }
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
            .padding(labelDisplayMode === 'above' ? 0.3 : 0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(sortedData, d => d.count)])
            .range([innerHeight, 0])
            .nice();

        // Obtenir les couleurs
        const colorScale = this.getColorScale();

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

        // Labels au-dessus des barres (effectifs/pourcentages)
        if (showCounts || showPercentages) {
            const labelYOffset = labelDisplayMode === 'above' ? -25 : -5;
            g.selectAll('.bar-label')
                .data(sortedData)
                .join('text')
                .attr('class', 'bar-label')
                .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2)
                .attr('y', d => yScale(d.count) + labelYOffset)
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

        // Affichage des libellés selon le mode choisi
        if (labelDisplayMode === 'above') {
            // Mode "au-dessus" : libellés au-dessus de chaque barre
            g.selectAll('.label-above')
                .data(sortedData)
                .join('text')
                .attr('class', 'label-above')
                .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2)
                .attr('y', d => yScale(d.count) - 8)
                .attr('text-anchor', 'middle')
                .attr('font-size', '10px')
                .attr('font-weight', '500')
                .attr('fill', '#495057')
                .text(d => this.truncateLabel(d.label, 15))
                .style('cursor', 'pointer')
                .on('mouseover', (event, d) => {
                    if (d.label.length > 15) {
                        this.showLabelTooltip(event, d.label);
                    }
                })
                .on('mousemove', (event) => this.positionTooltip(event))
                .on('mouseout', () => this.hideTooltip());

            // Axe X sans libellés
            const xAxis = d3.axisBottom(xScale).tickFormat('');
            g.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(0,${innerHeight})`)
                .call(xAxis);

        } else if (labelDisplayMode === 'multiline') {
            // Mode multi-lignes : libellés horizontaux avec retour à la ligne
            const xAxis = d3.axisBottom(xScale).tickFormat('');
            g.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(0,${innerHeight})`)
                .call(xAxis);

            // Ajouter les libellés multi-lignes manuellement
            sortedData.forEach(d => {
                const textGroup = g.append('text')
                    .attr('x', xScale(d.label) + xScale.bandwidth() / 2)
                    .attr('y', innerHeight + 15)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '10px')
                    .attr('font-weight', '500')
                    .attr('fill', '#495057')
                    .style('cursor', 'pointer')
                    .on('mouseover', (event) => this.showLabelTooltip(event, d.label))
                    .on('mousemove', (event) => this.positionTooltip(event))
                    .on('mouseout', () => this.hideTooltip());

                // Découper en lignes de ~12 caractères max (plus court pour vertical)
                const words = d.label.split(' ');
                let lines = [];
                let currentLine = '';

                words.forEach(word => {
                    if ((currentLine + ' ' + word).trim().length <= 12) {
                        currentLine = (currentLine + ' ' + word).trim();
                    } else {
                        if (currentLine) lines.push(currentLine);
                        currentLine = word.length > 12 ? word.substring(0, 10) + '...' : word;
                    }
                });
                if (currentLine) lines.push(currentLine);

                // Limiter à 3 lignes max
                if (lines.length > 3) {
                    lines = lines.slice(0, 2);
                    lines.push('...');
                }

                lines.forEach((line, i) => {
                    textGroup.append('tspan')
                        .attr('x', xScale(d.label) + xScale.bandwidth() / 2)
                        .attr('dy', i === 0 ? '0' : '1.1em')
                        .text(line);
                });
            });

        } else {
            // Mode tronqué (par défaut) : avec rotation et tooltip
            const xAxis = d3.axisBottom(xScale)
                .tickFormat(d => this.truncateLabel(d));

            const xAxisGroup = g.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(0,${innerHeight})`)
                .call(xAxis);

            xAxisGroup.selectAll('text')
                .attr('transform', 'rotate(-45)')
                .attr('text-anchor', 'end')
                .attr('dx', '-0.5em')
                .attr('dy', '0.5em')
                .attr('font-size', '11px')
                .attr('font-weight', '500')
                .style('cursor', 'pointer')
                .on('mouseover', (event, label) => {
                    if (label.length > this.maxLabelLength) {
                        this.showLabelTooltip(event, label);
                    }
                })
                .on('mousemove', (event) => this.positionTooltip(event))
                .on('mouseout', () => this.hideTooltip());
        }

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
        const { showPercentages, showCounts, sortDescending, labelDisplayMode } = options;

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
            this.drawHorizontalComparisonChart(samples, sortedLabels, { showPercentages, showCounts, labelDisplayMode });
        } else {
            this.drawVerticalComparisonChart(samples, sortedLabels, { showPercentages, showCounts, labelDisplayMode });
        }
    }

    /**
     * Barres horizontales groupées
     */
    drawHorizontalComparisonChart(samples, labels, options) {
        const { showPercentages, showCounts, labelDisplayMode = 'truncate' } = options;

        // Ajuster les marges selon le mode d'affichage
        const margin = { ...this.margin };
        if (labelDisplayMode === 'above') {
            margin.left = 60;
        }
        const innerWidth = this.width - margin.left - margin.right;

        // Créer le groupe principal
        const g = this.svg
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `translate(${margin.left},${this.margin.top})`);

        // Trouver le maximum pour l'échelle
        const maxCount = d3.max(samples.flatMap(s => s.data.map(d => d.count)));

        // Échelles
        const xScale = d3.scaleLinear()
            .domain([0, maxCount])
            .range([0, innerWidth])
            .nice();

        const yScale = d3.scaleBand()
            .domain(labels)
            .range([0, this.innerHeight])
            .padding(labelDisplayMode === 'above' ? 0.4 : 0.3);

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

        // Affichage des libellés selon le mode
        if (labelDisplayMode === 'above') {
            // Labels au-dessus de chaque groupe de barres
            labels.forEach(label => {
                g.append('text')
                    .attr('class', 'label-above')
                    .attr('x', 5)
                    .attr('y', yScale(label) - 3)
                    .attr('font-size', '10px')
                    .attr('font-weight', '500')
                    .attr('fill', '#495057')
                    .text(label);
            });

            // Axe Y sans libellés
            const yAxis = d3.axisLeft(yScale).tickFormat('');
            g.append('g').attr('class', 'y-axis').call(yAxis);

        } else if (labelDisplayMode === 'multiline') {
            // Axe Y sans libellés
            const yAxis = d3.axisLeft(yScale).tickFormat('');
            g.append('g').attr('class', 'y-axis').call(yAxis);

            // Labels multi-lignes
            labels.forEach(label => {
                const textGroup = g.append('text')
                    .attr('x', -10)
                    .attr('y', yScale(label) + yScale.bandwidth() / 2)
                    .attr('text-anchor', 'end')
                    .attr('font-size', '10px')
                    .attr('font-weight', '500')
                    .attr('fill', '#495057')
                    .style('cursor', 'pointer')
                    .on('mouseover', (event) => this.showLabelTooltip(event, label))
                    .on('mousemove', (event) => this.positionTooltip(event))
                    .on('mouseout', () => this.hideTooltip());

                const words = label.split(' ');
                let lines = [];
                let currentLine = '';
                words.forEach(word => {
                    if ((currentLine + ' ' + word).trim().length <= 18) {
                        currentLine = (currentLine + ' ' + word).trim();
                    } else {
                        if (currentLine) lines.push(currentLine);
                        currentLine = word;
                    }
                });
                if (currentLine) lines.push(currentLine);
                if (lines.length > 2) lines = [lines[0], lines[1].substring(0, 15) + '...'];

                lines.forEach((line, i) => {
                    textGroup.append('tspan')
                        .attr('x', -10)
                        .attr('dy', i === 0 ? `${-0.3 * (lines.length - 1)}em` : '1.1em')
                        .text(line);
                });
            });

        } else {
            // Mode tronqué (par défaut)
            const yAxis = d3.axisLeft(yScale)
                .tickFormat(d => this.truncateLabel(d));

            const yAxisGroup = g.append('g')
                .attr('class', 'y-axis')
                .call(yAxis);

            yAxisGroup.selectAll('text')
                .attr('font-size', '12px')
                .attr('font-weight', '500')
                .style('cursor', 'pointer')
                .on('mouseover', (event, label) => {
                    if (label.length > this.maxLabelLength) {
                        this.showLabelTooltip(event, label);
                    }
                })
                .on('mousemove', (event) => this.positionTooltip(event))
                .on('mouseout', () => this.hideTooltip());
        }

        // Titre de l'axe X
        g.append('text')
            .attr('x', innerWidth / 2)
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
        const { showPercentages, showCounts, labelDisplayMode = 'truncate' } = options;

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

        // Affichage des libellés selon le mode
        if (labelDisplayMode === 'above') {
            // Labels au-dessus de chaque groupe
            labels.forEach(label => {
                g.append('text')
                    .attr('class', 'label-above')
                    .attr('x', xScale(label) + xScale.bandwidth() / 2)
                    .attr('y', -5)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '9px')
                    .attr('font-weight', '500')
                    .attr('fill', '#495057')
                    .text(this.truncateLabel(label, 12))
                    .style('cursor', 'pointer')
                    .on('mouseover', (event) => {
                        if (label.length > 12) this.showLabelTooltip(event, label);
                    })
                    .on('mousemove', (event) => this.positionTooltip(event))
                    .on('mouseout', () => this.hideTooltip());
            });

            const xAxis = d3.axisBottom(xScale).tickFormat('');
            g.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(0,${innerHeight})`)
                .call(xAxis);

        } else if (labelDisplayMode === 'multiline') {
            const xAxis = d3.axisBottom(xScale).tickFormat('');
            g.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(0,${innerHeight})`)
                .call(xAxis);

            // Labels multi-lignes
            labels.forEach(label => {
                const textGroup = g.append('text')
                    .attr('x', xScale(label) + xScale.bandwidth() / 2)
                    .attr('y', innerHeight + 15)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '9px')
                    .attr('font-weight', '500')
                    .attr('fill', '#495057')
                    .style('cursor', 'pointer')
                    .on('mouseover', (event) => this.showLabelTooltip(event, label))
                    .on('mousemove', (event) => this.positionTooltip(event))
                    .on('mouseout', () => this.hideTooltip());

                const words = label.split(' ');
                let lines = [];
                let currentLine = '';
                words.forEach(word => {
                    if ((currentLine + ' ' + word).trim().length <= 10) {
                        currentLine = (currentLine + ' ' + word).trim();
                    } else {
                        if (currentLine) lines.push(currentLine);
                        currentLine = word.length > 10 ? word.substring(0, 8) + '..' : word;
                    }
                });
                if (currentLine) lines.push(currentLine);
                if (lines.length > 3) lines = lines.slice(0, 2).concat(['...']);

                lines.forEach((line, i) => {
                    textGroup.append('tspan')
                        .attr('x', xScale(label) + xScale.bandwidth() / 2)
                        .attr('dy', i === 0 ? '0' : '1em')
                        .text(line);
                });
            });

        } else {
            // Mode tronqué (par défaut)
            const xAxis = d3.axisBottom(xScale)
                .tickFormat(d => this.truncateLabel(d));

            const xAxisGroup = g.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(0,${innerHeight})`)
                .call(xAxis);

            xAxisGroup.selectAll('text')
                .attr('transform', 'rotate(-45)')
                .attr('text-anchor', 'end')
                .attr('dx', '-0.5em')
                .attr('dy', '0.5em')
                .attr('font-size', '11px')
                .attr('font-weight', '500')
                .style('cursor', 'pointer')
                .on('mouseover', (event, label) => {
                    if (label.length > this.maxLabelLength) {
                        this.showLabelTooltip(event, label);
                    }
                })
                .on('mousemove', (event) => this.positionTooltip(event))
                .on('mouseout', () => this.hideTooltip());
        }

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
     * Obtient une échelle de couleurs (alternance de deux verts)
     */
    getColorScale() {
        return (index) => index % 2 === 0 ? this.colors.green1 : this.colors.green2;
    }

    /**
     * Affiche le tooltip pour un libellé tronqué
     */
    showLabelTooltip(event, fullLabel) {
        const html = `<div class="tooltip-title">${fullLabel}</div>`;

        this.tooltip
            .html(html)
            .classed('visible', true);

        this.positionTooltip(event);
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
