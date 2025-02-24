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

// Add new interface for drawing tools
interface DrawingTool {
  name: string;
  icon: string;
}

const DRAWING_TOOLS: DrawingTool[] = [
  { name: 'Brush', icon: '/icons8-pencil-100.png' },
  { name: 'Fill', icon: '/icons8-fill-color-90.png' },
  { name: 'Eraser', icon: '/icons8-eraser-100.png' }

];

const MAX_HISTORY_LENGTH = 50; // Limit history to 50 states

export default function DrawingCanvas({ socket, lobbyId, isDrawing }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tools, setTools] = useState<DrawingTools>({
    color: '#000000',
    brushSize: 6
  });
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [currentTool, setCurrentTool] = useState<string>('Brush');
  const [drawHistory, setDrawHistory] = useState<ImageData[]>([]);
  const [brushSize, setBrushSize] = useState(6);
  const [scale, setScale] = useState(1);

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
      const newScale = window.devicePixelRatio;
      setScale(newScale);

      canvas.width = Math.floor(width * newScale);
      canvas.height = Math.floor(newHeight * newScale);
      
      // Scale context to match pixel density
      if (context) {
        context.scale(newScale, newScale);
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

    socket.on('draw_dot', (data: {
      point: Point;
      color: string;
      brushSize: number;
    }) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (context && canvas) {
        context.beginPath();
        context.fillStyle = data.color;
        context.arc(data.point.x, data.point.y, data.brushSize / 2, 0, Math.PI * 2);
        context.fill();
      }
    });

    socket.on('clear_canvas', () => {
      clearCanvas();
    });

    socket.on('fill', (data: {
      point: Point;
      color: string;
    }) => {
      const scale = window.devicePixelRatio;
      floodFill(
        Math.floor(data.point.x * scale), 
        Math.floor(data.point.y * scale), 
        data.color
      );
    });

    return () => {
      socket.off('draw_line');
      socket.off('draw_dot');
      socket.off('clear_canvas');
      socket.off('fill');
    };
  }, [socket]);

  const drawLine = (start: Point, end: Point, color: string, brushSize: number, isEraser = false) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;

    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.strokeStyle = isEraser ? '#FFFFFF' : color;
    context.lineWidth = brushSize;
    context.stroke();
    context.closePath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save the blank state as the first state in history
    const blankState = context.getImageData(0, 0, canvas.width, canvas.height);
    setDrawHistory([blankState]);  // Instead of empty array, set it to contain the blank state
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    
    const point = {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY
    };

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;

    if (currentTool === 'Fill') {
      const scale = window.devicePixelRatio;
      floodFill(
        Math.floor(point.x * scale), 
        Math.floor(point.y * scale), 
        tools.color
      );
      
      socket.emit('fill', {
        lobbyId,
        point,
        color: tools.color
      });

      // Save state after fill since it's a single action
      saveCanvasState();
      return;
    }

    // Draw dot
    const isEraser = currentTool === 'Eraser';
    context.beginPath();
    context.fillStyle = isEraser ? '#FFFFFF' : tools.color;
    context.arc(point.x, point.y, tools.brushSize / 2, 0, Math.PI * 2);
    context.fill();

    socket.emit('draw_dot', {
      lobbyId,
      point,
      color: isEraser ? '#FFFFFF' : tools.color,
      brushSize: tools.brushSize
    });
    
    setIsDrawingActive(true);
    setLastPoint(point);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;

    if (!e.buttons) {
      setIsDrawingActive(false);
      setLastPoint(null);
      return;
    }

    const newPoint = {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY
    };

    if (isDrawingActive && !lastPoint) {
      setLastPoint(newPoint);
      return;
    }

    if (isDrawingActive && lastPoint) {
      const isEraser = currentTool === 'Eraser';
      drawLine(lastPoint, newPoint, tools.color, tools.brushSize, isEraser);
      socket.emit('draw', {
        lobbyId,
        from: lastPoint,
        to: newPoint,
        color: isEraser ? '#FFFFFF' : tools.color,
        brushSize: tools.brushSize
      });
      setLastPoint(newPoint);
    }
  };

  const handlePointerUp = () => {
    if (isDrawingActive) {
      saveCanvasState(); // Save state when the drawing action is complete
    }
    setIsDrawingActive(false);
    setLastPoint(null);
  };

  const handlePointerLeave = () => {
    if (isDrawingActive) {
      setLastPoint(null); // Clear the last point when leaving
    }
  };

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;
    
    try {
      // Save the full resolution state
      const currentState = context.getImageData(0, 0, canvas.width, canvas.height);
      setDrawHistory(prev => {
        // Don't save if the new state is identical to the last state
        const lastState = prev[prev.length - 1];
        if (lastState && areStatesEqual(currentState, lastState)) {
          return prev;
        }
        
        const newHistory = [...prev, currentState];
        return newHistory.length > MAX_HISTORY_LENGTH 
          ? newHistory.slice(-MAX_HISTORY_LENGTH) 
          : newHistory;
      });
    } catch (error) {
      console.error('Failed to save canvas state:', error);
    }
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas || drawHistory.length <= 1) return;

    try {
      // Remove current state
      const newHistory = drawHistory.slice(0, -1);
      const previousState = newHistory[newHistory.length - 1];
      
      // Reset the transform before applying the state
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.putImageData(previousState, 0, 0);
      
      // Restore the scale
      context.setTransform(scale, 0, 0, scale, 0, 0);
      
      setDrawHistory(newHistory);
      
      // Emit the new state
      socket.emit('canvas_state', { lobbyId, imageData: previousState });
    } catch (error) {
      console.error('Failed to undo:', error);
    }
  };

  // Update getCursorStyle to use tools.color for brush
  const getCursorStyle = (isDrawing: boolean, currentTool: string, size: number, color: string) => {
    if (!isDrawing) return 'default';
    if (currentTool === 'Fill') {
      return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16.56 8.94L7.62 0L6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z" fill="black"/></svg>') 0 20, auto`;
    }

    if (currentTool === 'Eraser') {
      return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2-1}" fill="none" stroke="white" stroke-width="1"/></svg>') ${size/2} ${size/2}, auto`;
    }
    
    // Brush cursor: filled circle with selected color
    return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2-1}" fill="${encodeURIComponent(tools.color)}"/></svg>') ${size/2} ${size/2}, auto`;
  };

  // Add a useEffect to handle window-wide pointer up
  useEffect(() => {
    const handleWindowPointerUp = () => {
      setIsDrawingActive(false);
      setLastPoint(null);
      if (isDrawing) {
        saveCanvasState();
      }
    };

    window.addEventListener('pointerup', handleWindowPointerUp);
    
    return () => {
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [isDrawing]);

  // Add flood fill function
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Get the color we're trying to replace
    const startPos = (startY * canvas.width + startX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    const startA = pixels[startPos + 3];

    // Convert fill color from hex to RGBA
    const fillRGB = {
      r: parseInt(fillColor.slice(1, 3), 16),
      g: parseInt(fillColor.slice(3, 5), 16),
      b: parseInt(fillColor.slice(5, 7), 16),
      a: 255
    };

    // Don't fill if clicking the same color
    if (startR === fillRGB.r && 
        startG === fillRGB.g && 
        startB === fillRGB.b && 
        startA === fillRGB.a) return;

    // Flood fill algorithm
    const pixelsToCheck = [[startX, startY]];
    while (pixelsToCheck.length > 0) {
      const [x, y] = pixelsToCheck.pop()!;
      const pos = (y * canvas.width + x) * 4;

      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
      if (pixels[pos] !== startR || 
          pixels[pos + 1] !== startG || 
          pixels[pos + 2] !== startB || 
          pixels[pos + 3] !== startA) continue;

      pixels[pos] = fillRGB.r;
      pixels[pos + 1] = fillRGB.g;
      pixels[pos + 2] = fillRGB.b;
      pixels[pos + 3] = fillRGB.a;

      pixelsToCheck.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // Add initial state save when component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;
    
    // Save initial blank state
    const initialState = context.getImageData(0, 0, canvas.width, canvas.height);
    setDrawHistory([initialState]);
  }, []);

  const handleColorSelect = (color: string) => {
    // Only switch to Brush if currently using Eraser
    if (currentTool === 'Eraser') {
      setCurrentTool('Brush');
    }
    
    setTools(prev => ({
      ...prev,
      color: color
    }));
  };

  // Add helper function to compare states
  const areStatesEqual = (state1: ImageData, state2: ImageData) => {
    if (state1.width !== state2.width || state1.height !== state2.height) {
      return false;
    }
    
    for (let i = 0; i < state1.data.length; i++) {
      if (state1.data[i] !== state2.data[i]) {
        return false;
      }
    }
    return true;
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex flex-col"
    >
      {/* Canvas Area */}
      <div className="relative bg-white rounded-t-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="touch-none"
          style={{
            width: dimensions.width,
            height: dimensions.height,
            cursor: getCursorStyle(isDrawing, currentTool, brushSize, tools.color)
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
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
        <div className="w-full rounded-b-lg p-3 flex items-center gap-4">
          {/* Color Presets */}
          <div className="grid grid-rows-2 grid-flow-col gap-2 p-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorSelect(color.value)}
                className={`w-6 h-6 rounded-full transition-all shadow-sm ${
                  tools.color === color.value 
                    ? 'ring-2 ring-[#FF4655] ring-offset-2 ring-offset-[#0F1923] scale-110' 
                    : 'hover:scale-105 hover:ring-1 hover:ring-white/30'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>

          {/* Drawing Tools Box */}
          <div className="flex gap-2 p-3 h-[74px] rounded-lg border-2 border-[#1e2129]">
            {DRAWING_TOOLS.map((tool) => (
              <button
                key={tool.name}
                onClick={() => setCurrentTool(tool.name)}
                className={`p-2 rounded-md transition-all
                  ${currentTool === tool.name
                    ? 'bg-[#7b90b7] text-white shadow-lg'
                    : 'bg-[#d4d7df] text-gray-300 hover:bg-[#acafb5] hover:text-white'
                  }
                `}
                title={tool.name}
              >
                <img 
                  src={tool.icon} 
                  alt={tool.name}
                  className={`w-8 h-8 ${
                    currentTool === tool.name 
                      ? 'brightness-200' 
                      : 'brightness-75 hover:brightness-100'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Brush Size Slider */}
          <div className="flex items-center gap-2 p-2 pr-3 h-[74px] rounded-lg border-2 border-[#1e2129]">
            <div className="relative flex items-center w-48">
              {/* Static size preview shape */}
              <div className="absolute w-full h-6 pointer-events-none">
                <div 
                  className="w-full h-full"
                  style={{
                    background: '#d4d7df',
                    clipPath: 'polygon(0 50%, 100% 0, 100% 50%, 100% 100%)'
                  }}
                />
              </div>
              
              {/* Blue selector */}
              <div 
                className="absolute h-7 bg-[#7b90b7] pointer-events-none"
                style={{
                  borderRadius: '4px',
                  width: '10px',
                  left: `${(brushSize / 50) * 100}%`,
                  transform: 'translateX(-50%)',
                  zIndex: 20
                }}
              />
              
              {/* Actual slider input */}
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value);
                  setBrushSize(newSize);
                  setTools(prev => ({ ...prev, brushSize: newSize }));
                }}
                className="w-full h-6 appearance-none bg-transparent relative z-10 outline-none
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-0
                  [&::-webkit-slider-thumb]:h-0
                  
                  [&::-moz-range-thumb]:appearance-none
                  [&::-moz-range-thumb]:w-0
                  [&::-moz-range-thumb]:h-0
                  [&::-moz-range-thumb]:border-0"
              />
            </div>
          </div>

          {/* Other Controls */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleUndo}
              className="p-2 rounded-md bg-[#f1c329] hover:bg-[#bda248] 
                transition-colors shadow-lg border-2 border-transparent
                hover:border-white/20"
              title="Undo"
            >
              <img 
                src="/icons8-undo-90.png" 
                alt="Undo"
                className="w-8 h-8 brightness-75 hover:brightness-100"
              />
            </button>
            <button
              onClick={() => {
                clearCanvas();
                socket.emit('clear_canvas', { lobbyId });
              }}
              className="p-2 rounded-md bg-[#dc4d4d] hover:bg-[#bc7373]
                transition-colors shadow-lg border-2 border-transparent
                hover:border-white/20"
              title="Clear All"
            >
              <img 
                src="/icons8-remove-90.png" 
                alt="Clear All"
                className="w-8 h-8 brightness-75 hover:brightness-100"
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 