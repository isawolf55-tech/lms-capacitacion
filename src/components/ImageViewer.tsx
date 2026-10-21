'use client';

import React, { useState } from 'react';

interface ImageViewerProps {
  src: string;
  alt?: string;
  caption?: string;
  className?: string;
}

export default function ImageViewer({ src, alt, caption, className = '' }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetControls = () => {
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <>
      <div className={`relative group inline-block ${className}`}>
        <div
          onClick={() => setIsOpen(true)}
          className="cursor-zoom-in rounded-lg overflow-hidden border border-slate-800 bg-slate-900/60 hover:border-blue-500/50 transition duration-200 shadow-md inline-block max-w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || 'Imagen de capacitación'}
            className="max-h-96 w-auto object-contain block mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="bg-slate-900/90 text-slate-100 text-xs px-3 py-1.5 rounded-full border border-slate-700 shadow flex items-center gap-1.5">
              🔍 Clic para ampliar / Zoom
            </span>
          </div>
        </div>
        {caption && (
          <p className="text-xs text-slate-400 mt-1.5 italic text-center max-w-lg mx-auto">
            {caption}
          </p>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          {/* Barra de herramientas */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/95 border border-slate-700 rounded-full px-4 py-2 shadow-2xl flex items-center gap-4 text-xs text-slate-200 flex-wrap justify-center">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-100 font-bold"
                title="Reducir zoom"
              >
                -
              </button>
              <span className="w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-100 font-bold"
                title="Aumentar zoom"
              >
                +
              </button>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
              <span>☀️ Brillo:</span>
              <input
                type="range"
                min="50"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-20 accent-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span>🌓 Contraste:</span>
              <input
                type="range"
                min="50"
                max="200"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-20 accent-blue-500"
              />
            </div>

            <button
              onClick={resetControls}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            >
              Reiniciar
            </button>

            <button
              onClick={() => {
                resetControls();
                setIsOpen(false);
              }}
              className="px-3 py-1 bg-red-600/80 hover:bg-red-600 rounded text-white font-semibold"
            >
              ✕ Cerrar
            </button>
          </div>

          {/* Área de imagen interactiva */}
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt || 'Imagen ampliada'}
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
              className="max-w-[85vw] max-h-[85vh] object-contain select-none"
            />
          </div>

          {caption && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800 text-slate-300 text-xs px-4 py-2 rounded-lg max-w-xl text-center">
              {caption}
            </div>
          )}
        </div>
      )}
    </>
  );
}
