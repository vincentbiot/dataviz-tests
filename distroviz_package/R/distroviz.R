#' Create an interactive statistical distribution visualization
#'
#' @description
#' Creates interactive visualizations of statistical distributions including
#' box plots, violin plots, and density plots. Supports single sample or
#' comparative (two-sample) visualizations with outlier detection and
#' reference lines.
#'
#' @param data Numeric vector, named list of numeric vectors (for comparison),
#'   or data frame with 'value' and 'group' columns
#' @param chart_type Character string specifying the chart type:
#'   "boxplot", "violinplot", or "density". Default is "boxplot".
#' @param show_points Logical indicating whether to display individual data
#'   points with jitter. Default is FALSE.
#' @param show_outliers Logical indicating whether to include outliers in the
#'   visualization. Outliers are identified using Tukey's fences (1.5 × IQR).
#'   Default is TRUE.
#' @param colors Character vector of colors for samples. Default is
#'   c("#3A9484", "#D276CA").
#' @param establishment_line Optional list with 'name' and 'value' elements
#'   to draw a reference line. Example: list(name = "Target", value = 50).
#'   Default is NULL.
#' @param width Width of the widget in pixels or as a valid CSS unit.
#'   Default is NULL (auto).
#' @param height Height of the widget in pixels or as a valid CSS unit.
#'   Default is NULL (auto).
#' @param elementId Optional element ID for the widget. Default is NULL.
#'
#' @return An htmlwidget object
#'
#' @examples
#' \dontrun{
#' # Simple box plot
#' distroviz(rnorm(100, mean = 50, sd = 10))
#'
#' # Violin plot with data points
#' distroviz(iris$Sepal.Length,
#'           chart_type = "violinplot",
#'           show_points = TRUE)
#'
#' # Compare two distributions
#' distroviz(
#'   data = list(
#'     "Group A" = rnorm(100, mean = 50, sd = 10),
#'     "Group B" = rnorm(100, mean = 55, sd = 8)
#'   ),
#'   chart_type = "boxplot"
#' )
#'
#' # With reference line
#' distroviz(mtcars$mpg,
#'           chart_type = "density",
#'           establishment_line = list(name = "Target", value = 25))
#' }
#'
#' @import htmlwidgets
#' @export
distroviz <- function(data,
                      chart_type = c("boxplot", "violinplot", "density"),
                      show_points = FALSE,
                      show_outliers = TRUE,
                      colors = c("#3A9484", "#D276CA"),
                      establishment_line = NULL,
                      width = NULL,
                      height = NULL,
                      elementId = NULL) {

  # Match chart type
  chart_type <- match.arg(chart_type)

  # Prepare samples data
  samples <- prepare_samples(data, colors)

  # Validate establishment line if provided
  if (!is.null(establishment_line)) {
    if (!is.list(establishment_line) ||
        !all(c("name", "value") %in% names(establishment_line))) {
      stop("establishment_line must be a list with 'name' and 'value' elements")
    }
    if (!is.numeric(establishment_line$value)) {
      stop("establishment_line$value must be numeric")
    }
  }

  # Forward options using x
  x <- list(
    samples = samples,
    chartType = chart_type,
    showDataPoints = show_points,
    showOutliers = show_outliers,
    establishment = establishment_line
  )

  # Create widget
  htmlwidgets::createWidget(
    name = 'distroviz',
    x,
    width = width,
    height = height,
    package = 'distroviz',
    elementId = elementId
  )
}

#' Shiny bindings for distroviz
#'
#' Output and render functions for using distroviz within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a distroviz
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name distroviz-shiny
#'
#' @export
distrovizOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'distroviz', width, height, package = 'distroviz')
}

#' @rdname distroviz-shiny
#' @export
renderDistroviz <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, distrovizOutput, env, quoted = TRUE)
}
