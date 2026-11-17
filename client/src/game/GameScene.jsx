import { useEffect, useRef, useState } from 'react';
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  GridHelper,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from 'three';
import createPlayerControls from './createPlayerControls';

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

    camera.position.set(0, 1.7, 8);
    camera.lookAt(0, 1, -3);

    // Create the WebGL renderer
    const renderer = new WebGLRenderer({
      antialias: true,
    });

    renderer.setSize(
      container.clientWidth,
      container.clientHeight,
    );

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2),
    );

    container.appendChild(renderer.domElement);

    // Keep pointer lock and keyboard state separate from scene rendering.
    const playerControls = createPlayerControls(
      camera,
      renderer.domElement,
      setIsPlaying,
    );

    // Create the ground
    const groundGeometry = new PlaneGeometry(
      30,
      30,
    );

    const groundMaterial = new MeshStandardMaterial({
      color: 0x78a86b,
      side: DoubleSide,
    });

    const ground = new Mesh(
      groundGeometry,
      groundMaterial,
    );

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;

    scene.add(ground);

    // Create the ground grid
    const grid = new GridHelper(
      30,
      30,
      0x444444,
      0x888888,
    );

    // Prevent overlapping with the ground
    grid.position.y = 0.01;

    scene.add(grid);

    // Create a test cube
    const cubeGeometry = new BoxGeometry(
      1,
      1,
      1,
    );

    const cubeMaterial = new MeshStandardMaterial({
      color: 0xe67e22,
    });

    const cube = new Mesh(
      cubeGeometry,
      cubeMaterial,
    );

    cube.position.set(0, 0.5, 0);

    scene.add(cube);

    // Add ambient lighting
    const ambientLight = new AmbientLight(
      0xffffff,
      1.2,
    );

    scene.add(ambientLight);

    // Add directional lighting
    const sunlight = new DirectionalLight(
      0xffffff,
      2,
    );

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

    const animate = (time) => {
      // Cap large frame gaps to avoid sudden jumps after a paused tab.
      const deltaTime = previousTime === null
        ? 0
        : Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;

      playerControls.update(deltaTime);
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Clean up when the component unmounts
    return () => {
      cancelAnimationFrame(animationId);

      // Remove pointer lock and keyboard listeners before releasing the renderer.
      playerControls.dispose();

      window.removeEventListener(
        'resize',
        handleResize,
      );

      groundGeometry.dispose();
      groundMaterial.dispose();

      grid.geometry.dispose();
      grid.material.dispose();

      cubeGeometry.dispose();
      cubeMaterial.dispose();

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