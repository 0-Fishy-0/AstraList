import { useEffect, useRef } from "react";
import "./Styles/AstraRings.css";

function AstraRings(props) {
  const { isBackground } = props;
  const sceneRef = useRef(null);
  const outerRef = useRef(null);
  const middleRef = useRef(null);
  const innerRef = useRef(null);
  const coreRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const core = coreRef.current;

    if (!scene || !core) return;

    const ringEls = scene.querySelectorAll(".astra-rings__ring");

    const layers = [
      {
        el: outerRef.current,
        ambientSpeed: 10,
        activeSpeed: 52,
        axisX: 1,
        axisY: 0.28,
        axisZ: 0.1,
        angle: 0,
      },
      {
        el: middleRef.current,
        ambientSpeed: -13,
        activeSpeed: -60,
        axisX: 0.35,
        axisY: 1,
        axisZ: 0.16,
        angle: 0,
      },
      {
        el: innerRef.current,
        ambientSpeed: 16,
        activeSpeed: 68,
        axisX: 0.82,
        axisY: -0.55,
        axisZ: 0.12,
        angle: 0,
      },
    ];

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let pointerX = -10000;
    let pointerY = -10000;

    let proximity = 0;
    let lastTime = performance.now();
    let animationFrame;

    const clamp = (value, min, max) =>
      Math.max(min, Math.min(max, value));

    const smoothstep = (edge0, edge1, x) => {
      const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
      return t * t * (3 - 2 * t);
    };

    const handlePointerMove = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const handlePointerLeave = () => {
      pointerX = -10000;
      pointerY = -10000;
    };

    const animate = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const rect = scene.getBoundingClientRect();

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distance = Math.hypot(
        pointerX - centerX,
        pointerY - centerY
      );

      const wakeOuter = rect.width * 0.72;
      const wakeInner = rect.width * 0.47;

      const targetProximity = reduceMotion
        ? 0
        : 1 - smoothstep(wakeInner, wakeOuter, distance);

      // Smooth acceleration/deceleration.
      proximity +=
        (targetProximity - proximity) *
        (1 - Math.pow(0.0015, dt));

      layers.forEach((layer) => {
        if (!layer.el) return;

        const speed =
          layer.ambientSpeed +
          (layer.activeSpeed - layer.ambientSpeed) * proximity;

        layer.angle += speed * dt;

        // Prevent the angle from growing forever.
        // Modding by 360 causes no visible jump.
        if (Math.abs(layer.angle) > 100000) {
          layer.angle %= 360;
        }

        layer.el.style.transform = `
          rotate3d(
            ${layer.axisX},
            ${layer.axisY},
            ${layer.axisZ},
            ${layer.angle}deg
          )
        `;
      });

      // Core grows near cursor.
      const coreScale = 1 + proximity * 0.32;

      core.style.transform = `
        translateZ(6px)
        rotateZ(10deg)
        rotateX(-64deg)
        scale(${coreScale})
      `;

      // Core glow increases near cursor.
      core.style.boxShadow = `
        0 0 ${14 + proximity * 16}px
          rgba(230, 122, 184, 0.98),

        0 0 ${34 + proximity * 40}px
          rgba(230, 122, 184, ${0.58 + proximity * 0.3}),

        0 0 ${72 + proximity * 78}px
          rgba(230, 122, 184, ${0.24 + proximity * 0.24})
      `;

      // Ring glow increases near cursor.
      ringEls.forEach((ring) => {
        const glow = 10 + proximity * 24;
        const alpha = 0.32 + proximity * 0.48;

        ring.style.filter = `
          drop-shadow(
            0 0 ${glow}px
            rgba(168, 124, 240, ${alpha})
          )
        `;
      });

      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    animationFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);

      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div 
      className={`astra-rings ${isBackground ? 'backgrounded' : ''}`} 
      ref={sceneRef}
    >
      <div className="astra-rings__system">
        <div
          ref={outerRef}
          className="astra-rings__layer"
        >
          <div 
            className={
              `astra-rings__ring
              astra-rings__ring--outer
              ${isBackground ? 'backgrounded' : ''}`} 
          />
        </div>

        <div
          ref={middleRef}
          className="astra-rings__layer"
        >
          <div 
            className={
              `astra-rings__ring
              astra-rings__ring--middle
              ${isBackground ? 'backgrounded' : ''}`} 
          />
        </div>

        <div
          ref={innerRef}
          className="astra-rings__layer"
        >
          <div 
            className={
              `astra-rings__ring
              astra-rings__ring--inner
              ${isBackground ? 'backgrounded' : ''}`} 
          />
        </div>

        <div
          ref={coreRef}
          className="astra-rings__core"
        />
      </div>
    </div>
  );
}

export default AstraRings;