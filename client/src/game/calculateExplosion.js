import { getTile, tileTypes } from './mapData';

const directions = [
  { row: -1, column: 0 },
  { row: 1, column: 0 },
  { row: 0, column: -1 },
  { row: 0, column: 1 },
];

const calculateExplosion = (tiles, row, column, range = 2) => {
  const affectedTiles = [];
  const destroyedCrates = [];

  if (getTile(tiles, row, column) !== tileTypes.EMPTY) {
    return { affectedTiles, destroyedCrates };
  }

  affectedTiles.push({ row, column });

  directions.forEach((direction) => {
    for (let step = 1; step <= range; step += 1) {
      const nextRow = row + direction.row * step;
      const nextColumn = column + direction.column * step;
      const tile = getTile(tiles, nextRow, nextColumn);

      if (tile === tileTypes.WALL) {
        break;
      }

      const position = { row: nextRow, column: nextColumn };
      affectedTiles.push(position);

      if (tile === tileTypes.CRATE) {
        destroyedCrates.push(position);
        break;
      }
    }
  });

  return { affectedTiles, destroyedCrates };
};

export default calculateExplosion;
