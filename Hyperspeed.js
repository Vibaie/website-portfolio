import * as THREE from 'three';
import { BloomEffect, EffectComposer, EffectPass, RenderPass, SMAAEffect, SMAAPreset } from 'postprocessing';

const OPTIONS = {
  distortion: 'mountainDistortion',
  length: 400,
  roadWidth: 9,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  totalSideLightSticks: 50,
  lightPairsPerRoadWay: 50,
  movingAwaySpeed: [60, 80],
  movingCloserSpeed: [-120, -160],
  carLightsLength: [20, 60],
  carShiftX: [-0.2, 0.2],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0x131318,
    brokenLines: 0x131318,
    leftCars: [0xe10600, 0xff2e2e, 0xb00500],
    rightCars: [0xffffff, 0xdddddd, 0xaaaaaa], // Red vs White/Silver tracks
    sticks: 0xe10600
  }
};

const rand = (min, max) => min + Math.random() * (max - min);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

class HyperspeedScene {
  constructor(container, options = OPTIONS) {
    this.container = container;
    this.options = options;
    this.clock = new THREE.Clock();
    this.trails = [];
    this.sticks = [];
    this.disposed = false;

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = 'hyperspeed-canvas';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.scene.fog = new THREE.Fog(options.colors.background, 45, 430);

    this.camera = new THREE.PerspectiveCamera(options.fov, 1, 0.1, 900);
    this.camera.position.set(0, 8.5, 34);
    this.camera.lookAt(0, 3.4, -145);

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.bloomPass = new EffectPass(
      this.camera,
      new BloomEffect({
        intensity: 2.6,
        luminanceThreshold: 0.04,
        luminanceSmoothing: 0.12,
        mipmapBlur: true
      })
    );
    this.smaaPass = new EffectPass(this.camera, new SMAAEffect({ preset: SMAAPreset.MEDIUM }));
    this.renderPass.renderToScreen = false;
    this.bloomPass.renderToScreen = false;
    this.smaaPass.renderToScreen = true;
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.smaaPass);

    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
    window.addEventListener('resize', this.resize);

