
const mount = document.querySelector('.three-hero-scene');

if (mount) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0, 8.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // LIGHTING
    scene.add(new THREE.HemisphereLight(0xa4efff, 0x10152d, 2.1));

    const keyLight = new THREE.PointLight(0x38a6ff, 9, 8);
    keyLight.position.set(2, 2, 3);
    scene.add(keyLight);

    // MAIN CUBE
    const core = new THREE.Group();
    core.position.set(0.8, 1.5, 0.1);
    core.scale.setScalar(0.85);
    scene.add(core);

    // Solid cube
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.95, 0.95),
      new THREE.MeshPhongMaterial({
        color: 0x1769aa,
        emissive: 0x0e4f82,
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.65,
        shininess: 100
      })
    );
    core.add(cube);

    // Glowing cube edges
    const cubeEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.98, 0.98, 0.98)),
      new THREE.LineBasicMaterial({
        color: 0x38c5ff,
        transparent: true,
        opacity: 0.95
      })
    );
    core.add(cubeEdges);

    // Inner cube
    const innerCube = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.48, 0.48),
      new THREE.MeshBasicMaterial({
        color: 0x38a6ff,
        wireframe: true,
        transparent: true,
        opacity: 0.6
      })
    );
    core.add(innerCube);

    // ORBITAL RINGS
    const orbitRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.009, 8, 120),
      new THREE.MeshBasicMaterial({
        color: 0x38a6ff,
        transparent: true,
        opacity: 0.65
      })
    );

    orbitRing.scale.y = 0.68;
    orbitRing.rotation.set(0.35, 0.15, 0.15);
    orbitRing.position.copy(core.position);
    scene.add(orbitRing);

    const secondRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.007, 8, 100),
      new THREE.MeshBasicMaterial({
        color: 0x1769aa,
        transparent: true,
        opacity: 0.55
      })
    );

    secondRing.scale.y = 0.85;
    secondRing.rotation.set(0.8, 0.3, 0.6);
    secondRing.position.copy(core.position);
    scene.add(secondRing);

    // ORBITING OBJECTS
    const orbiters = [];

    const orbitalObjects = [
      {
        geometry: new THREE.SphereGeometry(0.14, 20, 20),
        color: 0x38c5ff,
        angle: 0
      },
      {
        geometry: new THREE.OctahedronGeometry(0.19),
        color: 0x1769aa,
        angle: Math.PI / 2
      },
      {
        geometry: new THREE.TetrahedronGeometry(0.17),
        color: 0x9b8cff,
        angle: Math.PI
      },
      {
        geometry: new THREE.BoxGeometry(0.2, 0.2, 0.2),
        color: 0xc6f5ff,
        angle: Math.PI * 1.5
      }
    ];

    orbitalObjects.forEach((item, index) => {
      const material = new THREE.MeshPhongMaterial({
        color: item.color,
        emissive: item.color,
        emissiveIntensity: 0.35,
        shininess: 100
      });

      const object = new THREE.Mesh(item.geometry, material);

      // Keep orbiting objects in front of the main cube
      object.position.set(
        Math.cos(item.angle) * 1.55,
        Math.sin(item.angle) * 1.0,
        0.45
      );

      core.add(object);

      orbiters.push({
        mesh: object,
        angle: item.angle,
        speed: 0.35 + index * 0.06
      });
    });

    // SMALL DECORATIVE NODES ON THE CUBE
    const nodes = new THREE.Group();
    const nodeGeometry = new THREE.SphereGeometry(0.025, 10, 10);
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xc6f5ff });

    for (let index = 0; index < 12; index += 1) {
      const angle = index * Math.PI * (3 - Math.sqrt(5));
      const y = 1 - (index / 11) * 2;
      const radius = Math.sqrt(1 - y * y);

      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);

      node.position.set(
        Math.cos(angle) * radius * 0.52,
        y * 0.52,
        Math.sin(angle) * radius * 0.52
      );

      nodes.add(node);
    }

    core.add(nodes);

    // RESIZE
    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;

      if (!width || !height) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    // ANIMATION
    if (!reducedMotion) {
      let previousTime = 0;

      const pointer = { x: 0, y: 0 };
      const target = { x: 0, y: 0 };

      mount.parentElement.addEventListener('pointermove', (event) => {
        const bounds = mount.parentElement.getBoundingClientRect();

        target.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.22;
        target.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.16;
      }, { passive: true });

      mount.parentElement.addEventListener('pointerleave', () => {
        target.x = 0;
        target.y = 0;
      }, { passive: true });

      const animate = (timestamp) => {
        if (document.hidden) {
          previousTime = timestamp;
          requestAnimationFrame(animate);
          return;
        }

        const delta = previousTime
          ? Math.min((timestamp - previousTime) / 1000, 0.05)
          : 0;

        previousTime = timestamp;
        const time = timestamp / 1000;

        pointer.x += (target.x - pointer.x) * 0.035;
        pointer.y += (target.y - pointer.y) * 0.035;

        // Main cube movement
        core.rotation.y = time * 0.2 + pointer.x;
        core.rotation.x = Math.sin(time * 0.28) * 0.1 + pointer.y;
        core.position.y = 1.5 + Math.sin(time * 0.7) * 0.07;

        // Inner cube movement
        innerCube.rotation.y = -time * 0.3;
        innerCube.rotation.x = time * 0.2;

        // Orbital rings
        orbitRing.rotation.z += delta * 0.11;
        secondRing.rotation.y -= delta * 0.07;

        // Orbiting objects
        orbiters.forEach((item) => {
          item.angle += delta * item.speed;

          item.mesh.position.x = Math.cos(item.angle) * 1.55;
          item.mesh.position.y = Math.sin(item.angle) * 1.0;

          // Move slightly forward and backward
          item.mesh.position.z = 0.45 + Math.sin(item.angle * 2) * 0.18;

          item.mesh.rotation.x += delta * 0.8;
          item.mesh.rotation.y += delta * 1.0;
        });

        nodes.rotation.y = -time * 0.1;

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    }

    window.addEventListener('beforeunload', () => {
      resizeObserver.disconnect();
      renderer.dispose();
    }, { once: true });

  } catch (_error) {
    mount.hidden = true;
  }
}
