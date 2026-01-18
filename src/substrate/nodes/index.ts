// Substrate Node Library

import type { NodeDefinition } from '../../shared/types';
import { generatorNodes } from './generators';
import { filterNodes } from './filters';
import { blendNodes } from './blends';
import { ioNodes } from './io';
import { utilityNodes } from './utilities';
import { scatterNodes } from './scatter';

export const allNodes: NodeDefinition[] = [
  ...generatorNodes,
  ...filterNodes,
  ...blendNodes,
  ...ioNodes,
  ...utilityNodes,
  ...scatterNodes,
];

export function getNodesByCategory(): Record<string, NodeDefinition[]> {
  const categories: Record<string, NodeDefinition[]> = {};

  for (const node of allNodes) {
    if (!categories[node.category]) {
      categories[node.category] = [];
    }
    categories[node.category].push(node);
  }

  return categories;
}

export function getNodeDefinition(id: string): NodeDefinition | undefined {
  return allNodes.find(n => n.id === id);
}

export { generatorNodes } from './generators';
export { filterNodes } from './filters';
export { blendNodes } from './blends';
export { ioNodes } from './io';
export { utilityNodes } from './utilities';
export { scatterNodes } from './scatter';