    this.build();
    this.resize();
    this.tick();
  }

  themeScale() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 0.62 : 1;
  }

  curvePoint(t, laneOffset) {
    const z = 24 - t * this.options.length;
    const mountain = Math.sin(t * Math.PI * 1.35) * 18 + Math.sin(t * Math.PI * 3.6) * 6;
    const x = laneOffset + mountain * Math.pow(t, 1.2);
    const y = 0.28 + Math.sin(t * Math.PI * 1.9) * 5.5 * Math.pow(t, 1.15) + t * 7;
    return new THREE.Vector3(x, y, z);
  }

  makeCurve(laneOffset, start = 0, end = 1, samples = 120) {
    const points = [];
    for (let i = 0; i <= samples; i += 1) {
      const p = start + (end - start) * (i / samples);
      points.push(this.curvePoint(p, laneOffset));
    }
    return new THREE.CatmullRomCurve3(points);
  }

  makeTube(curve, radius, color, opacity = 1) {
    const geometry = new THREE.TubeGeometry(curve, 160, radius, 8, false);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    return mesh;
  }

  buildRoad() {
    const roadShape = new THREE.Shape();
    roadShape.moveTo(-this.options.roadWidth - this.options.islandWidth, 24);
    roadShape.lineTo(this.options.roadWidth + this.options.islandWidth, 24);
    roadShape.lineTo(this.options.roadWidth * 7.5, -this.options.length);
    roadShape.lineTo(-this.options.roadWidth * 7.5, -this.options.length);
    roadShape.lineTo(-this.options.roadWidth - this.options.islandWidth, 24);

    const geometry = new THREE.ShapeGeometry(roadShape);
    const material = new THREE.MeshBasicMaterial({
      color: this.options.colors.roadColor,
      transparent: true,
      opacity: 0.74
    });
    const road = new THREE.Mesh(geometry, material);
    road.rotation.x = -Math.PI / 2;
    road.position.y = -0.04;
    this.scene.add(road);

    const grid = new THREE.GridHelper(620, 46, 0x260000, 0x151515);
    grid.position.set(0, 0.02, -180);
    grid.material.transparent = true;
    grid.material.opacity = 0.26;
    this.scene.add(grid);
  }

  buildLightTrails() {
    const redLanes = [-6.8, -5.7, -4.65, -3.55, -2.45];
    const whiteLanes = [2.4, 3.45, 4.55, 5.65, 6.75];

    redLanes.forEach((lane, index) => {
      const color = pick(this.options.colors.leftCars);
      const mesh = this.makeTube(this.makeCurve(lane + rand(-0.14, 0.14)), 0.085 + index * 0.009, color, 0.86);
      this.trails.push({ mesh, baseX: lane, speed: rand(0.12, 0.2), phase: rand(0, Math.PI * 2), side: -1 });
    });

    whiteLanes.forEach((lane, index) => {
      const color = pick(this.options.colors.rightCars);
      const mesh = this.makeTube(this.makeCurve(lane + rand(-0.14, 0.14)), 0.075 + index * 0.008, color, 0.82);
      this.trails.push({ mesh, baseX: lane, speed: rand(0.1, 0.16), phase: rand(0, Math.PI * 2), side: 1 });
    });

    for (let i = 0; i < 18; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const start = rand(0.02, 0.76);
      const len = rand(0.035, 0.12);
      const lane = side * rand(4.2, 7.4);
      const color = side < 0 ? pick(this.options.colors.leftCars) : pick(this.options.colors.rightCars);
      const mesh = this.makeTube(this.makeCurve(lane, start, Math.min(start + len, 1), 24), rand(0.08, 0.15), color, rand(0.42, 0.74));
      this.trails.push({ mesh, baseX: lane, speed: rand(0.2, 0.36), phase: rand(0, Math.PI * 2), side });
    }
  }

  buildSideSticks() {
    const geometry = new THREE.BoxGeometry(0.22, 2.2, 0.22);
    for (let i = 0; i < this.options.totalSideLightSticks; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const material = new THREE.MeshBasicMaterial({
        color: i % 4 === 0 ? 0xff102a : this.options.colors.sticks,
        transparent: true,
        opacity: 0.76,
        blending: THREE.AdditiveBlending
      });
      const stick = new THREE.Mesh(geometry, material);
      stick.userData = {
        t: i / this.options.totalSideLightSticks,
        speed: rand(0.075, 0.16),
        side,
        lane: side * rand(9.5, 13.5)
      };
      this.scene.add(stick);
      this.sticks.push(stick);
    }
  }

  buildAtmosphere() {
    const light = new THREE.PointLight(0xb00000, 3.4, 230);
    light.position.set(-18, 20, -40);
    this.scene.add(light);

    const fill = new THREE.PointLight(0xff5a5a, 0.85, 180);
    fill.position.set(24, 18, -70);
    this.scene.add(fill);
  }

  build() {
    this.buildRoad();
    this.buildLightTrails();
    this.buildSideSticks();
    this.buildAtmosphere();
  }

  resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  tick() {
    if (this.disposed) return;
    const elapsed = this.clock.getElapsedTime();
    const scale = this.themeScale();

    this.trails.forEach((trail, index) => {
      trail.mesh.position.x = Math.sin(elapsed * trail.speed + trail.phase) * (index % 3 === 0 ? 0.28 : 0.12);
      trail.mesh.material.opacity = (trail.side < 0 ? 0.86 : 0.72) * scale;
    });

    this.sticks.forEach(stick => {
      stick.userData.t = (stick.userData.t + stick.userData.speed * 0.006) % 1;
      const p = this.curvePoint(stick.userData.t, stick.userData.lane);
      stick.position.copy(p);
      stick.position.y += 1.1;
      stick.scale.y = 0.8 + stick.userData.t * 1.5;
      stick.material.opacity = (0.2 + stick.userData.t * 0.7) * scale;
    });

    this.camera.position.x = Math.sin(elapsed * 0.18) * 1.2;
    this.camera.position.y = 8.2 + Math.sin(elapsed * 0.24) * 0.45;
    this.camera.lookAt(Math.sin(elapsed * 0.12) * 8, 4.2, -155);
    this.composer.render();
    requestAnimationFrame(this.tick);
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
    this.composer.dispose();
    this.container.replaceChildren();
  }
}

function initHyperspeed() {
  const container = document.getElementById('hyperspeed-bg');
  if (!container || container.dataset.ready) return;
  container.dataset.ready = 'true';
  new HyperspeedScene(container);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHyperspeed);
} else {
  initHyperspeed();
}
