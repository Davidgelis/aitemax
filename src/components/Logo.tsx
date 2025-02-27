
import { useEffect, useRef } from 'react';

const Logo = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions for high DPI displays with 2x size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 240 * dpr;
    canvas.height = 240 * dpr;
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Top circle (dark teal)
    ctx.strokeStyle = '#084b49';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(120, 90, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    // Bottom circle (dark blue)
    ctx.strokeStyle = '#041524';
    ctx.beginPath();
    ctx.arc(120, 150, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    // Diagonal line (bright green)
    ctx.strokeStyle = '#33fea6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(120, 40);
    ctx.lineTo(170, 200);
    ctx.stroke();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <canvas
        ref={canvasRef}
        style={{ width: '240px', height: '240px' }}
        className="mb-6"
      />
      <h1 className="text-4xl font-light tracking-wider text-accent">AITEMA X</h1>
    </div>
  );
};

export default Logo;
