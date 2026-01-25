HTMLWidgets.widget({

  name: 'distroviz',

  type: 'output',

  factory: function(el, width, height) {

    // Create visualization instance
    let viz = new Visualizations(el);

    return {

      renderValue: function(x) {

        // Set dimensions
        if (width) viz.setDimensions(width, height);

        // Draw the visualization
        viz.draw(
          x.samples,
          x.chartType,
          x.showDataPoints,
          x.establishment,
          x.showOutliers
        );
      },

      resize: function(width, height) {

        // Update dimensions and redraw
        if (width) {
          viz.setDimensions(width, height);
          // Note: would need to store x data to redraw
          // For now, resizing will clear the visualization
        }
      }

    };
  }
});
