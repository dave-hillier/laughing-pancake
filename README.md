# Dendrite & Substrate

Browser-based creative tools for procedural organic content creation.

## Overview

This project implements two complementary browser-based applications:

### Dendrite - Growth Simulator
A specialized application for creating organic branching structures through algorithmic growth simulation.

Features:
- **L-System Engine**: Implements deterministic, stochastic, parametric, and context-sensitive grammars
- **Space Colonization**: Environment-responsive growth patterns for natural venation
- **GPU Rasterization**: WebGL-accelerated rendering with Jump Flood Algorithm for distance fields
- **Multiple Output Maps**: Distance field, direction field, thickness, depth, and ID maps
- **Export Options**: PNG, SVG, and JSON exports

### Substrate - Procedural Texture Tool
A node-based procedural texture authoring application for creating tileable PBR materials.

Features:
- **Visual Node Graph**: Connect processing nodes to build texture generation graphs
- **Generator Nodes**: Perlin noise, Voronoi, gradients, patterns
- **Filter Nodes**: Levels, blur, edge detection, normal maps
- **Blend Nodes**: Various compositing operations
- **Real-time Preview**: 2D tiled preview and 3D material preview

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Technology Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Zustand** for state management
- **React Flow** for node graph editing
- **Three.js** with React Three Fiber for 3D preview
- **WebGL 2.0** for GPU-accelerated rendering

## Project Structure

```
src/
├── shared/           # Shared utilities and components
│   ├── webgl/        # WebGL abstractions
│   ├── components/   # Shared UI components
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions
├── dendrite/         # Dendrite application
│   ├── engine/       # L-System, Space Colonization, Rasterization
│   ├── components/   # React components
│   └── store/        # Zustand store
└── substrate/        # Substrate application
    ├── engine/       # Graph engine, Shader pipeline
    ├── nodes/        # Node definitions
    ├── components/   # React components
    └── store/        # Zustand store
```

## License

MIT
