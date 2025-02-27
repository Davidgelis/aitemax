
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
    let colorIndex = 0;
    const colors = ['#041524', '#084b49', '#33fea6', '#64bf95', '#ffffff'];

    const draw = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set canvas dimensions for high DPI displays with 2x size
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 240 * dpr; // Doubled from 120
      canvas.height = 240 * dpr; // Doubled from 120
      ctx.scale(dpr, dpr);
      
      // Draw circles
      ctx.strokeStyle = '#084b49';
      ctx.lineWidth = 3; // Increased line width for better visibility
      
      // First circle - scaled up
      ctx.beginPath();
      ctx.arc(120, 90, 50, 0, Math.PI * 2); // Doubled radius and position
      ctx.stroke();
      
      // Second circle - scaled up
      ctx.beginPath();
      ctx.arc(120, 150, 50, 0, Math.PI * 2); // Doubled radius and position
      ctx.stroke();
      
      // Animated line with aurora effect
      const currentColor = colors[Math.floor(colorIndex) % colors.length];
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 4; // Thicker line for aurora effect
      ctx.lineCap = 'round'; // Rounded line caps for smoother appearance
      
      // Draw multiple lines for glow effect
      const drawGlowingLine = (alpha: number, width: number) => {
        ctx.beginPath();
        ctx.globalAlpha = alpha;
        ctx.lineWidth = width;
        ctx.moveTo(120, 40); // Adjusted starting point
        ctx.lineTo(
          120 + Math.sin(rotation) * 60, 
          200 + Math.cos(rotation) * 60
        ); // Doubled amplitude
        ctx.stroke();
      };
      
      // Create glowing effect with multiple lines
      drawGlowingLine(0.2, 8);
      drawGlowingLine(0.4, 6);
      drawGlowingLine(0.6, 4);
      drawGlowingLine(1, 2);
      
      ctx.globalAlpha = 1; // Reset alpha
      
      rotation += 0.02;
      colorIndex += 0.01; // Slowly cycle through colors
      
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      <canvas
        ref={canvasRef}
        style={{ width: '240px', height: '240px' }} // Doubled size
        className="mb-6" // Increased margin for better spacing
      />
      <h1 className="text-4xl font-light tracking-wider text-accent">AITEMA X</h1>
    </div>
  );
};

export default Logo;
