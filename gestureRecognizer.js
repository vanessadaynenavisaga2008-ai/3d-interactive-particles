
const GestureDetector = {
  analyze(landmarks, width, height) {
    const toPx = (lm) => ({ x: lm.x * width, y: lm.y * height });

    const wrist = toPx(landmarks[0]);
    const middleMcp = toPx(landmarks[9]);

    const palmCenter = {
      x: (wrist.x + middleMcp.x) / 2,
      y: (wrist.y + middleMcp.y) / 2,
    };

    const handScale = dist(wrist, middleMcp) || 1;

  
    const thumbTip = toPx(landmarks[4]);
    const indexTip = toPx(landmarks[8]);
    const pinchDist = dist(thumbTip, indexTip) / handScale;
    const pinchIntensity = clamp01(1 - pinchDist / 1.4);

   
    const fingerTips = [8, 12, 16, 20].map((i) => toPx(landmarks[i]));
    const fingerPips = [6, 10, 14, 18].map((i) => toPx(landmarks[i]));

    let curlSum = 0;
    for (let i = 0; i < 4; i++) {
      const tipToWrist = dist(fingerTips[i], wrist);
      const pipToWrist = dist(fingerPips[i], wrist);
      curlSum += clamp01(1 - (tipToWrist - pipToWrist) / handScale - 0.5);
    }
    const fistIntensity = clamp01(curlSum / 4);

    
    const indexExtended = isExtended(landmarks, 8, 6, 0);
    const middleExtended = isExtended(landmarks, 12, 10, 0);
    const ringCurled = !isExtended(landmarks, 16, 14, 0);
    const pinkyCurled = !isExtended(landmarks, 20, 18, 0);

    const isPeaceSign =
      indexExtended && middleExtended && ringCurled && pinkyCurled;

    return { palmCenter, pinchIntensity, fistIntensity, isPeaceSign };
  },
};

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function isExtended(landmarks, tipIdx, pipIdx, wristIdx) {
  const wrist = landmarks[wristIdx];
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
  const pipDist = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
  return tipDist > pipDist * 1.15;
}

window.GestureDetector = GestureDetector;