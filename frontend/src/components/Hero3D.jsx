import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Hero3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090D14, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 14, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 2. Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x3B82F6, 1.2);
    dirLight.position.set(5, 12, 8);
    scene.add(dirLight);

    const cityGroup = new THREE.Group();
    scene.add(cityGroup);

    // 3. Ground grid plate (subtle dark plane)
    const gridHelper = new THREE.GridHelper(24, 24, 0x1E293B, 0x131C2E);
    gridHelper.position.y = -0.05;
    cityGroup.add(gridHelper);

    // 4. Urban Building Blocks (Minimalist low-poly monoliths)
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0F172A,
      roughness: 0.8,
      metalness: 0.2,
      wireframe: false,
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x1E293B });

    const buildingPositions = [
      [-5, -4, 2, 3, 2],
      [-5, 3, 2.5, 4, 2],
      [4, -4, 2.2, 3.5, 1.8],
      [5, 3, 2, 2.8, 2],
      [-8, -1, 1.8, 2.2, 1.8],
      [8, 0, 2, 3, 2],
      [-2, 6, 2, 2.5, 2],
      [2, -7, 2, 3.2, 2],
      [-7, 6, 2, 2, 2],
      [7, -6, 1.5, 2, 1.5],
    ];

    buildingPositions.forEach(([x, z, w, h, d]) => {
      const geom = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geom, buildingMat);
      mesh.position.set(x, h / 2, z);
      cityGroup.add(mesh);

      const edges = new THREE.EdgesGeometry(geom);
      const line = new THREE.LineSegments(edges, edgeMat);
      line.position.copy(mesh.position);
      cityGroup.add(line);
    });

    // 5. Road Corridors (Bengaluru-like radial and cross grid)
    const roadMat = new THREE.MeshBasicMaterial({ color: 0x1E293B });
    const roads = [
      // Major east-west highway
      { w: 22, d: 1.2, x: 0, z: 0 },
      // North-south arterial
      { w: 1.2, d: 22, x: 0, z: 0 },
      // Diagonal ring road connector
      { w: 18, d: 0.9, x: 0, z: 4.5 },
      { w: 18, d: 0.9, x: 0, z: -4.5 },
      { w: 0.9, d: 18, x: -4.5, z: 0 },
      { w: 0.9, d: 18, x: 4.5, z: 0 },
    ];

    roads.forEach(({ w, d, x, z }) => {
      const roadGeom = new THREE.PlaneGeometry(w, d);
      const roadMesh = new THREE.Mesh(roadGeom, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.set(x, 0.01, z);
      cityGroup.add(roadMesh);
    });

    // 6. Active AI Route Path (Glowing cyan/blue spline connecting corridors)
    const routePoints = [
      new THREE.Vector3(-9, 0.08, 0),
      new THREE.Vector3(-4.5, 0.08, 0),
      new THREE.Vector3(-4.5, 0.08, 4.5),
      new THREE.Vector3(0, 0.08, 4.5),
      new THREE.Vector3(0, 0.08, 0),
      new THREE.Vector3(4.5, 0.08, 0),
      new THREE.Vector3(4.5, 0.08, -4.5),
      new THREE.Vector3(9, 0.08, -4.5),
    ];
    const routeCurve = new THREE.CatmullRomCurve3(routePoints, false, 'catmullrom', 0.2);
    const curvePoints = routeCurve.getPoints(120);
    const routeGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const routeMat = new THREE.LineBasicMaterial({
      color: 0x3B82F6,
      linewidth: 3,
    });
    const routeLine = new THREE.Line(routeGeom, routeMat);
    cityGroup.add(routeLine);

    // 7. Congestion Hotspot Nodes (Intersections with restrained pulse markers)
    const hotspotCoords = [
      { x: 0, z: 0, label: 'Silk Board', color: 0xF59E0B, radius: 0.6 },
      { x: -4.5, z: 0, label: 'Sony World', color: 0xEF4444, radius: 0.7 },
      { x: 4.5, z: 0, label: 'Trinity Circle', color: 0xEF4444, radius: 0.65 },
      { x: 0, z: 4.5, label: 'Hebbal Flyover', color: 0xF97316, radius: 0.6 },
    ];

    const hotspotMeshes = [];
    hotspotCoords.forEach(({ x, z, color, radius }) => {
      // Base circle
      const circleGeom = new THREE.RingGeometry(0.2, radius, 32);
      const circleMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const circleMesh = new THREE.Mesh(circleGeom, circleMat);
      circleMesh.rotation.x = -Math.PI / 2;
      circleMesh.position.set(x, 0.04, z);
      cityGroup.add(circleMesh);

      // Pulse ring
      const pulseGeom = new THREE.RingGeometry(radius, radius + 0.35, 32);
      const pulseMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
      });
      const pulseMesh = new THREE.Mesh(pulseGeom, pulseMat);
      pulseMesh.rotation.x = -Math.PI / 2;
      pulseMesh.position.set(x, 0.05, z);
      cityGroup.add(pulseMesh);

      hotspotMeshes.push({ base: circleMesh, pulse: pulseMesh, maxRadius: radius + 0.5 });
    });

    // 8. Dynamic Traffic Flow Pulses (moving vehicles along corridors)
    const trafficCount = 35;
    const trafficParticles = [];
    const particleGeom = new THREE.BoxGeometry(0.25, 0.1, 0.12);

    for (let i = 0; i < trafficCount; i++) {
      const isRouteVehicle = i % 3 === 0;
      const partMat = new THREE.MeshBasicMaterial({
        color: isRouteVehicle ? 0x60A5FA : 0x94A3B8,
      });
      const pMesh = new THREE.Mesh(particleGeom, partMat);

      // Distribute along corridors
      const t = Math.random();
      const pt = routeCurve.getPoint(t);
      pMesh.position.copy(pt);
      pMesh.position.y = 0.12;

      cityGroup.add(pMesh);
      trafficParticles.push({
        mesh: pMesh,
        progress: t,
        speed: 0.0008 + Math.random() * 0.0012,
      });
    }

    // 9. Subtle Interactive Mouse Movement
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / height - 0.5) * 2;
    };
    container.addEventListener('mousemove', onMouseMove);

    // 10. Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera sway based on mouse
      camera.position.x += (mouseX * 2.5 - camera.position.x) * 0.02;
      camera.position.y += (14 + mouseY * 1.5 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      // Subtle slow city rotation
      cityGroup.rotation.y = Math.sin(elapsedTime * 0.1) * 0.08;

      // Animate traffic particles along route
      trafficParticles.forEach((tp) => {
        tp.progress = (tp.progress + tp.speed) % 1;
        const pos = routeCurve.getPoint(tp.progress);
        tp.mesh.position.copy(pos);
        tp.mesh.position.y = 0.12;

        const tangent = routeCurve.getTangent(tp.progress);
        tp.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tangent);
      });

      // Pulse hotspot indicators
      hotspotMeshes.forEach((hm, idx) => {
        const scale = 1 + Math.sin(elapsedTime * 2.5 + idx) * 0.25;
        hm.pulse.scale.set(scale, scale, 1);
        hm.pulse.material.opacity = Math.max(0.05, 0.4 - scale * 0.15);
      });

      renderer.render(scene, camera);
    };

    animate();

    // 11. Resize handling
    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] lg:h-[560px] rounded-2xl overflow-hidden bg-gradient-to-b from-surface/40 via-surface/10 to-transparent border border-surface-border/50">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      {/* Overlay caption with technical precision */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-surface/80 backdrop-blur-md px-3 py-2 rounded-lg border border-surface-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          <span>Bengaluru Road Topology Sim</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">16 Arterial Corridors</span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline text-amber-400">4 Hotspot Nodes</span>
        </div>
      </div>
    </div>
  );
}
