let scatterChart = null;
let allData = []; // Will hold all the data loaded from JSON

const colors = [
  "rgba(54, 162, 235, 0.7)",
  "rgba(255, 99, 132, 0.7)",
  "rgba(75, 192, 192, 0.7)",
  "rgba(255, 206, 86, 0.7)",
  "rgba(153, 102, 255, 0.7)",
  "rgba(255, 159, 64, 0.7)",
  "rgba(199, 199, 199, 0.7)",
  "rgba(83, 102, 255, 0.7)",
  "rgba(40, 159, 64, 0.7)",
  "rgba(210, 199, 199, 0.7)",
];

// Axis label mappings
const axisLabels = {
  packet_rate: "Packet Rate",
  packet_size: "Packet Size (bytes)",
  wait_cycles: "Wait Cycles",
  working_set_size: "Working Set Size (bytes)",
  p25: "Latency (P25)",
  p50: "Latency (P50)",
  p75: "Latency (P75)",
  p95: "Latency (P95)",
  p99: "Latency (P99)",
  p99_9: "Latency (P99.9)",
  p99_99: "Latency (P99.99)",
  p99_999: "Latency (P99.999)",
  p99_9999: "Latency (P99.9999)",
};

// Load initial data and populate dropdowns
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Load the main dataset
    const response = await fetch("data/latency_data.json");
    if (!response.ok) throw new Error("Failed to load data");
    allData = await response.json();

    // Extract unique values for dropdowns
    const cpuModels = [...new Set(allData.map((item) => item.cpu_model))];
    const packetSizes = [
      ...new Set(allData.map((item) => item.packet_size)),
    ].sort((a, b) => a - b);
    const workingSetSizes = [
      ...new Set(allData.map((item) => item.working_set_size)),
    ].sort((a, b) => a - b);
    const waitCycles = [
      ...new Set(allData.map((item) => item.wait_cycles)),
    ].sort((a, b) => a - b);

    // Populate dropdowns
    populateDropdown("cpu-select", cpuModels);
    populateDropdown("packet-size-select", packetSizes);
    populateDropdown("wss-select", workingSetSizes);
    populateDropdown("wait-cycles-select", waitCycles);

    // Add event listeners
    document
      .getElementById("x-axis-select")
      .addEventListener("change", handleAxisChange);
    document
      .getElementById("y-axis-select")
      .addEventListener("change", updateChart);
    document
      .getElementById("cpu-select")
      .addEventListener("change", updateChart);
    document
      .getElementById("packet-size-select")
      .addEventListener("change", updateChart);
    document
      .getElementById("wss-select")
      .addEventListener("change", updateChart);
    document
      .getElementById("wait-cycles-select")
      .addEventListener("change", updateChart);
    document
      .getElementById("x-log-scale")
      .addEventListener("change", updateChart);
    document
      .getElementById("y-log-scale")
      .addEventListener("change", updateChart);

    // Load initial chart
    updateChart();
  } catch (error) {
    console.error("Initialization error:", error);
    alert("Failed to load the data. Please check the console for details.");
  }
});

// Populate dropdown with options from array
function populateDropdown(elementId, items) {
  const dropdown = document.getElementById(elementId);

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    dropdown.appendChild(option);
  });
}

// Handle special logic when X-axis changes
function handleAxisChange() {
  const xAxis = document.getElementById("x-axis-select").value;

  // If X-axis is packet_size, disable packet size filter
  const packetSizeSelect = document.getElementById("packet-size-select");
  packetSizeSelect.disabled = xAxis === "packet_size";
  if (xAxis === "packet_size") packetSizeSelect.value = "";

  // If X-axis is working_set_size, disable working set size filter
  const wssSelect = document.getElementById("wss-select");
  wssSelect.disabled = xAxis === "working_set_size";
  if (xAxis === "working_set_size") wssSelect.value = "";

  const waitCyclesSelect = document.getElementById("wait-cycles-select");
  waitCyclesSelect.disabled = xAxis === "wait_cycles";
  if (xAxis === "wait_cycles") waitCyclesSelect.value = "";

  updateChart();
}

// Update the chart based on selected filters and axes
function updateChart() {
  const xAxis = document.getElementById("x-axis-select").value;
  const yAxis = document.getElementById("y-axis-select").value;
  const cpuModel = document.getElementById("cpu-select").value;
  const packetSize = document.getElementById("packet-size-select").value;
  const workingSetSize = document.getElementById("wss-select").value;
  const waitCycles = document.getElementById("wait-cycles-select").value;

  // Filter data based on selections
  let filteredData = allData.filter((item) => {
    if (cpuModel && item.cpu_model !== cpuModel) return false;
    if (packetSize && xAxis !== "packet_size" && item.packet_size != packetSize)
      return false;
    if (
      workingSetSize &&
      xAxis !== "working_set_size" &&
      item.working_set_size != workingSetSize
    )
      return false;
    if (waitCycles && xAxis !== "wait_cycles" && item.wait_cycles != waitCycles)
      return false;
    return true;
  });

  // Transform data for charting
  let chartData = filteredData.map((item) => ({
    ...item,
    x: item[xAxis],
    y: item[yAxis],
  }));

  renderChart(chartData, xAxis, yAxis);
  updateStats(chartData, yAxis);
}

