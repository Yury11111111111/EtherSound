import React, { useRef, useEffect, useCallback } from 'react';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import './Canvas.scss';

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
  const animationFrameRef = useRef<number>(null);
  const canvasWidth = useRef(window.innerWidth);
  const canvasHeight = useRef(window.innerHeight);

  const { startVoice, updateVoice, stopVoice } = useAudioEngine();

  const mapXToFrequency = (x: number, width: number): number => {
    const minFreq = 100;
    const maxFreq = 1000;
    return minFreq + (x / width) * (maxFreq - minFreq);
  };

  const mapYToVolume = (y: number, height: number): number => {
    const minVol = 0.0;
    const maxVol = 0.8;
    const volume = maxVol - (y / height) * (maxVol - minVol);
    return Math.max(0, Math.min(maxVol, volume));
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (mousePos.current.isDrawing) {
      ctx.beginPath();
      ctx.arc(mousePos.current.x, mousePos.current.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${mousePos.current.x / 5}, 70%, 60%)`;
      ctx.shadowColor = 'white';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(`X: ${Math.round(mousePos.current.x)}`, 10, 20);
    ctx.fillText(`Y: ${Math.round(mousePos.current.y)}`, 10, 40);
    ctx.fillText(`Speed: ${mousePos.current.speed.toFixed(3)}`, 10, 60);
    ctx.fillText(`Drawing: ${mousePos.current.isDrawing}`, 10, 80);
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    draw(ctx);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [draw]);

  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    mousePos.current.isDrawing = true;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mousePos.current.x = x;
      mousePos.current.y = y;
    }
    lastMousePos.current = {
      x: mousePos.current.x,
      y: mousePos.current.y,
      time: Date.now(),
    };

    await startVoice();

    updateVoice({
      frequency: mapXToFrequency(mousePos.current.x, canvasWidth.current),
      volume: mapYToVolume(mousePos.current.y, canvasHeight.current),
    });
  }, [startVoice, updateVoice]);

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

    if (mousePos.current.isDrawing) {
      updateVoice({
        frequency: mapXToFrequency(x, canvasWidth.current),
        volume: mapYToVolume(y, canvasHeight.current),
      });
    }
   
  }, [updateVoice]);

  const handleMouseUp = useCallback(() => {
    mousePos.current.isDrawing = false;
    stopVoice();
  }, [stopVoice]);

  const handleMouseLeave = useCallback(() => {
    mousePos.current.isDrawing = false;
    stopVoice();
  }, [stopVoice]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasWidth.current = window.innerWidth;
    canvasHeight.current = window.innerHeight;
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
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