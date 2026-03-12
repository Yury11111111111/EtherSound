import React, { useRef, useEffect, useCallback } from "react";
import "./Canvas.scss";

interface MousePosition {
  x: number;
  y: number;
  speed: number;
  isDrawing: boolean;
}

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastMousePos = useRef<{ x: number; y: number; time: number }>({
    x: 0,
    y: 0,
    time: 0,
  });
  const mousePos = useRef<MousePosition>({
    x: 0,
    y: 0,
    speed: 0,
    isDrawing: false,
  });
  const animationFrameRef = useRef<number>(0);

  const drawInfo = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.font = "12px monospace";
    ctx.fillStyle = "white";
    ctx.fillText(`X: ${Math.round(mousePos.current.x)}`, 10, 20);
    ctx.fillText(`Y: ${Math.round(mousePos.current.y)}`, 10, 40);
    ctx.fillText(`Speed: ${mousePos.current.speed.toFixed(3)}`, 10, 60);
    ctx.fillText(`Drawing: ${mousePos.current.isDrawing}`, 10, 80);
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (mousePos.current.isDrawing) {
      ctx.beginPath();
      ctx.arc(mousePos.current.x, mousePos.current.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${mousePos.current.x / 5}, 70%, 60%)`;
      ctx.fill();

      ctx.shadowColor = "white";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      drawInfo(ctx);
    }
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    draw(ctx);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [draw]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mousePos.current.isDrawing = true;
    lastMousePos.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = Date.now();
    const dt = now - lastMousePos.current.time;
    if (dt > 0) {
      const dx = x - lastMousePos.current.x;
      const dy = y - lastMousePos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      mousePos.current.speed = distance / dt;
    }

    mousePos.current.x = x;
    mousePos.current.y = y;
    lastMousePos.current = { x, y, time: now };

    console.log({
      x: Math.round(x),
      y: Math.round(y),
      speed: mousePos.current.speed.toFixed(3),
      isDrawing: mousePos.current.isDrawing,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    mousePos.current.isDrawing = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mousePos.current.isDrawing = false;
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [resizeCanvas, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
};

export default Canvas;
