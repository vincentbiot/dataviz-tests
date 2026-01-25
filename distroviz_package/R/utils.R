#' Prepare samples data for visualization
#'
#' @param data Input data (vector, list, or data frame)
#' @param colors Color palette for samples
#'
#' @return List of samples with data, stats, colors, and names
#' @keywords internal
prepare_samples <- function(data, colors) {

  # Handle different input types
  if (is.data.frame(data)) {
    samples_list <- prepare_from_dataframe(data)
  } else if (is.list(data) && !is.data.frame(data)) {
    samples_list <- data
  } else if (is.numeric(data)) {
    samples_list <- list("Sample" = data)
  } else {
    stop("data must be a numeric vector, a list of numeric vectors, or a data frame")
  }

  # Validate we have 1 or 2 samples
  if (length(samples_list) > 2) {
    stop("Maximum of 2 samples supported for comparison mode")
  }

  if (length(samples_list) == 0) {
    stop("No data provided")
  }

  # Prepare each sample
  samples <- lapply(seq_along(samples_list), function(i) {
    sample_data <- samples_list[[i]]
    sample_name <- names(samples_list)[i]

    if (is.null(sample_name) || sample_name == "") {
      sample_name <- if (length(samples_list) == 1) {
        "Sample"
      } else {
        paste("Sample", i)
      }
    }

    # Ensure numeric
    if (!is.numeric(sample_data)) {
      stop(paste("Sample", sample_name, "must be numeric"))
    }

    # Remove NAs
    sample_data <- sample_data[!is.na(sample_data)]

    if (length(sample_data) == 0) {
      stop(paste("Sample", sample_name, "has no valid data after removing NAs"))
    }

    # Calculate statistics
    stats <- calculate_stats(sample_data)

    # Assign color
    color <- colors[min(i, length(colors))]

    list(
      data = sample_data,
      stats = stats,
      color = color,
      name = sample_name
    )
  })

  samples
}

#' Prepare samples from data frame
#'
#' @param df Data frame with 'value' and optionally 'group' columns
#'
#' @return Named list of numeric vectors
#' @keywords internal
prepare_from_dataframe <- function(df) {

  # Check for required columns
  if (!"value" %in% names(df)) {
    stop("Data frame must contain a 'value' column")
  }

  # If no group column, treat as single sample
  if (!"group" %in% names(df)) {
    return(list("Sample" = df$value))
  }

  # Split by group
  groups <- unique(df$group)

  if (length(groups) > 2) {
    warning("More than 2 groups found. Only the first 2 will be used.")
    groups <- groups[1:2]
  }

  samples_list <- lapply(groups, function(g) {
    df$value[df$group == g]
  })

  names(samples_list) <- as.character(groups)

  samples_list
}

#' Calculate descriptive statistics
#'
#' @param x Numeric vector
#'
#' @return List of statistics
#' @keywords internal
calculate_stats <- function(x) {

  if (length(x) == 0) {
    return(list(
      n = 0,
      mean = NA,
      median = NA,
      sd = NA,
      min = NA,
      max = NA,
      q1 = NA,
      q3 = NA
    ))
  }

  # Calculate quartiles
  quartiles <- stats::quantile(x, probs = c(0.25, 0.5, 0.75), na.rm = TRUE)

  list(
    n = length(x),
    mean = format(round(mean(x, na.rm = TRUE), 2), nsmall = 2),
    median = format(round(stats::median(x, na.rm = TRUE), 2), nsmall = 2),
    sd = format(round(stats::sd(x, na.rm = TRUE), 2), nsmall = 2),
    min = round(min(x, na.rm = TRUE), 2),
    max = round(max(x, na.rm = TRUE), 2),
    q1 = format(round(quartiles[1], 2), nsmall = 2),
    q3 = format(round(quartiles[3], 2), nsmall = 2)
  )
}
