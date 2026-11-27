import {
  cellSize,
  getTile,
  gridToWorld,
  tileTypes,
  worldToGrid,
} from './mapData';

const playerRadius = 0.3;
const maxStepSize = 0.05;

const createPlayerCollision = (tiles) => {
  // Check whether the player's collision circle overlaps a blocked tile.
  const canOccupy = (x, z) => {
    const min = worldToGrid(x - playerRadius, z - playerRadius);
    const max = worldToGrid(x + playerRadius, z + playerRadius);
    const halfCell = cellSize / 2;

    for (let row = min.row; row <= max.row; row += 1) {
      for (let column = min.column; column <= max.column; column += 1) {
        if (getTile(tiles, row, column) !== tileTypes.EMPTY) {
          const center = gridToWorld(row, column);

          const distanceX = Math.max(Math.abs(x - center.x) - halfCell, 0);
          const distanceZ = Math.max(Math.abs(z - center.z) - halfCell, 0);

          if (distanceX ** 2 + distanceZ ** 2 < playerRadius ** 2) {
            return false;
          }
        }
      }
    }

    return true;
  };

  // Resolve movement in small steps to prevent tunneling.
  const move = (position, deltaX, deltaZ) => {
    let { x, z } = position;

    const distance = Math.hypot(deltaX, deltaZ);
    const steps = Math.max(1, Math.ceil(distance / maxStepSize));
    const stepX = deltaX / steps;
    const stepZ = deltaZ / steps;

    for (let step = 0; step < steps; step += 1) {
      // Resolve each axis independently to allow wall sliding.
      if (canOccupy(x + stepX, z)) {
        x += stepX;
      }

      if (canOccupy(x, z + stepZ)) {
        z += stepZ;
      }
    }

    return { x, z };
  };

  return {
    canOccupy,
    move,
  };
};

export default createPlayerCollision;
