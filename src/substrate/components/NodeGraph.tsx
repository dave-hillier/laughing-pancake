// Node Graph Editor Component using React Flow

import { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
} from 'reactflow';
import type { Node, Edge, Connection, NodeTypes } from 'reactflow';
import 'reactflow/dist/style.css';
import { useSubstrateStore } from '../store/substrateStore';
import type { NodeDefinition } from '../../shared/types';
import './NodeGraph.css';

// Custom Node Component
interface CustomNodeData {
  label: string;
  definition: NodeDefinition;
  parameters: Record<string, unknown>;
}

const CustomNode: React.FC<{ data: CustomNodeData; selected: boolean }> = ({
  data,
  selected,
}) => {
  const { definition } = data;

  return (
    <div className={`substrate-node ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-title">{data.label}</span>
        <span className="node-category">{definition.category}</span>
      </div>
      <div className="node-body">
        <div className="node-inputs">
          {definition.inputs.map((input, idx) => (
            <div key={input.id} className="node-port input">
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                style={{ top: 40 + idx * 24 }}
              />
              <span className="port-label">{input.name}</span>
            </div>
          ))}
        </div>
        <div className="node-outputs">
          {definition.outputs.map((output, idx) => (
            <div key={output.id} className="node-port output">
              <span className="port-label">{output.name}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                style={{ top: 40 + idx * 24 }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export const NodeGraph: React.FC = () => {
  const {
    nodes: storeNodes,
    connections,
    addConnection,
    removeConnection,
    updateNodePosition,
    selectNode,
    selectedNodeId,
    graphEngine,
    viewportPan,
    viewportZoom,
    setViewportPan,
    setViewportZoom,
  } = useSubstrateStore();

  // Convert store nodes to React Flow nodes
  const initialNodes: Node<CustomNodeData>[] = useMemo(
    () =>
      storeNodes.map(node => {
        const definition = graphEngine.getNodeDefinition(node.type);
        return {
          id: node.id,
          type: 'custom',
          position: node.position,
          data: {
            label: definition?.name || node.type,
            definition: definition!,
            parameters: node.parameters,
          },
          selected: node.id === selectedNodeId,
        };
      }),
    [storeNodes, selectedNodeId, graphEngine]
  );

  // Convert connections to React Flow edges
  const initialEdges: Edge[] = useMemo(
    () =>
      connections.map(conn => ({
        id: conn.id,
        source: conn.from.node,
        sourceHandle: conn.from.output,
        target: conn.to.node,
        targetHandle: conn.to.input,
        type: 'default',
      })),
    [connections]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes when store changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (
        params.source &&
        params.sourceHandle &&
        params.target &&
        params.targetHandle
      ) {
        const success = addConnection(
          params.source,
          params.sourceHandle,
          params.target,
          params.targetHandle
        );
        if (success) {
          setEdges(eds => addEdge(params, eds));
        }
      }
    },
    [addConnection, setEdges]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateNodePosition(node.id, node.position);
    },
    [updateNodePosition]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      if (selectedNodes.length > 0) {
        selectNode(selectedNodes[0].id);
      } else {
        selectNode(null);
      }
    },
    [selectNode]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      removeConnection(edge.id);
    },
    [removeConnection]
  );

  return (
    <div className="node-graph-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: viewportPan.x, y: viewportPan.y, zoom: viewportZoom }}
        onMove={(_, viewport) => {
          setViewportPan({ x: viewport.x, y: viewport.y });
          setViewportZoom(viewport.zoom);
        }}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
      >
        <Background color="#333" gap={16} />
        <Controls />
        <MiniMap
          nodeColor="#4a9eff"
          maskColor="rgba(0, 0, 0, 0.8)"
          style={{ background: '#1a1a1a' }}
        />
      </ReactFlow>
    </div>
  );
};
