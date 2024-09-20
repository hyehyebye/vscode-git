fetch("/api/projects")
  .then((response) => response.json())
  .then((projectData) => {
    console.log("Projects Data:", projectData);
    const width = 1600,
      height = 1200;

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
        source: nodes.find((n) => n.id === link.source)?.id || null,
        target: nodes.find((n) => n.id === link.target)?.id || null,
        type: "consists_of", // 링크에 라벨 텍스트를 표시하기 위한 값
      }))
      .filter((link) => link.source !== null && link.target !== null);

    // 시뮬레이션 생성 및 노드와 링크를 처리합니다.
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(links).id((d) => d.id)
      )
      .force("charge", d3.forceManyBody().strength(-300)) // 반발력 설정
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => d.size)
      ); // 충돌 반경

    // 링크를 추가합니다.
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "gray")
      .attr("stroke-width", 1.5);

    // 링크 라벨 추가
    const linkText = svg
      .append("g")
      .selectAll("text")
      .data(links)
      .enter()
      .append("text")
      .attr("font-size", 10)
      .attr("fill", "gray")
      .text((d) => d.type);

    // 노드 크기 계산: 연결된 노드 수에 비례하여 크기 설정
    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr(
        "r",
        (d) =>
          10 +
          Math.sqrt(
            links.filter((l) => l.source === d.id || l.target === d.id).length
          ) *
            10
      ) // 연결된 노드 수에 따른 가중치
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

    // 텍스트 중앙에 위치, 크기 자동 조정 및 줄바꿈 추가
    const text = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("text-anchor", "middle") // 텍스트 중앙 정렬
      .style("font-size", (d) => `${Math.max(10, 20 - d.name.length * 0.5)}px`) // 글자 크기를 자동으로 조정
      .text((d) => d.name);

    // 시뮬레이션 동안 노드와 링크의 위치를 업데이트합니다.
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      linkText
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      text.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });
  })
  .catch((error) => console.error("Error fetching data:", error));
