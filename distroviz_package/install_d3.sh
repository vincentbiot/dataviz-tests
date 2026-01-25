#!/bin/bash

# Script to download D3.js v7.8.5 for distroviz package

echo "Downloading D3.js v7.8.5..."

D3_URL="https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js"
D3_PATH="inst/htmlwidgets/lib/d3-7.8.5/d3.min.js"

# Try primary URL
if curl -f -o "$D3_PATH" "$D3_URL"; then
    echo "✓ D3.js v7.8.5 downloaded successfully to $D3_PATH"

    # Verify file is not empty
    if [ -s "$D3_PATH" ]; then
        FILE_SIZE=$(wc -c < "$D3_PATH")
        echo "  File size: $FILE_SIZE bytes"
        echo ""
        echo "Installation complete! You can now build and install the package."
    else
        echo "✗ Error: Downloaded file is empty"
        exit 1
    fi
else
    echo "✗ Failed to download from primary URL"
    echo ""
    echo "Please download D3.js manually from:"
    echo "  https://d3js.org/d3.v7.min.js"
    echo ""
    echo "And save it to: $D3_PATH"
    exit 1
fi
