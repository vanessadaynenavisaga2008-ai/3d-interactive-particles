(function () {
  const canvas = document.getElementById('scene');
  const video = document.getElementById('webcam');
  const statusScreen = document.getElementById('status-screen');
  const statusText = document.getElementById('status-text');
  const startBtn = document.getElementById('start-btn');
  const hudHint = document.getElementById('hud-hint');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const soundBtn = document.getElementById('sound-btn');
  const shapeLabel = document.getElementById('shape-label');

  // SAFETY CHECKS
  if (!window.ParticleSystem3D) {
    statusText.textContent = "Error: Particle system not loaded";
    return;
  }

  if (!window.AudioEngine) {
    console.error("AudioEngine missing");
    statusText.textContent = "Error: Audio engine not loaded";
    return;
  }

  const particles = new ParticleSystem3D(canvas, 3000);
  const audioEngine = new AudioEngine();

  let lastPalm = null;
  let lastShapeName = 'sphere';

  function setStatus(msg) {
    statusText.textContent = msg;
  }

  function hideStatusScreen() {
    statusScreen.classList.add('hidden');
  }

  function resolveShape(gesture) {
    if (gesture.isPeaceSign) return 'venus';
    if (gesture.fistIntensity > 0.72) return 'point';
    if (gesture.pinchIntensity > 0.65) return 'heart';
    return 'sphere';
  }

  function onResults(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      particles.setNoHands();
      return;
    }

    hideStatusScreen();

    const landmarks = results.multiHandLandmarks[0];

    if (!window.GestureDetector) {
      console.error("GestureDetector missing");
      return;
    }

    const gesture = GestureDetector.analyze(
      landmarks,
      window.innerWidth,
      window.innerHeight
    );

    const nx = -((gesture.palmCenter.x / window.innerWidth) * 2 - 1);
    const ny = ((gesture.palmCenter.y / window.innerHeight) * 2 - 1);

    particles.setHandInfluence(
      nx,
      ny,
      gesture.pinchIntensity + gesture.fistIntensity * 0.5
    );

    const targetShape = resolveShape(gesture);

    if (targetShape !== lastShapeName) {
      particles.morphTo(targetShape);
      audioEngine.playBurst();
      lastShapeName = targetShape;
    }

    lastPalm = gesture.palmCenter;
  }

  function renderLoop() {
    particles.update(0.016);
    requestAnimationFrame(renderLoop);
  }

  // =========================
  // FIXED MEDIAPIPE CAMERA
  // =========================
  async function init() {
    try {
      setStatus("Requesting camera...");

      const hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults(onResults);

      const camera = new Camera(video, {
        onFrame: async () => {
          await hands.send({ image: video });
        },
        width: 640,
        height: 480,
      });

      await camera.start();

      setStatus("Show your hand");
      setTimeout(hideStatusScreen, 3000);

    } catch (err) {
      console.error(err);
      setStatus("Camera error: " + err.message);
      startBtn.classList.remove('hidden');
      startBtn.textContent = "Retry";
      startBtn.onclick = () => location.reload();
    }
  }

  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    }
  });

  soundBtn.addEventListener('click', () => {
    const isOn = audioEngine.toggle();
    soundBtn.textContent = isOn ? '🔊' : '🔇';
  });

  renderLoop();
  init();
})();