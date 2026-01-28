// Node Browser Component - Add nodes to the graph

import { useState, useMemo } from 'react';
import { useSubstrateStore } from '../store/substrateStore';
import { getNodesByCategory } from '../nodes';
import './NodeBrowser.css';

const CATEGORY_LABELS: Record<string, string> = {
  generator: 'Generators',
  filter: 'Filters',
  blend: 'Blends',
  input: 'Inputs',
  output: 'Outputs',
  utility: 'Utilities',
};

const CATEGORY_ORDER = ['generator', 'filter', 'blend', 'input', 'output', 'utility'];

export const NodeBrowser = () => {
  const { addNode, viewportPan, viewportZoom } = useSubstrateStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['generator', 'filter'])
  );

  const nodesByCategory = useMemo(() => getNodesByCategory(), []);

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodesByCategory;

    const result: Record<string, typeof nodesByCategory[string]> = {};
    const query = searchQuery.toLowerCase();

    for (const [category, nodes] of Object.entries(nodesByCategory)) {
      const filtered = nodes.filter(n =>
        n.name.toLowerCase().includes(query)
      );
      if (filtered.length > 0) {
        result[category] = filtered;
      }
    }

    return result;
  }, [nodesByCategory, searchQuery]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleAddNode = (nodeType: string) => {
    // Add node at center of viewport
    const centerX = -viewportPan.x / viewportZoom + 400;
    const centerY = -viewportPan.y / viewportZoom + 300;

    addNode(nodeType, {
      x: centerX + Math.random() * 100 - 50,
      y: centerY + Math.random() * 100 - 50,
    });
  };

  return (
    <div className="node-browser">
      <div className="browser-header">
        <h3>Nodes</h3>
        <input
          type="text"
          className="node-search"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="browser-content">
        {CATEGORY_ORDER.filter(cat => filteredNodes[cat]).map(category => (
          <div key={category} className="node-category">
            <button
              className={`category-header ${expandedCategories.has(category) ? 'expanded' : ''}`}
              onClick={() => toggleCategory(category)}
            >
              <span className="category-icon">
                {expandedCategories.has(category) ? '▼' : '▶'}
              </span>
              <span className="category-name">
                {CATEGORY_LABELS[category] || category}
              </span>
              <span className="category-count">
                {filteredNodes[category]?.length || 0}
              </span>
            </button>

            {expandedCategories.has(category) && (
              <div className="category-nodes">
                {filteredNodes[category]?.map(node => (
                  <button
                    key={node.id}
                    className="node-item"
                    onClick={() => handleAddNode(node.id)}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('nodeType', node.id);
                    }}
                  >
                    <span className="node-name">{node.name}</span>
                    <span className="node-add">+</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
