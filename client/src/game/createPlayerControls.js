import { Vector2 } from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const moveSpeed = 5;
const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);

const createPlayerControls = (camera, domElement, onLockChange) => {
  const controls = new PointerLockControls(camera, domElement);
  const pressedKeys = new Set();
  const movement = new Vector2();

  const handleKeyDown = (event) => {
    if (!controls.isLocked || !movementKeys.has(event.code)) {
      return;
    }

    event.preventDefault();
    pressedKeys.add(event.code);
  };

  const handleKeyUp = (event) => {
    if (!movementKeys.has(event.code)) {
      return;
    }

    if (controls.isLocked) {
      event.preventDefault();
    }

    pressedKeys.delete(event.code);
  };

  const handleCanvasClick = () => {
    if (!controls.isLocked) {
      controls.lock();
    }
  };

  const handleLock = () => {
    // Reset stale input whenever the player enters pointer lock.
    pressedKeys.clear();
    onLockChange(true);
  };

  const handleUnlock = () => {
    // Prevent held keys from continuing movement after the mouse is released.
    pressedKeys.clear();
    onLockChange(false);
  };

  const handleWindowBlur = () => {
    // Keyup events may be missed when the browser loses focus.
    pressedKeys.clear();
  };

  domElement.addEventListener('click', handleCanvasClick);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleWindowBlur);
  controls.addEventListener('lock', handleLock);
  controls.addEventListener('unlock', handleUnlock);

  return {
    update(deltaTime) {
      if (!controls.isLocked) {
        return;
      }

      movement.set(
        Number(pressedKeys.has('KeyD')) - Number(pressedKeys.has('KeyA')),
        Number(pressedKeys.has('KeyW')) - Number(pressedKeys.has('KeyS')),
      );

      if (movement.lengthSq() === 0) {
        return;
      }

      // Normalize diagonal input to keep movement speed consistent.
      movement.normalize().multiplyScalar(moveSpeed * deltaTime);

      // PointerLockControls uses the camera matrix to determine movement direction.
      camera.updateMatrix();
      controls.moveRight(movement.x);
      controls.moveForward(movement.y);
    },

    dispose() {
      // Remove all listeners so remounting the scene does not duplicate input.
      domElement.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      controls.removeEventListener('lock', handleLock);
      controls.removeEventListener('unlock', handleUnlock);

      if (controls.isLocked) {
        controls.unlock();
      }

      controls.dispose();
    },
  };
};

export default createPlayerControls;
