import {
  BoxGeometry,
  GridHelper,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three';
import {
  cellSize,
  createMapData,
  gridSize,
  gridToWorld,
  mapSize,
  tileTypes,
} from './mapData';

const wallHeight = 2.4;
const crateHeight = 2;

const createGameMap = (scene) => {
  const tiles = createMapData();
  const obstacles = new Map();
  const mapGroup = new Group();

  // Create the ground.
  const groundGeometry = new PlaneGeometry(mapSize, mapSize);
  const groundMaterial = new MeshStandardMaterial({
    color: 0x78a86b,
  });

  const ground = new Mesh(groundGeometry, groundMaterial);

  ground.rotation.x = -Math.PI / 2;
  mapGroup.add(ground);

  // Create the grid aligned with the map cells.
  const grid = new GridHelper(mapSize, gridSize, 0x444444, 0x888888);

  grid.position.y = 0.01;
  mapGroup.add(grid);

  // Share geometry and materials between obstacles.
  const wallGeometry = new BoxGeometry(cellSize, wallHeight, cellSize);
  const wallMaterial = new MeshStandardMaterial({
    color: 0x657180,
  });

  const crateGeometry = new BoxGeometry(cellSize, crateHeight, cellSize);
  const crateMaterial = new MeshStandardMaterial({
    color: 0xb47a40,
  });

  // Generate obstacles from the grid data.
  tiles.forEach((row, rowIndex) => {
    row.forEach((tile, columnIndex) => {
      if (tile === tileTypes.EMPTY) {
        return;
      }

      const isDestructible = tile === tileTypes.CRATE;
      const geometry = isDestructible ? crateGeometry : wallGeometry;
      const material = isDestructible ? crateMaterial : wallMaterial;
      const height = isDestructible ? crateHeight : wallHeight;

      const obstacle = new Mesh(geometry, material);
      const { x, z } = gridToWorld(rowIndex, columnIndex);

      obstacle.position.set(x, height / 2, z);

      obstacle.userData = {
        row: rowIndex,
        column: columnIndex,
        type: tile,
        destructible: isDestructible,
      };

      obstacles.set(`${rowIndex},${columnIndex}`, obstacle);
      mapGroup.add(obstacle);
    });
  });

  scene.add(mapGroup);

  return {
    tiles,
    obstacles,
    dispose() {
      scene.remove(mapGroup);

      groundGeometry.dispose();
      groundMaterial.dispose();

      grid.geometry.dispose();
      grid.material.dispose();

      wallGeometry.dispose();
      wallMaterial.dispose();

      crateGeometry.dispose();
      crateMaterial.dispose();

      mapGroup.clear();
      obstacles.clear();
    },
  };
};

export default createGameMap;
