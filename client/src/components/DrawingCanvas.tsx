'use client';

import { useEffect, useRef, useState } from 'react';

interface DrawingCanvasProps {
  isDrawing: boolean;
  socket: any;
  lobbyId: string;
}

export default function DrawingCanvas({ isDrawing, socket, lobbyId }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    canvas.style.width = '800px';
    canvas.style.height = '600px';

    // Get context
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set default styles
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    contextRef.current = context;
  }, []);

  useEffect(() => {
    if (!contextRef.current) return;
    contextRef.current.strokeStyle = color;
    contextRef.current.lineWidth = brushSize;
  }, [color, brushSize]);

  useEffect(() => {
    if (!isDrawing) {
      // Listen for drawing data from other players
      socket.on('draw_line', (data: any) => {
        const context = contextRef.current;
        if (!context) return;

        context.beginPath();
        context.moveTo(data.from.x, data.from.y);
        context.lineTo(data.to.x, data.to.y);
        context.strokeStyle = data.color;
        context.lineWidth = data.brushSize;
        context.stroke();
      });

      socket.on('clear_canvas', () => {
        const context = contextRef.current;
        const canvas = canvasRef.current;
        if (!context || !canvas) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
      });
    }

    return () => {
      socket.off('draw_line');
      socket.off('clear_canvas');
    };
  }, [isDrawing, socket]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawingMode(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    
    if (contextRef.current) {
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
    }

    // Emit drawing data to other players
    socket.emit('draw', {
      lobbyId,
      from: { x: offsetX, y: offsetY },
      to: { x: offsetX, y: offsetY },
      color,
      brushSize
    });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    contextRef.current?.closePath();
    setIsDrawingMode(false);
  };

  const clearCanvas = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear_canvas', { lobbyId });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4 mb-4">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={!isDrawing}
          className="w-10 h-10"
        />
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          disabled={!isDrawing}
          className="w-32"
        />
        <button
          onClick={clearCanvas}
          disabled={!isDrawing}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className={`border-2 ${
          isDrawing ? 'border-blue-500 cursor-crosshair' : 'border-gray-300 cursor-default'
        } rounded-lg`}
      />
    </div>
  );
} 