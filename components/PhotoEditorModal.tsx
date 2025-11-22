
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';

interface PhotoEditorModalProps {
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
}

export const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({ imageSrc, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  
  // Crop state
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(0.1); // Dynamic minimum scale
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const CANVAS_SIZE = 320;
  const CROP_SIZE = 280; // Square crop size

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImgElement(img);
      
      // Calculate dynamic limits
      // fitScale: Scale where the whole image fits inside the crop box (preventing it from being smaller than the box)
      const fitScale = Math.min(CROP_SIZE / img.width, CROP_SIZE / img.height);
      
      // coverScale: Scale where the image covers the crop box entirely (default)
      const coverScale = Math.max(CROP_SIZE / img.width, CROP_SIZE / img.height);

      // Set the minimum allowed scale to the fitScale (or slightly smaller if desired, but fitScale prevents "tiny dot" issue)
      setMinScale(fitScale);
      
      // Initial scale is cover
      setScale(coverScale);
    };
  }, [imageSrc]);

  // Draw the editor canvas
  useEffect(() => {
    if (!canvasRef.current || !imgElement) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Center of canvas
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;

    ctx.save();
    // Move to center + offset
    ctx.translate(cx + offset.x, cy + offset.y);
    ctx.scale(scale, scale);
    // Draw image centered
    ctx.drawImage(imgElement, -imgElement.width / 2, -imgElement.height / 2);
    ctx.restore();

    // Draw overlay (mask)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    
    // Top rect
    ctx.fillRect(0, 0, CANVAS_SIZE, (CANVAS_SIZE - CROP_SIZE) / 2);
    // Bottom rect
    ctx.fillRect(0, (CANVAS_SIZE + CROP_SIZE) / 2, CANVAS_SIZE, (CANVAS_SIZE - CROP_SIZE) / 2);
    // Left rect
    ctx.fillRect(0, (CANVAS_SIZE - CROP_SIZE) / 2, (CANVAS_SIZE - CROP_SIZE) / 2, CROP_SIZE);
    // Right rect
    ctx.fillRect((CANVAS_SIZE + CROP_SIZE) / 2, (CANVAS_SIZE - CROP_SIZE) / 2, (CANVAS_SIZE - CROP_SIZE) / 2, CROP_SIZE);

    // Draw crop border (Square)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect((CANVAS_SIZE - CROP_SIZE) / 2, (CANVAS_SIZE - CROP_SIZE) / 2, CROP_SIZE, CROP_SIZE);

    // Draw circular guide (Map Marker Preview)
    ctx.beginPath();
    ctx.arc(cx, cy, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.8)'; // ocean-500
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Label for circle
    ctx.fillStyle = 'rgba(14, 165, 233, 0.8)';
    ctx.font = '10px sans-serif';
    ctx.fillText("지도 마커 영역", cx - 30, cy - (CROP_SIZE/2) + 15);

  }, [imgElement, scale, offset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSave = () => {
    if (!imgElement) return;

    const tempCanvas = document.createElement('canvas');
    // Output size: enough for high quality thumb
    const OUTPUT_SIZE = 600; 
    tempCanvas.width = OUTPUT_SIZE;
    tempCanvas.height = OUTPUT_SIZE;
    const ctx = tempCanvas.getContext('2d');

    if (ctx) {
      // Fill white background just in case
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      // Calculate the portion of the image visible in the crop area
      // The visible crop area in editor coordinates is centered at (CANVAS_SIZE/2, CANVAS_SIZE/2) with size CROP_SIZE
      // The image is drawn at (CANVAS_SIZE/2 + offset.x, CANVAS_SIZE/2 + offset.y) scaled by `scale`
      
      // We want to map the content inside the crop rect to the full output canvas
      
      const cx = OUTPUT_SIZE / 2;
      const cy = OUTPUT_SIZE / 2;
      
      // Ratio of output size to preview crop size
      const outputScale = OUTPUT_SIZE / CROP_SIZE;
      
      // Apply transforms to draw the image onto the output canvas
      // The offset needs to be scaled up to match the output size logic
      ctx.translate(cx + offset.x * outputScale, cy + offset.y * outputScale);
      ctx.scale(scale * outputScale, scale * outputScale);
      ctx.drawImage(imgElement, -imgElement.width / 2, -imgElement.height / 2);
      
      onSave(tempCanvas.toDataURL('image/jpeg', 0.85));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-900">사진 위치 조정</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-4 flex flex-col items-center flex-1 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-4 text-center">
            드래그하여 위치를 맞추고 확대/축소하세요.<br/>
            <span className="text-ocean-600 text-xs">점선 원은 지도 마커에 표시되는 영역입니다.</span>
          </p>
          
          <div 
            className="relative overflow-hidden border border-gray-300 bg-gray-900 cursor-move shadow-md touch-none"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            // Touch events for mobile support
            onTouchStart={(e) => {
               setIsDragging(true);
               const touch = e.touches[0];
               setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
            }}
            onTouchMove={(e) => {
               if (!isDragging) return;
               const touch = e.touches[0];
               setOffset({
                 x: touch.clientX - dragStart.x,
                 y: touch.clientY - dragStart.y
               });
            }}
            onTouchEnd={() => setIsDragging(false)}
          >
            <canvas 
              ref={canvasRef} 
              width={CANVAS_SIZE} 
              height={CANVAS_SIZE} 
            />
          </div>

          <div className="w-full mt-6 px-4 max-w-xs">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>축소</span>
              <span>확대</span>
            </div>
            <input 
              type="range" 
              min={minScale}
              max={minScale * 10} // Adaptive max scale
              step={minScale / 10} // Adaptive step
              value={scale} 
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full accent-ocean-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex gap-3">
           <Button variant="secondary" onClick={onClose} className="flex-1">취소</Button>
           <Button variant="primary" onClick={handleSave} className="flex-1">적용하기</Button>
        </div>
      </div>
    </div>
  );
};
