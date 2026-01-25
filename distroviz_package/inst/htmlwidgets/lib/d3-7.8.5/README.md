# D3.js v7.8.5

This directory should contain `d3.min.js` from D3.js version 7.8.5.

## Installation

To download D3.js v7.8.5, run from the package root directory:

```bash
curl -o inst/htmlwidgets/lib/d3-7.8.5/d3.min.js \
  https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js
```

Or download manually from:
- https://d3js.org/d3.v7.min.js
- https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js

## Alternative: Using CDN (Development)

For development, you can modify `distroviz.yaml` to use a CDN instead:

```yaml
dependencies:
  - name: d3
    version: 7.8.5
    src: https://cdn.jsdelivr.net/npm/d3@7.8.5/dist
    script: d3.min.js
```

## License

D3.js is licensed under the ISC License.
Copyright 2010-2021 Mike Bostock
