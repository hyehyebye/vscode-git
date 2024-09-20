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

    // 노드와 링크를 정의합니다.
    const nodes = projectData.nodes.map((project) => ({
      id: project.id,
      gid: project.gid,
      name: project.name,
    }));

    const links = projectData.links
      .map((link) => ({
        source: nodes.find((n) => n.gid === link.source)
          ? nodes.find((n) => n.gid === link.source).gid
          : null,
        target: nodes.find((n) => n.gid === link.target)
          ? nodes.find((n) => n.gid === link.target).gid
          : null,
      }))
      .filter((link) => link.source !== null && link.target !== null);

    // 시뮬레이션 생성 및 노드와 링크를 처리합니다.
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(links).id((d) => d.gid)
      )
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

    // 링크를 추가합니다.
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-width", 1.5);

    // 노드를 추가합니다.
    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 5)
      .attr("fill", "orange")
      .call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // 노드 이름을 추가합니다.
    const text = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d) => d.name)
      .attr("x", (d) => d.x + 10)
      .attr("y", (d) => d.y);

    // 시뮬레이션 동안 노드와 링크의 위치를 업데이트합니다.
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
