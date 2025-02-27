
import { useEffect, useRef } from 'react';

const Logo = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;

    const draw = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set canvas dimensions for high DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 120 * dpr;
      canvas.height = 120 * dpr;
      ctx.scale(dpr, dpr);
      
      // Draw circles
      ctx.strokeStyle = '#084b49';
      ctx.lineWidth = 2;
      
      // First circle
      ctx.beginPath();
      ctx.arc(60, 45, 25, 0, Math.PI * 2);
      ctx.stroke();
      
      // Second circle
      ctx.beginPath();
      ctx.arc(60, 75, 25, 0, Math.PI * 2);
      ctx.stroke();
      
      // Animated line
      ctx.strokeStyle = '#33fea6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 20);
      ctx.lineTo(60 + Math.sin(rotation) * 30, 100 + Math.cos(rotation) * 30);
      ctx.stroke();
      
      rotation += 0.02;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <canvas
        ref={canvasRef}
        style={{ width: '120px', height: '120px' }}
        className="mb-4"
      />
      <h1 className="text-3xl font-light tracking-wider text-accent">AITEMA X</h1>
    </div>
  );
};

export default Logo;

