const ShapeGenerator = {

  sphere(count, radius = 1) {
    const points = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      points.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
      });
    }

    return points;
  },


  heart(count, scale = 1.1) {
    const points = [];

    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2;

      let x = 16 * Math.pow(Math.sin(t), 3);
      let y =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);

      const fill = 0.3 + Math.random() * 0.7;

      x *= fill;
      y *= fill;

      x = (x / 16) * scale;
      y = (y / 17) * scale;

      const z = (Math.random() - 0.5) * 0.25 * scale;

      points.push({
        x,
        y: y + 0.05 * scale,
        z,
      });
    }

    return points;
  },

  point(count, jitter = 0.02) {
    const points = [];

    for (let i = 0; i < count; i++) {
      points.push({
        x: (Math.random() - 0.5) * jitter,
        y: (Math.random() - 0.5) * jitter,
        z: (Math.random() - 0.5) * jitter,
      });
    }

    return points;
  },


  venus(count, scale = 1) {
    const points = [];

    const circleR = 0.42 * scale;
    const circleCenterY = 0.45 * scale;

    const stemTopY = circleCenterY - circleR;
    const stemBottomY = -0.95 * scale;

    const crossY = -0.55 * scale;
    const crossHalfWidth = 0.3 * scale;

    const circleLen = 2 * Math.PI * circleR;
    const stemLen = stemTopY - stemBottomY;
    const crossLen = crossHalfWidth * 2;

    const totalLen = circleLen + stemLen + crossLen;

    const circleCount = Math.round((circleLen / totalLen) * count);
    const stemCount = Math.round((stemLen / totalLen) * count);
    const crossCount = count - circleCount - stemCount;


    for (let i = 0; i < circleCount; i++) {
      const angle = (i / circleCount) * Math.PI * 2;
      const r = circleR * (0.92 + Math.random() * 0.16);

      points.push({
        x: Math.cos(angle) * r,
        y: circleCenterY + Math.sin(angle) * r,
        z: (Math.random() - 0.5) * 0.12 * scale,
      });
    }


    for (let i = 0; i < stemCount; i++) {
      const t = i / stemCount;

      points.push({
        x: (Math.random() - 0.5) * 0.05 * scale,
        y: stemTopY - t * stemLen,
        z: (Math.random() - 0.5) * 0.12 * scale,
      });
    }


    for (let i = 0; i < crossCount; i++) {
      const t = i / crossCount - 0.5;

      points.push({
        x: t * crossLen,
        y: crossY + (Math.random() - 0.5) * 0.05 * scale,
        z: (Math.random() - 0.5) * 0.12 * scale,
      });
    }

    return points;
  },
};

window.ShapeGenerator = ShapeGenerator;