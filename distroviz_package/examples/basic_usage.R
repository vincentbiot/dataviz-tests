# Basic usage examples for distroviz package

library(distroviz)

# Example 1: Simple box plot
# --------------------------
set.seed(123)
data1 <- rnorm(100, mean = 50, sd = 10)
distroviz(data1, chart_type = "boxplot")


# Example 2: Violin plot with data points
# ----------------------------------------
distroviz(iris$Sepal.Length,
          chart_type = "violinplot",
          show_points = TRUE)


# Example 3: Density plot
# ------------------------
distroviz(mtcars$mpg,
          chart_type = "density",
          show_points = FALSE)


# Example 4: Comparing two distributions
# ---------------------------------------
distroviz(
  data = list(
    "Control" = rnorm(100, mean = 50, sd = 10),
    "Treatment" = rnorm(100, mean = 55, sd = 8)
  ),
  chart_type = "boxplot",
  show_points = TRUE
)


# Example 5: Using a data frame with groups
# ------------------------------------------
df <- data.frame(
  value = c(rnorm(100, 50, 10), rnorm(100, 55, 8)),
  group = rep(c("Group A", "Group B"), each = 100)
)

distroviz(df, chart_type = "violinplot", show_points = TRUE)


# Example 6: With reference line
# -------------------------------
distroviz(
  mtcars$mpg,
  chart_type = "density",
  establishment_line = list(name = "Target", value = 25),
  show_points = FALSE
)


# Example 7: Custom colors
# -------------------------
distroviz(
  data = list(
    "Sample A" = rnorm(150, 60, 12),
    "Sample B" = rnorm(150, 65, 10)
  ),
  chart_type = "violinplot",
  colors = c("#FF6B6B", "#4ECDC4"),
  show_points = FALSE
)


# Example 8: Hiding outliers
# ---------------------------
# Generate data with outliers
data_with_outliers <- c(rnorm(95, 50, 5), c(20, 25, 75, 80, 85))

distroviz(
  data_with_outliers,
  chart_type = "boxplot",
  show_outliers = FALSE  # Hide outliers
)


# Example 9: Using with dplyr pipes
# ----------------------------------
library(dplyr)

iris %>%
  pull(Petal.Width) %>%
  distroviz(chart_type = "density")


# Example 10: Faithful geyser data
# ---------------------------------
distroviz(
  faithful$eruptions,
  chart_type = "violinplot",
  show_points = TRUE,
  establishment_line = list(name = "Average", value = mean(faithful$eruptions))
)
