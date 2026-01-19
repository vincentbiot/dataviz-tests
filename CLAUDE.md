# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a vanilla JavaScript web application for testing and comparing statistical data visualizations. It generates simulated datasets with various statistical distributions and displays them using D3.js visualizations. The application supports single-sample visualization and two-sample comparison mode.

## Running the Application

No build process or dependencies installation required. Simply open `index.html` in a web browser:

```bash
# Using Python's built-in server
python -m http.server 8000

# Or any other local server
# Then navigate to http://localhost:8000
```

## Architecture

### Core Components

The application is built with three main JavaScript classes that work together:

1. **DataGenerator** (`js/dataGenerator.js`)
   - Generates simulated datasets with different statistical distributions
   - Supports: normal, uniform, bimodal, skewed-right, skewed-left distributions
   - Implements Box-Muller transform for normal distribution generation
   - Calculates descriptive statistics (mean, median, std dev, quartiles)
   - Uses D3.js statistical functions for calculations

2. **Visualizations** (`js/visualizations.js`)
   - Renders D3.js visualizations on SVG canvas
   - Three chart types: Box Plot, Violin Plot, Density Plot
   - Handles both single-sample and comparison modes
   - Manages interactive tooltips for data points and distribution areas
   - Implements performance optimizations for large datasets (>2000 points use sampling)
   - Uses shared Y-axis scale for fair comparison in comparison mode

3. **App** (`js/app.js`)
   - Main application controller and event handler
   - Manages UI state and comparison mode toggling
   - Coordinates between DataGenerator and Visualizations
   - Handles two separate DataGenerator instances for comparison mode
   - Validates parameters before generating data
   - Manages SVG export functionality

### Data Flow

1. User adjusts controls → `app.js` validates parameters
2. `generateAndVisualize()` called → creates DataGenerator instance(s)
3. DataGenerator produces data array and statistics
4. Statistics update in UI panels
5. Visualizations.draw() receives samples array with data, stats, colors, and names
6. D3.js renders appropriate chart type with optional data points overlay

### Comparison Mode

When comparison mode is enabled (`comparisonMode = true`):
- Two DataGenerator instances (`dataGenerator1`, `dataGenerator2`) generate independent datasets
- Visualizations.draw() receives array of two samples with distinct colors
- Charts display both samples side-by-side with shared Y-axis for proper comparison
- Statistics panels show separate metrics for each sample
- Legend displays sample colors

### Visualization Layout Patterns

All three chart types follow consistent layout logic:
- **Without data points**: Distribution shape centered in viewport
- **With data points enabled**: Left section shows raw data with jitter, right section shows distribution
- **Comparison mode**: Samples positioned symmetrically with clear visual separation
- Separator lines (dashed) visually divide data points from distributions

### Performance Considerations

- Data point rendering uses sampling for datasets >2000 points (shows 2000/N indicator)
- Outlier detection uses 1.5 × IQR rule (Tukey's fences)
- Interactive hover only enabled for outliers when dataset >2000 points
- Point radius and opacity adjust based on dataset size
- Density plots use 40-50 bins for kernel density estimation

## Key Technical Details

### D3.js Version
Uses D3.js v7 loaded from CDN. All visualizations use D3 v7 API patterns (e.g., `.join()` for data binding).

### Statistical Calculations
All statistics use D3 functions: `d3.mean()`, `d3.median()`, `d3.deviation()`, `d3.quantile()`, `d3.bin()`.

### Outlier Generation
Outliers are generated outside the normal range by ±30% of the range, split evenly between high and low outliers.

### Color Scheme
- Sample 1: `#4682b4` (steel blue)
- Sample 2: `#e67e22` (orange)
- Outliers: `#e74c3c` (red)

### Coordinate System
- SVG uses standard D3 margin convention: `{top: 30, right: 30, bottom: 50, left: 60}`
- Y-axis maps data values (inverted: larger values at top)
- X-axis positioning is relative, calculated based on mode and data point visibility

## Making Changes

### Adding a New Distribution Type

1. Add generation method to `DataGenerator` class (e.g., `exponentialRandom()`)
2. Add case to switch statement in `generate()` method
3. Add option to both `<select id="distribution1">` and `<select id="distribution2">` in `index.html`
4. If distribution needs parameters (like mean/stdDev), extend parameter visibility logic

### Adding a New Chart Type

1. Create new method in `Visualizations` class (e.g., `drawHistogram()`)
2. Add case to switch statement in `draw()` method
3. Add option to `<select id="chartType">` in `index.html`
4. Add title mapping to `chartTitles` object in `app.js`
5. Follow existing layout patterns for single/comparison mode and data points positioning

### Modifying Statistics Display

Statistics are calculated in `DataGenerator.getStats()` and displayed via `updateStats()` in `app.js`. Both sample panels must be updated if adding new metrics.

## Files Not to Modify

The `divers/` directory contains miscellaneous files not part of the main application.

## Language

All UI text, comments, and user-facing content are in French. Maintain this convention when making changes.
