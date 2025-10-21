// Relationship Viewer - Visual Network Graph

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class RelationshipViewer extends HandlebarsApplicationMixin(
  ApplicationV2
) {
  static _instance = null;

  static DEFAULT_OPTIONS = {
    tag: "div",
    window: {
      title: "mothership-crew-relationships.UI.RelationshipViewer",
      resizable: true,
    },
    position: {
      width: 900,
      height: 700,
    },
    classes: ["crew-relationship-viewer"],
  };

  static PARTS = {
    main: {
      template:
        "modules/mothership-crew-relationships/templates/relationship-viewer.hbs",
    },
  };

  // eslint-disable-next-line no-unused-vars
  static formHandler(event, form, formData) {
    event.preventDefault();
    event.stopPropagation();
    // Handle form submission logic here if needed
  }

  constructor(options = {}) {
    super(options);
    this.nodes = [];
    this.edges = [];

    RelationshipViewer._instance = this;
  }

  static getInstance() {
    if (RelationshipViewer._instance && RelationshipViewer._instance.rendered) {
      RelationshipViewer._instance.bringToTop();
      return RelationshipViewer._instance;
    }
    return new RelationshipViewer();
  }

  close(options) {
    if (RelationshipViewer._instance === this) {
      RelationshipViewer._instance = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.tooltipDiv) {
      this.tooltipDiv.remove();
    }
    return super.close(options);
  }

  _prepareContext() {
    // Get all player characters
    const characters = game.actors.filter(
      (a) => a.type === "character" && a.hasPlayerOwner
    );

    // Build nodes (characters)
    this.nodes = characters.map((actor) => ({
      id: actor.id,
      name: actor.name,
      img: actor.img,
      x: 0, // Will be positioned later
      y: 0,
    }));

    // Build edges (relationships)
    this.edges = [];
    const processedPairs = new Set();

    characters.forEach((actor) => {
      const relationships = actor.system.relationships || {};
      Object.entries(relationships).forEach(([targetId, relationship]) => {
        const pairKey = [actor.id, targetId].sort().join("-");
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          const targetActor = game.actors.get(targetId);
          if (targetActor) {
            this.edges.push({
              source: actor.id,
              target: targetId,
              relationship: relationship,
              sourceActor: actor,
              targetActor: targetActor,
            });
          }
        }
      });
    });

    return {
      nodes: this.nodes,
      edges: this.edges,
      hasCharacters: characters.length > 0,
    };
  }

  // eslint-disable-next-line no-unused-vars
  _onRender(context, options) {
    const canvas = document.getElementById("relationship-canvas");
    if (!canvas) return;

    this.renderGraph(canvas);

    // Re-render on window resize
    this.resizeObserver = new ResizeObserver(() => {
      this.renderGraph(canvas);
    });
    this.resizeObserver.observe(canvas.parentElement);
  }

  renderGraph(canvas) {
    const ctx = canvas.getContext("2d");
    const container = canvas.parentElement;

    // Set canvas size to match container
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.nodes.length === 0) return;

    // Position nodes in a circle
    this.positionNodes(canvas.width, canvas.height);

    // Draw edges first (so they appear behind nodes)
    this.drawEdges(ctx);

    // Draw nodes
    this.drawNodes(ctx);

    // Add interactivity
    this.addCanvasInteractivity(canvas, ctx);
  }

  positionNodes(width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    this.nodes.forEach((node, index) => {
      const angle = (index / this.nodes.length) * 2 * Math.PI - Math.PI / 2;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
      node.radius = 40; // Node radius for collision detection
    });
  }

  drawEdges(ctx) {
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;

    this.edges.forEach((edge) => {
      const sourceNode = this.nodes.find((n) => n.id === edge.source);
      const targetNode = this.nodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        // Draw curved line
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);

        // Calculate control point for curve
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const curve = dist * 0.1;

        // Perpendicular offset for curve
        const offsetX = (-dy / dist) * curve;
        const offsetY = (dx / dist) * curve;

        ctx.quadraticCurveTo(
          midX + offsetX,
          midY + offsetY,
          targetNode.x,
          targetNode.y
        );

        ctx.stroke();
      }
    });
  }

  drawNodes(ctx) {
    this.nodes.forEach((node) => {
      // Draw node circle
      ctx.fillStyle = "#1a1a1a";
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw character image (if we have it loaded)
      // For now, just draw initials
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const initials = node.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

      ctx.fillText(initials, node.x, node.y);

      // Draw name below node
      ctx.font = "14px Arial";
      ctx.fillStyle = "#fff";
      ctx.fillText(node.name, node.x, node.y + node.radius + 20);
    });
  }

  // eslint-disable-next-line no-unused-vars
  addCanvasInteractivity(canvas, ctx) {
    let hoveredNode = null;
    let hoveredEdge = null;

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Check if hovering over a node
      hoveredNode = this.nodes.find((node) => {
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        return Math.sqrt(dx * dx + dy * dy) <= node.radius;
      });

      // Check if hovering over an edge
      hoveredEdge = null;
      if (!hoveredNode) {
        for (const edge of this.edges) {
          const sourceNode = this.nodes.find((n) => n.id === edge.source);
          const targetNode = this.nodes.find((n) => n.id === edge.target);

          if (sourceNode && targetNode) {
            const dist = this.distanceToLine(
              mouseX,
              mouseY,
              sourceNode.x,
              sourceNode.y,
              targetNode.x,
              targetNode.y
            );
            if (dist < 10) {
              hoveredEdge = edge;
              break;
            }
          }
        }
      }

      // Update cursor
      canvas.style.cursor = hoveredNode || hoveredEdge ? "pointer" : "default";

      // Re-render with highlight
      this.renderGraphWithHighlight(canvas, hoveredNode, hoveredEdge);
    });

    // eslint-disable-next-line no-unused-vars
    canvas.addEventListener("click", (e) => {
      if (hoveredNode && game.user.isGM) {
        // Open the character sheet
        const actor = game.actors.get(hoveredNode.id);
        if (actor) actor.sheet.render(true);
      }
    });

    // Show tooltip on hover
    this.tooltipDiv = this.tooltipDiv || document.createElement("div");
    this.tooltipDiv.className = "relationship-tooltip";
    this.tooltipDiv.style.display = "none";
    document.body.appendChild(this.tooltipDiv);

    canvas.addEventListener("mousemove", (e) => {
      if (hoveredEdge) {
        this.tooltipDiv.innerHTML = `
          <strong>${hoveredEdge.sourceActor.name} ↔ ${hoveredEdge.targetActor.name}</strong><br/>
          ${hoveredEdge.relationship}
        `;
        this.tooltipDiv.style.display = "block";
        this.tooltipDiv.style.left = e.pageX + 10 + "px";
        this.tooltipDiv.style.top = e.pageY + 10 + "px";
      } else if (hoveredNode) {
        const relationshipCount = this.edges.filter(
          (e) => e.source === hoveredNode.id || e.target === hoveredNode.id
        ).length;
        this.tooltipDiv.innerHTML = `
          <strong>${hoveredNode.name}</strong><br/>
          ${relationshipCount} relationship${relationshipCount !== 1 ? "s" : ""}
        `;
        this.tooltipDiv.style.display = "block";
        this.tooltipDiv.style.left = e.pageX + 10 + "px";
        this.tooltipDiv.style.top = e.pageY + 10 + "px";
      } else {
        this.tooltipDiv.style.display = "none";
      }
    });

    canvas.addEventListener("mouseleave", () => {
      this.tooltipDiv.style.display = "none";
    });
  }

  renderGraphWithHighlight(canvas, highlightNode, highlightEdge) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all edges
    this.edges.forEach((edge) => {
      const sourceNode = this.nodes.find((n) => n.id === edge.source);
      const targetNode = this.nodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        const isHighlighted = edge === highlightEdge;
        const isConnected =
          highlightNode &&
          (edge.source === highlightNode.id ||
            edge.target === highlightNode.id);

        ctx.strokeStyle = isHighlighted
          ? "#fff"
          : isConnected
            ? "#aaa"
            : "#666";
        ctx.lineWidth = isHighlighted ? 4 : isConnected ? 3 : 2;

        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);

        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const curve = dist * 0.1;

        const offsetX = (-dy / dist) * curve;
        const offsetY = (dx / dist) * curve;

        ctx.quadraticCurveTo(
          midX + offsetX,
          midY + offsetY,
          targetNode.x,
          targetNode.y
        );

        ctx.stroke();
      }
    });

    // Draw all nodes
    this.nodes.forEach((node) => {
      const isHighlighted = node === highlightNode;

      ctx.fillStyle = isHighlighted ? "#2a2a2a" : "#1a1a1a";
      ctx.strokeStyle = isHighlighted ? "#ffcc00" : "#fff";
      ctx.lineWidth = isHighlighted ? 4 : 3;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const initials = node.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

      ctx.fillText(initials, node.x, node.y);

      ctx.font = "14px Arial";
      ctx.fillStyle = isHighlighted ? "#ffcc00" : "#fff";
      ctx.fillText(node.name, node.x, node.y + node.radius + 20);
    });
  }

  distanceToLine(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
