import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
} from 'three';
import calculateExplosion from './calculateExplosion';
import {
  cellSize,
  getTile,
  gridToWorld,
  tileTypes,
  worldToGrid,
} from './mapData';

const bombRadius = 0.3;
const bombDelay = 3000;
const explosionRange = 2;
const explosionDuration = 500;
const explosionHeight = 2;

const createBombManager = (scene, gameMap) => {
  let activeBomb = null;
  let explosionEndsAt = null;

  const explosionGroup = new Group();
  scene.add(explosionGroup);

  // Create shared bomb resources.
  const bombGeometry = new SphereGeometry(bombRadius, 16, 16);
  const bombMaterial = new MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.6,
  });

  // Create shared explosion resources.
  const explosionGeometry = new BoxGeometry(
    cellSize * 0.9,
    explosionHeight,
    cellSize * 0.9,
  );

  const explosionMaterial = new MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });

  // Place a bomb at the center of the player's current tile.
  const placeBomb = (position) => {
    if (activeBomb !== null) {
      return false;
    }

    const { row, column } = worldToGrid(position.x, position.z);

    if (getTile(gameMap.tiles, row, column) !== tileTypes.EMPTY) {
      return false;
    }

    const { x, z } = gridToWorld(row, column);
    const mesh = new Mesh(bombGeometry, bombMaterial);

    mesh.position.set(x, bombRadius, z);
    scene.add(mesh);

    activeBomb = {
      row,
      column,
      mesh,
      detonateAt: performance.now() + bombDelay,
    };

    return true;
  };

  // Detonate the active bomb and update the map.
  const explode = (time) => {
    const { row, column, mesh } = activeBomb;

    scene.remove(mesh);
    activeBomb = null;

    const { affectedTiles, destroyedCrates } = calculateExplosion(
      gameMap.tiles,
      row,
      column,
      explosionRange,
    );

    destroyedCrates.forEach((position) => {
      gameMap.destroyCrate(position.row, position.column);
    });

    // Create visual effects for every affected tile.
    affectedTiles.forEach((position) => {
      const { x, z } = gridToWorld(position.row, position.column);
      const effect = new Mesh(explosionGeometry, explosionMaterial);

      effect.position.set(x, explosionHeight / 2, z);
      explosionGroup.add(effect);
    });

    explosionEndsAt = time + explosionDuration;
  };

  return {
    placeBomb,

    update(time) {
      // Remove expired explosion effects.
      if (explosionEndsAt !== null && time >= explosionEndsAt) {
        explosionGroup.clear();
        explosionEndsAt = null;
      }

      if (activeBomb === null) {
        return;
      }

      if (time >= activeBomb.detonateAt) {
        explode(time);
        return;
      }

      // Make the bomb pulse before exploding.
      const scale = 1 + Math.sin(time / 100) * 0.1;
      activeBomb.mesh.scale.setScalar(scale);
      activeBomb.mesh.position.y = bombRadius * scale;
    },

    dispose() {
      if (activeBomb !== null) {
        scene.remove(activeBomb.mesh);
        activeBomb = null;
      }

      scene.remove(explosionGroup);
      explosionGroup.clear();
      explosionEndsAt = null;

      bombGeometry.dispose();
      bombMaterial.dispose();

      explosionGeometry.dispose();
      explosionMaterial.dispose();
    },
  };
};

export default createBombManager;
