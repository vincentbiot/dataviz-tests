# distroviz

> Interactive Statistical Distribution Visualizations for R

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Create beautiful, interactive statistical visualizations using D3.js within R. `distroviz` provides an easy-to-use interface for creating box plots, violin plots, and density plots with support for comparative analysis and outlier detection.

## Features

✨ **Three visualization types**: Box plots, Violin plots, and Density plots
🎨 **Interactive tooltips**: Hover over distributions and data points for detailed statistics
📊 **Comparative mode**: Compare two distributions side-by-side with shared Y-axis
🎯 **Outlier detection**: Automatic detection using Tukey's fences (1.5 × IQR)
📍 **Reference lines**: Add establishment/benchmark lines for context
🔍 **Raw data overlay**: Optionally display individual data points with jitter
📱 **Responsive**: Works in RStudio Viewer, RMarkdown, and Shiny apps

## Installation

### Step 1: Clone and prepare the package

```bash
git clone https://github.com/vincentbiot/distroviz_r.git
cd distroviz_r

# Download D3.js v7.8.5 (required dependency)
./install_d3.sh
```

### Step 2: Install the package

```r
# Install from local source
install.packages(".", repos = NULL, type = "source")

# Or using devtools
devtools::install()

# Or install directly from GitHub (after D3.js is added to the repo)
# devtools::install_github("vincentbiot/distroviz_r")
```

**Note**: The package requires D3.js v7.8.5 to be downloaded before installation. The `install_d3.sh` script handles this automatically. If the script fails, you can manually download D3.js from https://d3js.org/d3.v7.min.js and save it to `inst/htmlwidgets/lib/d3-7.8.5/d3.min.js`.

## Quick Start

```r
library(distroviz)

# Simple box plot
distroviz(rnorm(100, mean = 50, sd = 10), chart_type = "boxplot")

# Violin plot with data points
distroviz(iris$Sepal.Length,
          chart_type = "violinplot",
          show_points = TRUE)

# Compare two distributions
distroviz(
  data = list(
    "Group A" = rnorm(100, mean = 50, sd = 10),
    "Group B" = rnorm(100, mean = 55, sd = 8)
  ),
  chart_type = "boxplot",
  show_points = TRUE
)

# With a reference line
distroviz(mtcars$mpg,
          chart_type = "density",
          establishment_line = list(name = "Target", value = 25))
```

## Usage with data.frame

```r
library(dplyr)

# Using a grouped data frame
df <- data.frame(
  value = c(rnorm(100, 50, 10), rnorm(100, 55, 8)),
  group = rep(c("Control", "Treatment"), each = 100)
)

distroviz(df, chart_type = "violinplot", show_points = TRUE)

# With pipes
iris %>%
  pull(Petal.Width) %>%
  distroviz(chart_type = "density")
```

## Chart Types

### Box Plot
Traditional box-and-whisker plot showing quartiles, median, and outliers.

```r
distroviz(mtcars$mpg, chart_type = "boxplot")
```

### Violin Plot
Combines box plot with kernel density estimation for richer distribution visualization.

```r
distroviz(mtcars$mpg, chart_type = "violinplot")
```

### Density Plot
Smooth kernel density estimation curve.

```r
distroviz(mtcars$mpg, chart_type = "density")
```

## Advanced Options

```r
distroviz(
  data = my_data,
  chart_type = "violinplot",      # "boxplot", "violinplot", "density"
  show_points = TRUE,              # Show individual data points
  show_outliers = TRUE,            # Include outliers in visualization
  colors = c("#3A9484", "#D276CA"), # Custom colors for samples
  establishment_line = list(        # Reference line
    name = "National Average",
    value = 50
  ),
  width = 800,                      # Widget width in pixels
  height = 500                      # Widget height in pixels
)
```

## Use in Shiny

```r
library(shiny)
library(distroviz)

ui <- fluidPage(
  titlePanel("Distribution Visualizer"),
  sidebarLayout(
    sidebarPanel(
      selectInput("chart_type", "Chart Type:",
                  choices = c("boxplot", "violinplot", "density")),
      checkboxInput("show_points", "Show Data Points", FALSE)
    ),
    mainPanel(
      distrovizOutput("plot", width = "100%", height = "400px")
    )
  )
)

server <- function(input, output) {
  output$plot <- renderDistroviz({
    distroviz(
      rnorm(200, 50, 10),
      chart_type = input$chart_type,
      show_points = input$show_points
    )
  })
}

shinyApp(ui = ui, server = server)
```

## Use in RMarkdown

````markdown
```{r}
library(distroviz)
distroviz(faithful$eruptions, chart_type = "violinplot", show_points = TRUE)
```
````

## Data Format

`distroviz` accepts data in multiple formats:

- **Numeric vector**: `c(1, 2, 3, 4, 5)`
- **Named list** (for comparison): `list("A" = vec1, "B" = vec2)`
- **Data frame** with `value` and `group` columns

## Statistics Displayed

For each distribution, tooltips show:
- **Mean**: Average value
- **Median**: Middle value
- **Q1**: First quartile (25th percentile)
- **Q3**: Third quartile (75th percentile)

Individual data points show their value and index when hovered.

## Outlier Detection

Outliers are identified using Tukey's fences method:
- **Lower fence**: Q1 - 1.5 × IQR
- **Upper fence**: Q3 + 1.5 × IQR

Points outside these bounds are colored red and can be toggled with `show_outliers = FALSE`.

## Dependencies

- R ≥ 3.5.0
- htmlwidgets ≥ 1.5.0
- D3.js v7 (bundled)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

This package is built on top of:
- [htmlwidgets](https://www.htmlwidgets.org/) for R-to-JavaScript binding
- [D3.js](https://d3js.org/) for interactive visualizations

---

**Author**: Vincent Biot
**Repository**: https://github.com/vincentbiot/distroviz_r
