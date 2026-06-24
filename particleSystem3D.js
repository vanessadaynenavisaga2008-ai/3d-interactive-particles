class ParticleSystem3D {
  constructor(canvas, count = 3000) {
    this.count = count;
    this.canvas = canvas;

    // =========================
    // SAFETY CHECKS (IMPORTANT)
    // =========================
    if (!window.THREE) {
      throw new Error("Three.js is not loaded");
    }

    if (!window.ShapeGenerator) {
      throw new Error("ShapeGenerator is not loaded (check script order)");
    }

    // =========================
    // THREE SETUP
    // =========================
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(0, 0, 5.2);

    // =========================
    // SHAPES
    // =========================
    this.shapes = {
      sphere: ShapeGenerator.sphere(count, 1.3),
      heart: ShapeGenerator.heart(count, 1.7),
      point: ShapeGenerator.point(count),
      venus: ShapeGenerator.venus(count, 1.8),
    };

    this.currentShapeName = "sphere";
    this.targetShapeName = "sphere";

    // =========================
    // BUFFERS
    // =========================
    this.positions = new Float32Array(count * 3);
    this.fromPositions = new Float32Array(count * 3);
    this.toPositions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);

    this._writeShapeInto(this.fromPositions, this.shapes.sphere);
    this._writeShapeInto(this.toPositions, this.shapes.sphere);
    this.positions.set(this.fromPositions);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3)
    );
    this.geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(this.colors, 3)
    );

    this.material = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: this._makeSpriteTexture(),
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    // =========================
    // STATE
    // =========================
    this.morphProgress = 1;
    this.morphDuration = 0.9;

    this.currentRotation = { x: 0, y: 0 };
    this.targetRotation = { x: 0, y: 0 };

    this.scaleFactor = 1;
    this.targetScale = 1;

    this.hue = 195;
    this.targetHue = 195;

    // =========================
    // RESIZE FIX
    // =========================
    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  // =========================
  // FIXED RESIZE
  // =========================
  _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // =========================
  // SPRITE
  // =========================
  _makeSpriteTexture() {
    const size = 64;
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    const c = cv.getContext("2d");

    const grad = c.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );

    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.4, "rgba(255,255,255,0.7)");
    grad.addColorStop(1, "rgba(255,255,255,0)");

    c.fillStyle = grad;
    c.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(cv);
  }

  // =========================
  // SHAPE WRITE
  // =========================
  _writeShapeInto(arr, shapePoints) {
    for (let i = 0; i < this.count; i++) {
      const p = shapePoints[i];
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    }
  }

  // =========================
  // MORPH
  // =========================
  morphTo(shapeName) {
    if (this.targetShapeName === shapeName) return;

    this.fromPositions.set(this.positions);
    this._writeShapeInto(this.toPositions, this.shapes[shapeName]);

    this.targetShapeName = shapeName;
    this.morphProgress = 0;
  }

  setHandInfluence(nx, ny, intensity) {
    this.targetRotation.y = nx * 0.9;
    this.targetRotation.x = -ny * 0.6;
    this.targetScale = 0.85 + intensity * 0.3;
  }

  setHue(h) {
    this.targetHue = h;
  }

  setNoHands() {
    this.targetRotation.x *= 0.98;
    this.targetRotation.y *= 0.98;
  }

  // =========================
  // UPDATE LOOP
  // =========================
  update(dt) {
    // Morph
    if (this.morphProgress < 1) {
      this.morphProgress = Math.min(
        1,
        this.morphProgress + dt / this.morphDuration
      );

      const t = this.morphProgress;
      const eased =
        t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;

      for (let i = 0; i < this.count * 3; i++) {
        this.positions[i] =
          this.fromPositions[i] +
          (this.toPositions[i] - this.fromPositions[i]) * eased;
      }

      this.geometry.attributes.position.needsUpdate = true;
    }

    // Rotation
    this.currentRotation.x +=
      (this.targetRotation.x - this.currentRotation.x) * 0.06;
    this.currentRotation.y +=
      (this.targetRotation.y - this.currentRotation.y) * 0.06;

    this.points.rotation.x = this.currentRotation.x;
    this.points.rotation.y +=
      0.0025 +
      (this.currentRotation.y - this.points.rotation.y) * 0.04;

    // Scale
    this.scaleFactor += (this.targetScale - this.scaleFactor) * 0.08;
    this.points.scale.setScalar(this.scaleFactor);

    // Color
    this.hue += (this.targetHue - this.hue) * 0.05;
    this._applyColor();

    this.renderer.render(this.scene, this.camera);
  }

  // =========================
  // COLOR
  // =========================
  _applyColor() {
    const color = new THREE.Color();

    for (let i = 0; i < this.count; i++) {
      const h = (this.hue + (i % 20) * 0.6) % 360;
      color.setHSL(h / 360, 1, 0.62);

      this.colors[i * 3] = color.r;
      this.colors[i * 3 + 1] = color.g;
      this.colors[i * 3 + 2] = color.b;
    }

    this.geometry.attributes.color.needsUpdate = true;
  }
}

window.ParticleSystem3D = ParticleSystem3D;