// Render the scatter plot
function renderChart(data, xAxis, yAxis) {
  const ctx = document.getElementById("scatter-chart").getContext("2d");

  // Check if log scale is enabled
  const xLogScale = document.getElementById("x-log-scale").checked;
  const yLogScale = document.getElementById("y-log-scale").checked;

  // Group the data by CPU model
  const groupedData = {};
  data.forEach((item) => {
    if (!groupedData[item.cpu_model]) {
      groupedData[item.cpu_model] = [];
    }

    // Only include points with positive values when using log scale
    if ((xLogScale && item.x <= 0) || (yLogScale && item.y <= 0)) {
      console.warn(
        `Skipping point with non-positive value (${item.x}, ${item.y}) for log scale`,
      );
      return;
    }

    groupedData[item.cpu_model].push({
      x: item.x,
      y: item.y,
      // Store all the original data for the tooltip
      originalData: item,
    });
  });

  // Prepare datasets for the chart
  const datasets = Object.keys(groupedData).map((cpuModel, index) => {
    return {
      label: cpuModel,
      data: groupedData[cpuModel],
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length].replace("0.7", "1"),
      borderWidth: 1,
      pointRadius: 5,
      pointHoverRadius: 8,
    };
  });

  // Get readable axis labels
  const xAxisLabel = axisLabels[xAxis] || xAxis;
  const yAxisLabel = axisLabels[yAxis] || yAxis;

  // Destroy existing chart if it exists
  if (scatterChart) {
    scatterChart.destroy();
  }

  // Function to format percentile keys for display
  const formatKey = (key) => {
    if (key.startsWith("p")) {
      return key.replace("p", "P").replace("_", ".");
    }
    return key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Create the new chart
  scatterChart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: xLogScale ? "logarithmic" : "linear",
          position: "bottom",
          title: {
            display: true,
            text: xAxisLabel,
          },
          // Only set min to 0 for linear scale
          min: xLogScale ? undefined : 0,
        },
        y: {
          type: yLogScale ? "logarithmic" : "linear",
          title: {
            display: true,
            text: yAxisLabel,
          },
          // Only set min to 0 for linear scale
          min: yLogScale ? undefined : 0,
        },
      },
      plugins: {
        title: {
          display: true,
          text: `${yAxisLabel} vs ${xAxisLabel}`,
          font: {
            size: 16,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const data = context.raw.originalData;
              let tooltipLines = [`${context.dataset.label}`];

              // Add highlighted X and Y values first
              tooltipLines.push(`${xAxisLabel}: ${context.parsed.x}`);
              tooltipLines.push(
                `${yAxisLabel}: ${context.parsed.y.toFixed(2)}`,
              );

              // Then add all other parameters
              const excludeKeys = ["id", "x", "y", "cpu_model", xAxis, yAxis];

              Object.keys(data).forEach((key) => {
                if (!excludeKeys.includes(key)) {
                  // Format percentile keys for better readability
                  const displayKey = formatKey(key);

                  // Format the value appropriately
                  let value = data[key];
                  if (typeof value === "number" && key.startsWith("p")) {
                    value = value.toFixed(2);
                  }

                  tooltipLines.push(`${displayKey}: ${value}`);
                }
              });

              return tooltipLines;
            },
            title: function () {
              return ""; // Remove the default title
            },
          },
          displayColors: true,
          padding: 10,
          bodySpacing: 4,
          multiKeyBackground: "#00000000",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
        },
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

// Update the statistics panel
function updateStats(data, yAxis) {
  const statsContent = document.getElementById("stats-content");
  statsContent.innerHTML = "";

  // Group data by CPU model
  const groupedData = {};
  data.forEach((item) => {
    if (!groupedData[item.cpu_model]) {
      groupedData[item.cpu_model] = [];
    }
    groupedData[item.cpu_model].push(item.y);
  });

  // Calculate statistics for each group
  Object.keys(groupedData).forEach((cpuModel) => {
    const values = groupedData[cpuModel];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    // Create a stat card
    const statItem = document.createElement("div");
    statItem.className = "stat-item";

    statItem.innerHTML = `
      <h4>${cpuModel}</h4>
      <p>Min: ${min.toFixed(2)}</p>
      <p>Max: ${max.toFixed(2)}</p>
      <p>Avg: ${avg.toFixed(2)}</p>
      <p>Count: ${values.length}</p>
    `;

    statsContent.appendChild(statItem);
  });

  // Add summary stats for all data
  if (Object.keys(groupedData).length > 1) {
    const allValues = data.map((item) => item.y);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const sum = allValues.reduce((a, b) => a + b, 0);
    const avg = sum / allValues.length;

    const summaryItem = document.createElement("div");
    summaryItem.className = "stat-item";
    summaryItem.style.backgroundColor = "#f8f9fa";
    summaryItem.style.border = "1px dashed #ccc";

    summaryItem.innerHTML = `
      <h4>All Data</h4>
      <p>Min: ${min.toFixed(2)}</p>
      <p>Max: ${max.toFixed(2)}</p>
      <p>Avg: ${avg.toFixed(2)}</p>
      <p>Count: ${allValues.length}</p>
    `;

    statsContent.appendChild(summaryItem);
  }
}
