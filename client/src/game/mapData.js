export const tileTypes = Object.freeze({
  EMPTY: '.',
  WALL: '#',
  CRATE: 'C',
});

const mapLayout = [
  '#############',
  '#..C.....C..#',
  '#.#.#.#.#.#.#',
  '#C..C...C..C#',
  '#.#.#.#.#.#.#',
  '#..C..C..C..#',
  '#.#.#.#.#.#.#',
  '#..C..C..C..#',
  '#.#.#.#.#.#.#',
  '#C..C...C..C#',
  '#.#.#.#.#.#.#',
  '#..C.....C..#',
  '#############',
];

export const cellSize = 2;
export const gridSize = mapLayout.length;
export const mapSize = gridSize * cellSize;

export const spawnPoints = [
  { row: 1, column: 1 },
  { row: 1, column: gridSize - 2 },
  { row: gridSize - 2, column: 1 },
  { row: gridSize - 2, column: gridSize - 2 },
];

// Create an independent map for each game session.
export const createMapData = () => mapLayout.map((row) => row.split(''));

// Convert grid coordinates to world coordinates.
export const gridToWorld = (row, column) => ({
  x: (column + 0.5) * cellSize - mapSize / 2,
  z: (row + 0.5) * cellSize - mapSize / 2,
});

// Convert world coordinates to grid coordinates.
export const worldToGrid = (x, z) => ({
  row: Math.floor((z + mapSize / 2) / cellSize),
  column: Math.floor((x + mapSize / 2) / cellSize),
});

// Treat positions outside the map as walls.
export const getTile = (map, row, column) =>
  map[row]?.[column] ?? tileTypes.WALL;
