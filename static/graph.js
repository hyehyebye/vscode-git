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
          .on("zoom", (event) => g.attr("transform", event.transform)) // 줌/패닝 핸들러
      );

    // 내부 요소를 위한 g 태그 추가
    const g = svg.append("g");

    // 화살표 marker 정의 (노드 크기에 따라 화살표 위치 조정)
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 45) // refX 값 조정
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "gray");

    // 노드와 링크 정의
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

    // 노드별 전체 영향 범위를 계산하는 BFS 함수
    function calculateInfluence(nodeId, links) {
      const visited = new Set();
      const queue = [nodeId];
      visited.add(nodeId);

      while (queue.length > 0) {
        const current = queue.shift();
        const outgoingLinks = links.filter((link) => link.source === current);

        outgoingLinks.forEach((link) => {
          if (!visited.has(link.target)) {
            visited.add(link.target);
            queue.push(link.target);
          }
        });
      }

      return visited.size; // 전체 영향 범위의 크기
    }

    // 각 노드의 영향 범위를 계산하여 저장하고, 노드의 초기 위치를 원형으로 배치
    const influenceMap = {};
    const radius = 500; // 원형 배치의 반지름을 설정
    nodes.forEach((node, i) => {
      influenceMap[node.id] = calculateInfluence(node.id, links);

      // 원형 배치: 각 노드의 초기 x, y 좌표를 원형으로 배치
      const angle = (i / nodes.length) * 1 * Math.PI; // 각도를 계산하여 원형 배치
      node.x = width / 2 + Math.cos(angle) * radius; // x 좌표
      node.y = height / 2 + Math.sin(angle) * radius; // y 좌표
    });

    // 노드 크기 설정
    const nodeRadius = (d) => {
      const baseSize = 20;
      const factor = 5; // 영향 범위에 따른 크기 조정 비율
      const influenceSize = influenceMap[d.id] || 1; // 영향 범위 크기
      const maxRadius = 100; // 최대 노드 크기 설정
      return Math.min(baseSize + influenceSize * factor, maxRadius);
    };

    // D3 시뮬레이션 생성
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
        d3.forceCollide().radius((d) => nodeRadius(d) + 10) //충돌 처리 개선
      );

    // 링크 추가
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "gray")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)"); // 화살표 marker 추가

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
      .text((d) => `-${d.type}->`);

    // 노드 추가
    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", (d) => nodeRadius(d)) // 영향 범위에 따라 노드 크기 설정
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

    // 텍스트 추가
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

    // 시뮬레이션 동안 노드와 링크의 위치를 업데이트
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
