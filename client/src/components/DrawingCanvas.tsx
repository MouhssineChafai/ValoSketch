'use client';

import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

interface DrawingCanvasProps {
  socket: Socket;
  lobbyId: string;
  isDrawing: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface DrawingTools {
  color: string;
  brushSize: number;
  isEraser: boolean;
  opacity: number;
}

interface ColorPreset {
  name: string;
  value: string;
}

// Add more color presets
const COLOR_PRESETS: ColorPreset[] = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Orange', value: '#FFA500' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Green', value: '#008000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Purple', value: '#800080' },
  { name: 'Pink', value: '#FFC0CB' },
  { name: 'Brown', value: '#A52A2A' },
  { name: 'Gray', value: '#808080' },
  { name: 'Cyan', value: '#00FFFF' },
  { name: 'Magenta', value: '#FF00FF' },
  { name: 'Lime', value: '#00FF00' },
  { name: 'Teal', value: '#008080' },
  { name: 'Navy', value: '#000080' },
  { name: 'Maroon', value: '#800000' },
  { name: 'Olive', value: '#808000' }
];

export default function DrawingCanvas({ socket, lobbyId, isDrawing }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tools, setTools] = useState<DrawingTools>({
    color: '#000000',
    brushSize: 5,
    isEraser: false,
    opacity: 1
  });
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle canvas resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      
      const { width } = containerRef.current.getBoundingClientRect();
      
      // Maintain 16:9 aspect ratio
      const aspectRatio = 16 / 9;
      const newHeight = width / aspectRatio;
      
      setDimensions({
        width: Math.floor(width),
        height: Math.floor(newHeight)
      });

      // Update canvas resolution
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set display size
      canvas.style.width = `${width}px`;
      canvas.style.height = `${newHeight}px`;
      
      // Set actual size with pixel density
      const scale = window.devicePixelRatio;
      canvas.width = Math.floor(width * scale);
      canvas.height = Math.floor(newHeight * scale);
      
      // Scale context to match pixel density
      if (context) {
        context.scale(scale, scale);
        context.lineCap = 'round';
        context.lineJoin = 'round';
      }
    };

    // Initial size
    updateCanvasSize();

    // Handle window resize
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Socket event handlers
  useEffect(() => {
    socket.on('draw_line', (data: {
      from: Point;
      to: Point;
      color: string;
      brushSize: number;
    }) => {
      drawLine(data.from, data.to, data.color, data.brushSize);
    });

    socket.on('clear_canvas', () => {
      clearCanvas();
    });

    return () => {
      socket.off('draw_line');
      socket.off('clear_canvas');
    };
  }, [socket]);

  const drawLine = (from: Point, to: Point, color: string, brushSize: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;

    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    
    const point = {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY
    };
    
    setIsDrawingActive(true);
    setLastPoint(point);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !isDrawingActive || !lastPoint) return;

    const newPoint = {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY
    };

    drawLine(lastPoint, newPoint, tools.color, tools.brushSize);
    socket.emit('draw', {
      lobbyId,
      from: lastPoint,
      to: newPoint,
      color: tools.color,
      brushSize: tools.brushSize
    });

    setLastPoint(newPoint);
  };

  const handlePointerUp = () => {
    setIsDrawingActive(false);
    setLastPoint(null);
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex flex-col items-center"
    >
      {/* Canvas Area */}
      <div className="relative bg-white rounded-t-lg overflow-hidden flex-1">
        <canvas
          ref={canvasRef}
          className="touch-none"
          style={{
            width: dimensions.width,
            height: dimensions.height
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOut={handlePointerUp}
        />
        {!isDrawing && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <span className="text-gray-800 text-lg font-valorant">
              Waiting for drawer...
            </span>
          </div>
        )}
      </div>

      {/* Drawing Tools */}
      {isDrawing && (
        <div className="flex items-center justify-between p-2 bg-gray-200 rounded-b-lg">
          <div className="grid grid-cols-9 gap-1 border p-1 rounded">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                onClick={() => setTools(prev => ({ ...prev, color: color.value }))}
                className={`w-5 h-5 rounded-full transition-all ${
                  tools.color === color.value 
                    ? 'ring-2 ring-[#FF4655] scale-110' 
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTools(prev => ({ ...prev, isEraser: !prev.isEraser }))}
              className={`p-2 rounded transition-colors ${
                tools.isEraser 
                  ? 'bg-[#FF4655] text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tools.isEraser ? 'Eraser' : 'Brush'}
            </button>
            <button
              onClick={() => {
                clearCanvas();
                socket.emit('clear_canvas', { lobbyId });
              }}
              className="p-2 rounded bg-red-500 text-white hover:bg-red-600"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 