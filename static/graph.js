fetch("/api/projects")
  .then((response) => response.json())
  .then((projectData) => {
    console.log("Projects Data:", projectData);
    const width = 1600,
      height = 1200;

    // svg를 추가하고 zoom/pan 기능을 활성화
    const svg = d3
      .select("#graph")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(
        d3
          .zoom()
          .scaleExtent([0.5, 4]) // 줌의 최소/최대 범위 설정
          .on("zoom", zoomed)
      );

    // 내부 요소를 위한 g 태그 추가
    const g = svg.append("g");

    // zoom 이벤트 핸들러
    function zoomed(event) {
      g.attr("transform", event.transform); // g 태그의 변환 적용
    }

    // 화살표 marker 추가
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 45) // 노드 크기에 따라 화살표 위치를 조정
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "gray");

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
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(250) // 노드 간 거리 설정
      )
      .force("charge", d3.forceManyBody().strength(-300)) // 반발력 설정
      .force("center", d3.forceCenter(width / 2, height / 2)) // 중심 위치 설정
      .force(
        "collision",
        d3.forceCollide().radius((d) => d.size)
      );

    // 링크를 추가합니다.
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "gray")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)"); // 화살표 marker 추가

    const nodeRadius = (d) =>
      (10 +
        Math.sqrt(
          links.filter((l) => l.source === d.id || l.target === d.id).length
        ) *
          10) *
      3.5;

    // 링크의 끝점을 노드의 가장자리로 설정
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => {
          const angle = Math.atan2(
            d.target.y - d.source.y,
            d.target.x - d.source.x
          );
          return d.source.x + Math.cos(angle) * nodeRadius(d.source); // 노드 반지름만큼 x 좌표 조정
        })
        .attr("y1", (d) => {
          const angle = Math.atan2(
            d.target.y - d.source.y,
            d.target.x - d.source.x
          );
          return d.source.y + Math.sin(angle) * nodeRadius(d.source); // 노드 반지름만큼 y 좌표 조정
        })
        .attr("x2", (d) => {
          const angle = Math.atan2(
            d.source.y - d.target.y,
            d.source.x - d.target.x
          );
          return d.target.x + Math.cos(angle) * nodeRadius(d.target); // 노드 반지름만큼 x 좌표 조정
        })
        .attr("y2", (d) => {
          const angle = Math.atan2(
            d.source.y - d.target.y,
            d.source.x - d.target.x
          );
          return d.target.y + Math.sin(angle) * nodeRadius(d.target); // 노드 반지름만큼 y 좌표 조정
        });

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      text.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    // 링크 라벨 추가
    const linkText = g
      .append("g")
      .selectAll("text")
      .data(links)
      .enter()
      .append("text")
      .attr("font-size", 10)
      .attr("fill", "gray")
      .text((d) => `${d.type}`);

    // 노드 크기 계산: 노드 크기를 5배로 증가
    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr(
        "r",
        (d) =>
          (10 +
            Math.sqrt(
              links.filter((l) => l.source === d.id || l.target === d.id).length
            ) *
              10) *
          3.5
      )
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

    // 텍스트도 드래그 가능하도록 처리
    const text = g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("text-anchor", "middle") // 텍스트 중앙 정렬
      .text((d) => d.name)
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
