# main.py
# FastAPI backend with DAG analysis using Kahn's Algorithm.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
from collections import defaultdict, deque

app = FastAPI()

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PipelineRequest(BaseModel):
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]


class Issue(BaseModel):
    type: str
    edge: list[str] | None = None
    node: str | None = None


class PipelineResponse(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag: bool
    issues: list[Issue]


def find_cycle_edge(node_ids: set[str], edges: list[dict]) -> list[str] | None:
    """
    Kahn's Algorithm for DAG detection.
    Returns the edge that closes a cycle, or None if the graph is a DAG.
    """
    adjacency: dict[str, list[str]] = defaultdict(list)
    in_degree: dict[str, int] = defaultdict(int)

    # Initialize all nodes with 0 in-degree
    for nid in node_ids:
        in_degree[nid] = 0

    # Build adjacency list and in-degree map
    for edge in edges:
        source = edge.get("source", "")
        target = edge.get("target", "")
        if source in node_ids and target in node_ids:
            adjacency[source].append(target)
            in_degree[target] += 1

    # Start with all nodes that have in-degree 0
    queue = deque([n for n in node_ids if in_degree[n] == 0])
    visited_count = 0

    while queue:
        node = queue.popleft()
        visited_count += 1
        for neighbor in adjacency[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if visited_count == len(node_ids):
        return None  # It's a DAG

    # Find the specific edge that closes the cycle:
    # Look for an edge whose target still has in_degree > 0
    # (i.e., it's part of a cycle and never reached 0)
    remaining = {n for n in node_ids if in_degree[n] > 0}
    for edge in edges:
        source = edge.get("source", "")
        target = edge.get("target", "")
        if source in remaining and target in remaining:
            return [source, target]

    # Fallback: return first edge into a remaining node
    for edge in edges:
        target = edge.get("target", "")
        if target in remaining:
            return [edge.get("source", ""), target]

    return None


def detect_structural_issues(
    node_ids: set[str],
    nodes: list[dict],
    edges: list[dict],
) -> list[Issue]:
    """
    Detect structural issues independent of cycle detection:
    - Non-source node with zero incoming edges
    - Output-type node with zero incoming edges
    """
    issues: list[Issue] = []

    # Determine which node types are "source" types (no expected inputs)
    SOURCE_TYPES = {"customInput", "fileUpload"}

    # Build set of nodes that have at least one incoming edge
    nodes_with_incoming: set[str] = set()
    for edge in edges:
        target = edge.get("target", "")
        if target in node_ids:
            nodes_with_incoming.add(target)

    for node in nodes:
        nid = node.get("id", "")
        ntype = node.get("type", "")

        # Output-type node with zero incoming edges
        if ntype == "customOutput" and nid not in nodes_with_incoming:
            issues.append(Issue(type="unreachable_output", node=nid))
        # Non-source node with zero inputs (not already caught above)
        elif ntype not in SOURCE_TYPES and nid not in nodes_with_incoming:
            if ntype != "customOutput":  # Avoid duplicate
                issues.append(Issue(type="disconnected_node", node=nid))

    return issues


@app.get("/")
def read_root():
    return {"Ping": "Pong"}


@app.post("/pipelines/parse")
def parse_pipeline(request: PipelineRequest):
    nodes = request.nodes
    edges = request.edges

    node_ids = {node.get("id", "") for node in nodes}
    issues: list[Issue] = []

    # 1. Kahn's algorithm — DAG check + cycle edge identification
    cycle_edge = find_cycle_edge(node_ids, edges)
    is_dag = cycle_edge is None

    if not is_dag and cycle_edge:
        issues.append(Issue(type="cycle", edge=cycle_edge))

    # 2. Structural issue detection
    structural_issues = detect_structural_issues(node_ids, nodes, edges)
    issues.extend(structural_issues)

    return PipelineResponse(
        num_nodes=len(nodes),
        num_edges=len(edges),
        is_dag=is_dag,
        issues=issues,
    )
