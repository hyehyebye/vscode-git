// 데이터 로드 및 그래프 생성
fetch("/api/projects")
  .then((response) => response.json())
  .then((projectsData) => {
    console.log("Projects Data:", projectsData); // 로깅 추가

    const width = 800,
      height = 600;

    const svg = d3
      .select("#graph")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // 노드와 링크를 정의합니다.
    const nodes = projectsData.map((project) => ({
      id: project.id,
      name: project.name,
    }));
    const links = []; // 여기에 실제 링크 데이터를 추가하세요.

    // 시뮬레이션 생성
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(links).id((d) => d.id)
      )
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

    // 링크 생성
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-width", 1.5);

    // 노드 생성
    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 5)
      .attr("fill", "orange") // 노드의 색깔을 조정합니다.
      .call(drag(simulation));

    function drag(simulation) {
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

      return d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    // 노드의 이름을 표시합니다.
    const labels = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d) => d.name)
      .attr("x", (d) => d.x + 10)
      .attr("y", (d) => d.y);

    // 시뮬레이션의 각 'tick'에서 위치 업데이트
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      labels.attr("x", (d) => d.x + 10).attr("y", (d) => d.y);
    });
  })
  .catch((error) => console.error("Error fetching data:", error));
