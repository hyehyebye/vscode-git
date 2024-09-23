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
      .attr("height", height)
      .call(
        d3
          .zoom()
          .scaleExtent([0.5, 4])
          .on("zoom", (event) => g.attr("transform", event.transform))
      );

    const g = svg.append("g");

    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 45)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "gray");

    const nodes = projectData.nodes.map((project) => ({
      id: project.id,
      gid: project.gid,
      name: project.name,
    }));

    const links = projectData.links
      .map((link) => ({
        source: nodes.find((n) => n.id === link.source)?.id || null,
        target: nodes.find((n) => n.id === link.target)?.id || null,
        type: "consists_of",
      }))
      .filter((link) => link.source !== null && link.target !== null);

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

      return visited.size;
    }

    const influenceMap = {};
    const radius = 500;
    nodes.forEach((node, i) => {
      influenceMap[node.id] = calculateInfluence(node.id, links);
      const angle = (i / nodes.length) * 1 * Math.PI;
      node.x = width / 2 + Math.cos(angle) * radius;
      node.y = height / 2 + Math.sin(angle) * radius;
    });

    const nodeRadius = (d) => {
      const baseSize = 20;
      const factor = 5;
      const influenceSize = influenceMap[d.id] || 1;
      const maxRadius = 100;
      return Math.min(baseSize + influenceSize * factor, maxRadius);
    };

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(250)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => nodeRadius(d) + 10)
      );

    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "gray")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    const linkText = g
      .append("g")
      .selectAll("text")
      .data(links)
      .enter()
      .append("text")
      .attr("font-size", 10)
      .attr("fill", "gray")
      .text((d) => `${d.type}`);

    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", (d) => nodeRadius(d))
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
      )
      .on("mouseover", (event, d) => {
        highlightRelated(d);
      })
      .on("mouseout", () => {
        resetHighlight();
      });

    const text = g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
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
      )
      .on("mouseover", (event, d) => {
        highlightRelated(d);
      })
      .on("mouseout", () => {
        resetHighlight();
      });

    // 관련 노드를 강조하는 함수
    function highlightRelated(d) {
      link.attr("opacity", (l) => (l.source === d || l.target === d ? 1 : 0.1));
      node.attr("opacity", (n) =>
        n === d ||
        links.some(
          (l) =>
            (l.source === n && l.target === d) ||
            (l.source === d && l.target === n)
        )
          ? 1
          : 0.1
      );
      text.attr("opacity", (n) =>
        n === d ||
        links.some(
          (l) =>
            (l.source === n && l.target === d) ||
            (l.source === d && l.target === n)
        )
          ? 1
          : 0.1
      );
      linkText.attr("opacity", (l) =>
        l.source === d || l.target === d ? 1 : 0.1
      );
    }

    // 강조를 원래 상태로 되돌리는 함수
    function resetHighlight() {
      link.attr("opacity", 1);
      node.attr("opacity", 1);
      text.attr("opacity", 1);
      linkText.attr("opacity", 1);
    }

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

    // 팝업 창을 보여주는 함수
    function showPopup(d) {
      const popup = document.getElementById("popup");
      const overlay = document.getElementById("popup-overlay");

      const parents = links
        .filter((l) => l.target === d)
        .map((l) => l.source.name);
      const children = links
        .filter((l) => l.source === d)
        .map((l) => l.target.name);

      document.getElementById("popup-title").textContent = d.name;
      document.getElementById("popup-id").textContent = `ID: ${d.id}`;
      document.getElementById("popup-gid").textContent = `GID: ${d.gid}`;
      document.getElementById("popup-parents").textContent =
        parents.length > 0
          ? `상위 연결 노드: ${parents.join(", ")}`
          : "상위 연결 노드: 없음";
      document.getElementById("popup-children").textContent =
        children.length > 0
          ? `하위 연결 노드: ${children.join(", ")}`
          : "하위 연결 노드: 없음";

      // 팝업 위치 설정 (노드 근처에 뜨도록)
      popup.style.left = `${d.x + 100}px`; // x좌표 기준으로 100px 옆에 표시
      popup.style.top = `${d.y}px`; // y좌표 기준으로 위치 조정
      popup.style.display = "block";
      overlay.style.display = "block";
    }

    // 팝업 창을 숨기는 함수
    function hidePopup() {
      document.getElementById("popup").style.display = "none";
      document.getElementById("popup-overlay").style.display = "none";
    }

    // 노드 클릭 이벤트 등록
    node.on("click", (event, d) => {
      showPopup(d);
    });
    text.on("click", (event, d) => {
      showPopup(d);
    });
    function showPopup(d) {
      const popup = document.getElementById("popup");
      const overlay = document.getElementById("popup-overlay");

      const parents = links
        .filter((l) => l.target === d)
        .map((l) => l.source.name);
      const children = links
        .filter((l) => l.source === d)
        .map((l) => l.target.name);

      document.getElementById("popup-title").textContent = d.name;
      document.getElementById("popup-id").textContent = `ID: ${d.id}`;
      document.getElementById("popup-gid").textContent = `GID: ${d.gid}`;
      document.getElementById("popup-parents").textContent = `상위 연결 노드: ${
        parents.join(", ") || "없음"
      }`;
      document.getElementById(
        "popup-children"
      ).textContent = `하위 연결 노드: ${children.join(", ") || "없음"}`;

      popup.style.display = "block";
      overlay.style.display = "block";

      // 팝업 위치를 클릭한 노드의 좌표에 맞춤
      popup.style.left = `${d.x + 20}px`;
      popup.style.top = `${d.y + 20}px`;

      overlay.addEventListener("click", hidePopup);
    }
  })
  .catch((error) => console.error("Error fetching data:", error));
