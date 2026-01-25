# Shiny application example for distroviz

library(shiny)
library(distroviz)

ui <- fluidPage(
  titlePanel("Distribution Visualizer"),

  sidebarLayout(
    sidebarPanel(
      h4("Data Parameters"),
      sliderInput("n",
                  "Sample Size:",
                  min = 50,
                  max = 500,
                  value = 100,
                  step = 10),

      sliderInput("mean",
                  "Mean:",
                  min = 0,
                  max = 100,
                  value = 50,
                  step = 1),

      sliderInput("sd",
                  "Standard Deviation:",
                  min = 1,
                  max = 20,
                  value = 10,
                  step = 0.5),

      hr(),

      h4("Visualization Options"),
      selectInput("chart_type",
                  "Chart Type:",
                  choices = c("Box Plot" = "boxplot",
                              "Violin Plot" = "violinplot",
                              "Density Plot" = "density"),
                  selected = "boxplot"),

      checkboxInput("show_points",
                    "Show Data Points",
                    value = FALSE),

      checkboxInput("show_outliers",
                    "Show Outliers",
                    value = TRUE),

      checkboxInput("show_reference",
                    "Show Reference Line",
                    value = FALSE),

      conditionalPanel(
        condition = "input.show_reference == true",
        numericInput("reference_value",
                     "Reference Value:",
                     value = 50,
                     min = 0,
                     max = 100)
      ),

      hr(),

      actionButton("regenerate",
                   "Generate New Data",
                   class = "btn-primary")
    ),

    mainPanel(
      distrovizOutput("plot", width = "100%", height = "500px"),

      hr(),

      h4("Summary Statistics"),
      verbatimTextOutput("stats")
    )
  )
)

server <- function(input, output, session) {

  # Reactive data generation
  sample_data <- reactive({
    # Trigger on button click or initial load
    input$regenerate

    # Generate data
    set.seed(Sys.time())  # Random seed each time
    rnorm(input$n, mean = input$mean, sd = input$sd)
  })

  # Render visualization
  output$plot <- renderDistroviz({
    data <- sample_data()

    # Prepare establishment line
    est_line <- NULL
    if (input$show_reference) {
      est_line <- list(
        name = "Reference",
        value = input$reference_value
      )
    }

    # Create visualization
    distroviz(
      data = data,
      chart_type = input$chart_type,
      show_points = input$show_points,
      show_outliers = input$show_outliers,
      establishment_line = est_line
    )
  })

  # Display statistics
  output$stats <- renderPrint({
    data <- sample_data()

    cat("Sample Size:", length(data), "\n")
    cat("Mean:", round(mean(data), 2), "\n")
    cat("Median:", round(median(data), 2), "\n")
    cat("SD:", round(sd(data), 2), "\n")
    cat("Min:", round(min(data), 2), "\n")
    cat("Max:", round(max(data), 2), "\n")

    # Quartiles
    q <- quantile(data, probs = c(0.25, 0.75))
    cat("Q1:", round(q[1], 2), "\n")
    cat("Q3:", round(q[2], 2), "\n")

    # Outliers count
    iqr <- IQR(data)
    outliers <- data[data < (q[1] - 1.5 * iqr) | data > (q[2] + 1.5 * iqr)]
    cat("Outliers:", length(outliers), "\n")
  })
}

# Run the application
shinyApp(ui = ui, server = server)
