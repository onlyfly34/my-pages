import { useEffect, useRef } from 'preact/hooks';
import * as THREE from 'three';

/**
 * 可拖曳旋轉的線框多面體（Three.js island）。
 * - 以 client:visible 載入，進入視窗才初始化。
 * - 尊重 prefers-reduced-motion：不自動旋轉，只靜態渲染一張。
 * - 卸載時 dispose 幾何 / 材質 / renderer，避免記憶體洩漏。
 */
export default function ThreeDemo() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2256d6';

    const HEIGHT = 320;
    let width = host.clientWidth || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / HEIGHT, 0.1, 100);
    camera.position.z = 3.4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, HEIGHT);
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    const geometry = new THREE.IcosahedronGeometry(1.25, 1);
    const wire = new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), wireframe: true });
    const mesh = new THREE.Mesh(geometry, wire);
    group.add(mesh);

    const vertexGeo = new THREE.IcosahedronGeometry(1.25, 1);
    const points = new THREE.Points(
      vertexGeo,
      new THREE.PointsMaterial({ color: new THREE.Color(accent), size: 0.07 }),
    );
    group.add(points);
    scene.add(group);

    let raf = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let velX = 0.004;
    let velY = 0.006;

    const render = () => renderer.render(scene, camera);
    const loop = () => {
      if (!dragging) {
        group.rotation.y += velX;
        group.rotation.x += velY;
      }
      render();
      raf = requestAnimationFrame(loop);
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.style.cursor = 'grabbing';
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      group.rotation.y += dx * 0.01;
      group.rotation.x += dy * 0.01;
      velX = dx * 0.0015;
      velY = dy * 0.0015;
      if (reduce) render();
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      renderer.domElement.style.cursor = 'grab';
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    };

    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    const ro = new ResizeObserver(() => {
      width = host.clientWidth || width;
      camera.aspect = width / HEIGHT;
      camera.updateProjectionMatrix();
      renderer.setSize(width, HEIGHT);
      render();
    });
    ro.observe(host);

    if (reduce) {
      group.rotation.set(0.5, 0.4, 0);
      render();
    } else {
      loop();
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      geometry.dispose();
      vertexGeo.dispose();
      wire.dispose();
      (points.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      class="three-demo"
      style="min-height:320px;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;background:var(--surface)"
      aria-label="可用滑鼠拖曳旋轉的線框多面體"
    />
  );
}
