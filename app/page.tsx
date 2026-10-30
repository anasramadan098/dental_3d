"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const FRAME_COUNT = 174;
const FRAME_PATH = "/imgs/frames/frame_";
const SCROLL_DISTANCE = 3000;
const WHATSAPP_URL =
  "https://wa.me/?text=%D9%85%D8%B1%D8%AD%D8%A8%D9%8B%D8%A7%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AE%D8%AF%D9%85%D8%A7%D8%AA%20%D8%A7%D9%84%D8%B9%D9%8A%D8%A7%D8%AF%D8%A9.";

const scenes = [
  {
    title: "ابتسامتك، بثقة.",
    description: "عناية دقيقة. ونتيجة تشبهك.",
    position: "sceneTopLeft",
  },
  {
    title: "تفاصيل تصنع الفرق.",
    description: "تقنيات حديثة، بلمسة هادئة.",
    position: "sceneTopRight",
  },
  {
    title: "جمال طبيعي.",
    description: "لأن أجمل ابتسامة هي ابتسامتك.",
    position: "sceneBottomLeft",
  },
  {
    title: "خطوتك الأولى تبدأ هنا.",
    description: "نحن هنا للإجابة عن أسئلتك.",
    position: "sceneBottomRight",
  },
];

function frameSource(frame: number) {
  return `${FRAME_PATH}${String(frame + 1).padStart(4, "0")}.webp`;
}

export default function Home() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRefs = useRef<(HTMLElement | null)[]>([]);
  const cueRef = useRef<HTMLDivElement>(null);
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) return;

    let activeFrame = 0;
    let lastDrawnFrame = -1;
    let animationFrame = 0;
    let cancelled = false;
    let failedFrames = 0;
    let pixelWidth = 0;
    let pixelHeight = 0;
    const images: HTMLImageElement[] = new Array(FRAME_COUNT);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    const drawFrame = (index: number) => {
      const image = images[index];
      if (!image?.naturalWidth || !pixelWidth || !pixelHeight) return;

      const scale = Math.max(
        pixelWidth / image.naturalWidth,
        pixelHeight / image.naturalHeight,
      );
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      context.drawImage(
        image,
        (pixelWidth - drawWidth) / 2,
        (pixelHeight - drawHeight) / 2,
        drawWidth,
        drawHeight,
      );
      lastDrawnFrame = index;
    };

    const requestDraw = (frame: number) => {
      activeFrame = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(frame)));
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        if (images[activeFrame]?.naturalWidth) {
          drawFrame(activeFrame);
        }
      });
    };

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      pixelWidth = Math.round(canvas.clientWidth * pixelRatio);
      pixelHeight = Math.round(canvas.clientHeight * pixelRatio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        if (images[activeFrame]?.naturalWidth) {
          drawFrame(activeFrame);
        } else if (lastDrawnFrame >= 0) {
          drawFrame(lastDrawnFrame);
        }
      }
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    resizeCanvas();

    const loadImage = async (index: number) => {
      const image = new Image();
      images[index] = image;
      image.src = frameSource(index);

      try {
        await image.decode();
        if (cancelled) return;
        if (index === 0) {
          setFirstFrameReady(true);
          requestDraw(0);
        } else if (index === activeFrame) {
          requestDraw(index);
        }
      } catch {
        if (!cancelled) failedFrames += 1;
      }
    };

    const preloadFrames = async () => {
      await loadImage(0);
      if (cancelled) return;

      const queue = Array.from({ length: FRAME_COUNT - 1 }, (_, index) => index + 1);
      let nextIndex = 0;
      const worker = async () => {
        while (!cancelled) {
          const index = nextIndex;
          nextIndex += 1;
          if (index >= queue.length) return;
          await loadImage(queue[index]);
        }
      };

      await Promise.all(Array.from({ length: 6 }, () => worker()));
      if (!cancelled && failedFrames > 0) setLoadError(true);
    };

    void preloadFrames();

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const frameProgress = { frame: 0 };
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: `+=${SCROLL_DISTANCE}`,
          pin: true,
          scrub: true,
          anticipatePin: 1,
        },
      });

      timeline.to(frameProgress, {
        frame: FRAME_COUNT - 1,
        duration: FRAME_COUNT,
        ease: "none",
        onUpdate: () => requestDraw(frameProgress.frame),
      });

      if (cueRef.current) {
        timeline.to(
          cueRef.current,
          { autoAlpha: 0, duration: 4, ease: "none" },
          0,
        );
      }

      const sceneRanges = [
        { start: 0, end: 40 },
        { start: 40, end: 90 },
        { start: 90, end: 140 },
        { start: 140, end: FRAME_COUNT },
      ];

      sceneRefs.current.forEach((element, index) => {
        if (!element) return;
        const { start, end } = sceneRanges[index];
        const fadeDuration = 5;

        if (index > 0) {
          timeline.fromTo(
            element,
            { autoAlpha: 0 },
            {
              autoAlpha: 1,
              duration: fadeDuration,
              ease: "power1.out",
              immediateRender: false,
            },
            start,
          );
        }

        if (index < sceneRanges.length - 1) {
          timeline.to(
            element,
            {
              autoAlpha: 0,
              duration: fadeDuration,
              ease: "power1.in",
            },
            end - fadeDuration,
          );
        }
      });
    }, sectionRef);

    return () => {
      cancelled = true;
      ctx.revert();
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrame);
      images.forEach((image) => {
        image.onload = null;
        image.onerror = null;
        image.src = "";
      });
    };
  }, []);

  return (
    <main className="page" dir="rtl">
      <section
        className="story"
        id="home"
        ref={sectionRef}
        aria-label="رعاية أسنان تليق بابتسامتك"
      >
        <div className="fallbackVisual" aria-hidden="true">
          <div className="fallbackOrb" />
          <div className="fallbackRing" />
        </div>
        <canvas
          ref={canvasRef}
          className={`canvas ${firstFrameReady ? "canvasReady" : ""}`}
          aria-hidden="true"
        />
        <div className="overlay" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />

        <div className="sceneLayer">
          {scenes.map((scene, index) => (
            <article
              className={`scene ${scene.position} ${index === 0 ? "sceneInitial" : ""}`}
              key={scene.title}
              ref={(element) => {
                sceneRefs.current[index] = element;
              }}
            >
              <h1>{scene.title}</h1>
              <p>{scene.description}</p>
              {index === scenes.length - 1 && (
                <a
                  className="cta"
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  تواصل عبر واتساب <span aria-hidden="true">↗</span>
                </a>
              )}
            </article>
          ))}
        </div>

        {!firstFrameReady && (
          <div className="loader" role="status">
            {loadError ? "تعذّر تحميل بعض الصور" : "لحظات..."}
          </div>
        )}

        <div className="scrollCue" ref={cueRef}>
          <span>مرّر للاكتشاف</span>
          <span className="scrollArrow" aria-hidden="true">↓</span>
        </div>
      </section>
    </main>
  );
}
