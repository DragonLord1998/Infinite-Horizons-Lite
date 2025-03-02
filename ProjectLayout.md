infinite-horizons/
├── index.html               # Main entry point
├── favicon.ico              # Site favicon
├── README.md                # Project documentation
├── package.json             # Dependencies and scripts
├── .gitignore               # Git ignore file
├── src/                     # Source code directory
│   ├── app.js               # Main application entry point
│   ├── config.js            # Global configuration settings
│   ├── core/                # Core application components
│   │   ├── engine.js        # Babylon.js engine setup
│   │   ├── scene.js         # Scene management
│   │   └── camera.js        # Camera configuration
│   ├── terrain/             # Terrain generation modules
│   │   ├── chunkManager.js  # Chunk tracking and loading
│   │   ├── heightmap.js     # Heightmap generation
│   │   ├── meshBuilder.js   # Terrain mesh creation
│   │   └── noiseGenerator.js # Noise functions
│   ├── materials/           # Material definitions
│   │   ├── terrainMaterial.js # Basic terrain material
│   │   └── shaders/         # GLSL shader files
│   │       ├── terrain.vertex.glsl   # Vertex shader
│   │       └── terrain.fragment.glsl # Fragment shader
│   ├── workers/             # Web Worker implementations
│   │   ├── terrainWorker.js # Heightmap generation worker
│   │   └── workerPool.js    # Worker management
│   ├── utils/               # Utility functions
│   │   ├── math.js          # Math utilities
│   │   ├── coordinates.js   # Coordinate system helpers
│   │   └── performance.js   # Performance monitoring
│   └── controls/            # User input and controls
│       └── cameraControls.js # WASD/mouse camera controls
├── lib/                     # External libraries
│   └── babylon/             # Babylon.js files if not using CDN
├── assets/                  # Static assets (minimal for MVP)
│   └── textures/            # Any textures (though aiming for procedural)
├── dist/                    # Build output directory
│   └── ...                  # Built files
└── tests/                   # Testing infrastructure
    └── ...                  # Test files