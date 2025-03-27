/* eslint-disable */
// @ts-nocheck
"use client";

import { useEffect, useRef } from "react";
import { Element, SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.filter.js";

const HeroHomeAnimation = () => {
  const svgRef = useRef(null);

  const containerWidth = useRef(null);
  const containerHeight = useRef(null);

  const circle1 = useRef(null);
  const wormCircle1 = useRef(null);
  const worm1 = useRef(null);

  const circle2 = useRef(null);
  const wormCircle2 = useRef(null);
  const worm2 = useRef(null);

  const circle3 = useRef(null);
  const wormCircle3 = useRef(null);
  const worm3 = useRef(null);

  const circle4 = useRef(null);
  const wormCircle4 = useRef(null);
  const worm4 = useRef(null);

  const circleTL = useRef(null);
  const wormCircleTL = useRef(null);
  const wormTL = useRef(null);

  const circleBL = useRef(null);
  const wormCircleBL = useRef(null);
  const wormBL = useRef(null);

  const circleTR = useRef(null);
  const wormCircleTR = useRef(null);
  const wormTR = useRef(null);

  const circleBR = useRef(null);
  const wormCircleBR = useRef(null);
  const wormBR = useRef(null);

  const yOffset = 60;

  const drawCircle1 = (draw: Element) => {
    const existingPath = document.getElementById("circle1");
    if (existingPath) return null;

    let xMiddle = parseFloat((containerWidth.current / 2).toFixed(1));
    let yMiddle = parseFloat((containerHeight.current / 2).toFixed(1));

    circle1.current = drawCircle(draw, [xMiddle - 28, yMiddle + 12], 223, "#19FF83", "#28B86A");
    circle1.current.id("circle1");

    let animationPaths = animateCircle(draw, circle1.current, "toBottom", "#19FF83", "#28B86A");
    wormCircle1.current = animationPaths[0];
    worm1.current = animationPaths[1];
  };

  const drawCircle2 = (draw: Element) => {
    const existingPath = document.getElementById("circle2");
    if (existingPath) return null;

    let xMiddle = parseFloat((containerWidth.current / 2).toFixed(1));
    let yMiddle = parseFloat((containerHeight.current / 2).toFixed(1));

    circle2.current = drawCircle(draw, [xMiddle + 4, yMiddle - 12], 223, "#19FF83", "#28B86A");
    circle2.current.id("circle2");

    let animationPaths = animateCircle(draw, circle2.current, "toBottom", "#19FF83", "#28B86A");
    wormCircle2.current = animationPaths[0];
    worm2.current = animationPaths[1];
  };

  const drawCircle3 = (draw: Element) => {
    const existingPath = document.getElementById("circle3");
    if (existingPath) return null;

    let xMiddle = parseFloat((containerWidth.current / 2).toFixed(1));
    let yMiddle = parseFloat((containerHeight.current / 2).toFixed(1));

    circle3.current = drawCircle(draw, [xMiddle - 10, yMiddle - 24], 223, "#C890FF", "#8A4BC9");
    circle3.current.id("circle3");

    let animationPaths = animateCircle(draw, circle3.current, "toTop", "#C890FF", "#8A4BC9");
    wormCircle3.current = animationPaths[0];
    worm1.current = animationPaths[1];
  };

  const drawCircle4 = (draw: Element) => {
    const existingPath = document.getElementById("circle4");
    if (existingPath) return null;

    let xMiddle = parseFloat((containerWidth.current / 2).toFixed(1));
    let yMiddle = parseFloat((containerHeight.current / 2).toFixed(1));

    let points = [
      [xMiddle, yOffset],
      [xMiddle, containerHeight.current - yOffset],
    ];

    circle4.current = drawCircle(draw, [xMiddle, yMiddle], 223, "#C890FF", "#8A4BC9");
    circle4.current.id("circle4");

    let animationPaths = animateCircle(draw, circle4.current, "toTop", "#C890FF", "#8A4BC9");
    wormCircle4.current = animationPaths[0];
    worm4.current = animationPaths[1];
  };

  const drawCircleTL = (draw: Element) => {
    const existingPath = document.getElementById("circleTL");
    if (existingPath) return null;

    let xMiddle = parseFloat((containerWidth.current / 2).toFixed(1));
    let yMiddle = parseFloat((containerHeight.current / 2).toFixed(1));

    circleTL.current = drawCircle(draw, [xMiddle - 502, yMiddle - 283], 256, "#C890FF", "#8A4BC9");
    circleTL.current.id("circleTL");

    let animationPaths = animateCircle(draw, circleTL.current, "toTop", "#C890FF", "#8A4BC9");
    wormCircleTL.current = animationPaths[0];
    wormTL.current = animationPaths[1];
  };

  const drawCircleBL = (draw: Element) => {
    const existingPath = document.getElementById("circleBL");
    if (existingPath) return null;

    let xMiddle = parseFloat((containerWidth.current / 2).toFixed(1));
    let yMiddle = parseFloat((containerHeight.current / 2).toFixed(1));

    circleBL.current = drawCircle(draw, [xMiddle - 786, yMiddle + 1], 368, "#19FF83", "#28B86A");
    circleBL.current.id("circleBL");

    let animationPaths = animateCircle(draw, circleBL.current, "toTop", "#19FF83", "#28B86A");
    wormCircleBL.current = animationPaths[0];
    wormBL.current = animationPaths[1];
  };

  const drawCircleTR = (draw: Element) => {
    const existingPath = document.getElementById("circleTR");
    if (existingPath) return null;

    let xMiddle = parseFloat((containerWidth.current / 2).toFixed(1));
    let yMiddle = parseFloat((containerHeight.current / 2).toFixed(1));

    circleTR.current = drawCircle(draw, [xMiddle + 512, yMiddle - 392], 269, "#19FF83", "#28B86A");
    circleTR.current.id("circleTR");

    let animationPaths = animateCircle(draw, circleTR.current, "toBottom", "#19FF83", "#28B86A");
    wormCircleTR.current = animationPaths[0];
    wormTR.current = animationPaths[1];
  };

  const drawCircleBR = (draw: Element) => {
    const existingPath = document.getElementById("circleBR");
    if (existingPath) return null;

    let xMiddle = parseFloat((containerWidth.current / 2).toFixed(1));
    let yMiddle = parseFloat((containerHeight.current / 2).toFixed(1));

    circleBR.current = drawCircle(draw, [xMiddle + 590, yMiddle + 2], 192, "#C890FF", "#8A4BC9");
    circleBR.current.id("circleBR");

    let animationPaths = animateCircle(draw, circleBR.current, "toTop", "#C890FF", "#8A4BC9");
    wormCircleBR.current = animationPaths[0];
    wormBR.current = animationPaths[1];
  };

  const drawCircle = (draw: Element, points: number[], radius: number, color1: string, color2: string) => {
    const gradient = draw
      .gradient("linear", function (add: { stop: (arg0: number, arg1: string) => void }) {
        add.stop(0.41, color1);
        add.stop(0.95, color2);
      })
      .from(0, 0)
      .to(0, 1);

    let path = draw.path(`
            M ${points[0]},${points[1] - radius} 
            A ${radius} ${radius} 0 1,1 ${points[0]},${points[1] + radius}
            A ${radius} ${radius} 0 1,1 ${points[0]},${points[1] - radius}
        `);

    path.fill("none").stroke({
      width: 2,
      color: gradient,
      opacity: 0.16,
    });

    return path;
  };

  const animateCircle = (draw: Element, path: Element, direction: string, color1: string, color2: string) => {
    const gradient = draw
      .gradient("linear", function (add: { stop: (arg0: number, arg1: string) => void }) {
        add.stop(0.41, color1);
        add.stop(0.95, color2);
      })
      .from(0, 0)
      .to(0, 1);

    const shadowFilter = draw.filter(function (add) {
      var blur = add.offset(0, 0).in(color1).gaussianBlur(4);
      add.blend(add.$source, blur);
    });

    let wormPath = path
      .clone()
      .fill("none")
      .stroke({
        width: 2.8,
        color: gradient,
        opacity: 1,
      })
      .filterWith(shadowFilter);
    draw.add(wormPath);

    let worm = draw
      .rect(100, 100)
      .move(path.pointAt(0).x / 2, path.pointAt(0).y)
      .fill(color1);

    wormPath.maskWith(worm);
    worm.hide();

    animateMask(worm, path, wormPath, direction);

    return [wormPath, worm];
  };

  const animateMask = (worm: Element, path: Element, wormPath: Element, orientation: string) => {
    const pathLength = path.length();

    // Función para iniciar la animación
    const startAnimation = () => {
      wormPath.show();
      worm.show();
      worm
        .animate(1500, "<>")
        .during(function (pos: number) {
          const point = orientation == "toTop" ? path.pointAt(pathLength * (1 - pos)) : path.pointAt(pathLength * pos);
          worm.center(point.x, point.y);
        })
        .after(function () {
          worm.hide();
          wormPath.hide();
          setTimeout(startAnimation, Math.random() * 1000 + 200);
        });
    };

    // Iniciar la primera animación con un tiempo aleatorio más corto
    setTimeout(startAnimation, Math.random() * 1000 + 200);
  };

  const cleanCircles = () => {
    circle1.current?.remove();
    wormCircle1.current?.remove();
    worm1.current?.remove();

    circle2.current?.remove();
    wormCircle2.current?.remove();
    worm2.current?.remove();

    circle3.current?.remove();
    wormCircle3.current?.remove();
    worm3.current?.remove();

    circle4.current?.remove();
    wormCircle4.current?.remove();
    worm4.current?.remove();

    circleTL.current?.remove();
    wormCircleTL.current?.remove();
    wormTL.current?.remove();

    circleBL.current?.remove();
    wormCircleBL.current?.remove();
    wormBL.current?.remove();

    circleTR.current?.remove();
    wormCircleTR.current?.remove();
    wormTR.current?.remove();

    circleBR.current?.remove();
    wormCircleBR.current?.remove();
    wormBR.current?.remove();
  };

  const drawCircles = () => {
    const draw = SVG(svgRef.current);
    const objectLayerDimensions = document.getElementById("heroAnimation").getBoundingClientRect();
    containerWidth.current = objectLayerDimensions.width;
    containerHeight.current = objectLayerDimensions.height;

    cleanCircles();

    drawCircle1(draw);
    drawCircle2(draw);
    drawCircle3(draw);
    drawCircle4(draw);
    drawCircleTL(draw);
    drawCircleBL(draw);
    drawCircleTR(draw);
    drawCircleBR(draw);
  };

  useEffect(() => {
    drawCircles();
    window.addEventListener("resize", drawCircles);

    return () => {
      window.removeEventListener("resize", drawCircles);
    };
  }, []);

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-[2314px] h-[1324px] md:scale-100 scale-70 origin-center" />
      <svg
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[114px] h-[80px] md:w-[178px] md:h-[126px]"
        viewBox="0 0 178 126"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M89.5904 61.8864C100.127 61.8864 110.348 65.6284 118.132 72.9623L161.75 114H140.835L107.762 82.8938C102.897 78.3331 96.4099 75.894 89.5987 75.894C82.7878 75.894 76.3012 78.3331 71.4362 82.8938L38.3629 114H17.4477L61.0662 72.9623C68.85 65.6368 79.0622 61.8864 89.6074 61.8864H89.5904ZM89.5904 52.1218C79.0539 52.1218 68.8334 48.3797 61.0495 41.0458L17.4394 0H38.3546L71.4279 31.106C76.2929 35.6667 82.7795 38.1058 89.5904 38.1058C96.4016 38.1058 102.888 35.6667 107.753 31.106L140.827 0H161.742L118.123 41.0375C110.339 48.363 100.127 52.1134 89.5821 52.1134L89.5904 52.1218Z"
          fill="url(#paint0_linear_628_177)"
        />
        <path
          d="M53.1078 57.0081L7.54328 95.7652C4.14198 98.8558 0.25 97.3942 0.25 92.8335V21.1743C0.25 16.6136 4.14198 15.1518 7.54328 18.2424L53.1078 56.9997V57.0081Z"
          fill="url(#paint1_linear_628_177)"
        />
        <defs>
          <linearGradient id="paint0_linear_628_177" x1="125.079" y1="7.94283e-07" x2="36.2755" y2="136.64" gradientUnits="userSpaceOnUse">
            <stop offset="0.575" stopColor="white" />
            <stop offset="0.9988" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="paint1_linear_628_177" x1="125.079" y1="7.94283e-07" x2="36.2755" y2="136.64" gradientUnits="userSpaceOnUse">
            <stop offset="0.575" stopColor="white" />
            <stop offset="0.9988" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default HeroHomeAnimation;
