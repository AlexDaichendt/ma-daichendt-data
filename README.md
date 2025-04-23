# Latency Visualization App

A web-based tool for visualizing network latency data through interactive charts.
Created for the Master thesis of Alexander Daichendt: `Analysis and Modeling of Effects of Hardware Architecture on Network Performance`

Live version hosted on Github: https://alexdaichendt.github.io/ma-daichendt-data/

## Features

- Scatter plot visualization of latency metrics
- Filtering by CPU model, packet size, working set size, and wait cycles
- Configurable X and Y axes
- Linear and logarithmic scale options
- Maximum latency threshold filtering
- Statistical summaries

## Setup

1. Clone the repository
2. Ensure your latency data is in `data/latency_data.json`
3. Set up a local server (see below)

## Running Locally

### Using Python

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Using Node.js

```bash
# Install http-server
npm install -g http-server

# Run server
http-server -p 8000
```

Then access the application at `http://localhost:8000`

## Data Format

The application expects JSON data with the following structure:

```json
[
  {
    "packet_rate": 100,
    "packet_size": 64,
    "wait_cycles": 0,
    "working_set_size": 4096,
    "cpu_model": "CPU Model Name",
    "p25": 10.5,
    "p50": 12.3,
    "p75": 14.8,
    "p95": 18.2,
    "p99": 22.6,
    "p99_9": 28.9,
    "p99_99": 35.4,
    "p99_999": 42.1,
    "p99_9999": 48.7
  }
]
```

## Troubleshooting

- If no data appears, check browser console for errors
- Ensure the data file is correctly formatted JSON
- Verify your local server is running properly
