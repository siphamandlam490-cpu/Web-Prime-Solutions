const mount = document.querySelector('.three-hero-scene');

if (mount) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0, 8.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xa4efff, 0x10152d, 2.1));
    const keyLight = new THREE.PointLight(0x38a6ff, 9, 8);
    keyLight.position.set(2, 2, 3);
    scene.add(keyLight);

    const core = new THREE.Group();
    core.position.set(1.35, 1.7, 0.1);
    core.scale.setScalar(0.75);
    scene.add(core);

    const coreShell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.56, 1),
      new THREE.MeshBasicMaterial({ color: 0x38a6ff, wireframe: true, transparent: true, opacity: 0.78 })
    );
    core.add(coreShell);

    const coreGlow = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.39, 2),
      new THREE.MeshPhongMaterial({ color: 0x1769aa, emissive: 0x0e4f82, emissiveIntensity: 0.5, transparent: true, opacity: 0.72, shininess: 90 })
    );
    core.add(coreGlow);

    const cyanRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.78, 0.012, 8, 100),
      new THREE.MeshBasicMaterial({ color: 0x38a6ff, transparent: true, opacity: 0.8 })
    );
    cyanRing.rotation.set(0.95, 0.25, 0.35);
    core.add(cyanRing);

    const violetRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.008, 8, 100),
      new THREE.MeshBasicMaterial({ color: 0x1769aa, transparent: true, opacity: 0.65 })
    );
    violetRing.rotation.set(0.15, 1.1, 0.72);
    core.add(violetRing);

    const nodes = new THREE.Group();
    const nodeGeometry = new THREE.SphereGeometry(0.027, 10, 10);
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xc6f5ff });
    for (let index = 0; index < 12; index += 1) {
      const angle = index * Math.PI * (3 - Math.sqrt(5));
      const y = 1 - (index / 11) * 2;
      const radius = Math.sqrt(1 - y * y);
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.set(Math.cos(angle) * radius * 0.59, y * 0.59, Math.sin(angle) * radius * 0.59);
      nodes.add(node);
    }
    core.add(nodes);

    const satellite = new THREE.Group();
    satellite.position.set(-1.8, 1.45, 0.15);
    satellite.scale.setScalar(0.48);
    scene.add(satellite);
    const satelliteMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.48, 0),
      new THREE.MeshBasicMaterial({ color: 0x1769aa, wireframe: true, transparent: true, opacity: 0.75 })
    );
    satellite.add(satelliteMesh);
    const satelliteRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.69, 0.012, 8, 72),
      new THREE.MeshBasicMaterial({ color: 0x38a6ff, transparent: true, opacity: 0.66 })
    );
    satelliteRing.rotation.set(0.85, 0.35, 0.2);
    satellite.add(satelliteRing);

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
        const delta = previousTime ? Math.min((timestamp - previousTime) / 1000, 0.05) : 0;
        previousTime = timestamp;
        const time = timestamp / 1000;
        pointer.x += (target.x - pointer.x) * 0.035;
        pointer.y += (target.y - pointer.y) * 0.035;
        core.rotation.y = time * 0.2 + pointer.x;
        core.rotation.x = Math.sin(time * 0.28) * 0.1 + pointer.y;
        core.position.y = 1.7 + Math.sin(time * 0.7) * 0.07;
        cyanRing.rotation.z += delta * 0.11;
        violetRing.rotation.y -= delta * 0.07;
        nodes.rotation.y = -time * 0.1;
        satellite.rotation.x = time * 0.22;
        satellite.rotation.y = -time * 0.3;
        satellite.position.y = 1.45 + Math.sin(time * 0.8) * 0.08;
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
