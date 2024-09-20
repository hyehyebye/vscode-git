fetch("/api/projects")
  .then((response) => response.json())
  .then((projectData) => {
    console.log("Projects Data:", projectData);
    const width = 800,
      height = 600;

    const svg = d3
      .select("#graph")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Map nodes and create a dictionary for quick access
    const nodeMap = new Map(projectData.nodes.map((node) => [node.id, node]));
    const nodes = projectData.nodes;

    // Map links to directly reference node objects
    const links = projectData.links
      .map((link) => ({
        source: nodeMap.get(link.source),
        target: nodeMap.get(link.target),
      }))
      .filter((link) => link.source && link.target); // Filter out any undefined references

    // Initialize the simulation with nodes and links
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(links).id((d) => d.id)
      )
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Create and append the visual elements for links
    const link = svg
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "gray")
      .attr("stroke-width", 1.5);

    // Create and append the visual elements for nodes
    const node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 5)
      .attr("fill", "orange")
      .call(
        d3
          .drag()
          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded)
      );

    // Append labels to the nodes
    const text = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d) => d.name)
      .attr("x", 10)
      .attr("y", 3);

    // Define drag behaviors
    function dragStarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Update positions each tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      text.attr("x", (d) => d.x + 10).attr("y", (d) => d.y);
    });
  })
  .catch((error) => console.error("Error fetching data:", error));
