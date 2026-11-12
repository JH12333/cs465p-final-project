import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function GameScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    // Create the scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    // Create the perspective camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );

    camera.position.set(0, 1.7, 8);
    camera.lookAt(0, 1, -3);

    // Create the WebGL renderer
    const renderer = new THREE.WebGLRenderer({
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

    // Create the ground
    const groundGeometry = new THREE.PlaneGeometry(
      30,
      30,
    );

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x78a86b,
      side: THREE.DoubleSide,
    });

    const ground = new THREE.Mesh(
      groundGeometry,
      groundMaterial,
    );

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;

    scene.add(ground);

    // Create the ground grid
    const grid = new THREE.GridHelper(
      30,
      30,
      0x444444,
      0x888888,
    );

    // Prevent overlapping with the ground
    grid.position.y = 0.01;

    scene.add(grid);

    // Create a test cube
    const cubeGeometry = new THREE.BoxGeometry(
      1,
      1,
      1,
    );

    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe67e22,
    });

    const cube = new THREE.Mesh(
      cubeGeometry,
      cubeMaterial,
    );

    cube.position.set(0, 0.5, 0);

    scene.add(cube);

    // Add ambient lighting
    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      1.2,
    );

    scene.add(ambientLight);

    // Add directional lighting
    const sunlight = new THREE.DirectionalLight(
      0xffffff,
      2,
    );

    sunlight.position.set(5, 10, 5);

    scene.add(sunlight);

    // Handle container resizing
    function handleResize() {
      const { clientWidth, clientHeight } = container;

      if (clientWidth === 0 || clientHeight === 0) {
        return;
      }

      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(clientWidth, clientHeight);
    }

    window.addEventListener('resize', handleResize);

    // Start the animation loop
    let animationId;

    function animate() {
      animationId = requestAnimationFrame(animate);

      renderer.render(scene, camera);
    }

    animate();

    // Clean up when the component unmounts
    return () => {
      cancelAnimationFrame(animationId);

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
      className="game-scene"
    />
  );
}