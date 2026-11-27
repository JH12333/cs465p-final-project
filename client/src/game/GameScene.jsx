import { useEffect, useRef, useState } from 'react';
import {
  AmbientLight,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import createGameMap from './createGameMap';
import createPlayerCollision from './createPlayerCollision';
import createPlayerControls from './createPlayerControls';
import { gridToWorld, spawnPoints } from './mapData';

const GameScene = function GameScene() {
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    // Create the scene
    const scene = new Scene();
    scene.background = new Color(0x87ceeb);

    // Create the perspective camera
    const camera = new PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );

    // Position the player at the first spawn point.
    const { row, column } = spawnPoints[0];
    const { x, z } = gridToWorld(row, column);

    camera.position.set(x, 1.7, z);
    camera.lookAt(x + 1, 1.7, z);

    // Create the WebGL renderer
    const renderer = new WebGLRenderer({
      antialias: true,
    });

    renderer.setSize(container.clientWidth, container.clientHeight);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.appendChild(renderer.domElement);

    // Create the grid-based game map.
    const gameMap = createGameMap(scene);

    // Create collision detection using the current map data.
    const playerCollision = createPlayerCollision(gameMap.tiles);

    // Keep pointer lock and keyboard state separate from scene rendering.
    const playerControls = createPlayerControls(
      camera,
      renderer.domElement,
      setIsPlaying,
      playerCollision,
    );

    // Add ambient lighting
    const ambientLight = new AmbientLight(0xffffff, 1.2);

    scene.add(ambientLight);

    // Add directional lighting
    const sunlight = new DirectionalLight(0xffffff, 2);

    sunlight.position.set(5, 10, 5);

    scene.add(sunlight);

    // Handle container resizing
    const handleResize = () => {
      const { clientWidth, clientHeight } = container;

      if (clientWidth === 0 || clientHeight === 0) {
        return;
      }

      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(clientWidth, clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Start the animation loop
    let animationId;
    let previousTime = null;

    const maxFrameGap = 0.25;

    const animate = (time) => {
      const deltaTime = previousTime === null
        ? 0
        : (time - previousTime) / 1000;
      previousTime = time;

      // Skip unusually large gaps to prevent sudden movement.
      if (deltaTime <= maxFrameGap) {
        playerControls.update(deltaTime);
      }

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Clean up when the component unmounts
    return () => {
      cancelAnimationFrame(animationId);

      // Remove pointer lock and keyboard listeners before releasing the renderer.
      playerControls.dispose();

      window.removeEventListener('resize', handleResize);

      gameMap.dispose();

      renderer.dispose();

      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`game-scene${isPlaying ? ' is-playing' : ''}`}
    >
      {!isPlaying && (
        <div className="controls-hint">
          <p>Click to play</p>
          <p>WASD: Move | Mouse: Look around | Esc: Unlock</p>
        </div>
      )}
    </div>
  );
};

export default GameScene;