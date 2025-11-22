
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { saveCustomBadge } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';

interface BadgeMakerModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export const BadgeMakerModal: React.FC<BadgeMakerModalProps> = ({ onClose, onCreated }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'category' | 'crop' | 'details'>('category');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form details
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'marine' | 'terrain'>('marine');

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  
  // Crop state
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(0.1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const CANVAS_SIZE = 300;
  const CIRCLE_RADIUS = 120;

  const resetEditorState = () => {
    setImageSrc(null);
    setCroppedImage(null);
    setImgElement(null);
    setScale(1);
    setMinScale(0.1);
    setOffset({ x: 0, y: 0 });
    setDragStart({ x: 0, y: 0 });
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleCategorySelect = (type: 'marine' | 'terrain') => {
    setCategory(type);
    resetEditorState();
    openFileDialog();
  };

  const handleBackToCategory = () => {
    resetEditorState();
    setStep('category');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          setImgElement(img);
          setImageSrc(ev.target?.result as string);
          setOffset({ x: 0, y: 0 });
          setDragStart({ x: 0, y: 0 });
          
          // Calculate dynamic scales for Badge
          const maskDiameter = CIRCLE_RADIUS * 2;
          
          // Fit Scale: Ensures at least one dimension of the image fills the mask diameter
          // This prevents the image from becoming smaller than the badge circle
          const fitScale = Math.min(maskDiameter / img.width, maskDiameter / img.height);
          
          // Cover Scale: Ensures the image completely covers the mask (no empty spaces)
          const coverScale = Math.max(maskDiameter / img.width, maskDiameter / img.height);

          setMinScale(fitScale);
          setScale(coverScale); // Default to covering
          
          setStep('crop');
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Draw the editor canvas
  useEffect(() => {
    if (!canvasRef.current || !imgElement || step !== 'crop') return;
    
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
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.arc(cx, cy, CIRCLE_RADIUS, 0, Math.PI * 2, true); // Cut out the circle
    ctx.fill();
    ctx.restore();

    // Draw selection ring
    ctx.strokeStyle = '#0ea5e9'; // ocean-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

  }, [imgElement, scale, offset, step]);

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

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length === 0) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  const handleCrop = () => {
    if (!imgElement) return;

    const tempCanvas = document.createElement('canvas');
    const outputSize = CIRCLE_RADIUS * 2;
    tempCanvas.width = outputSize;
    tempCanvas.height = outputSize;
    const ctx = tempCanvas.getContext('2d');

    if (ctx) {
      // Draw circular mask
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.clip();

      // Calculate draw position relative to the crop center
      // The center of the crop area in the editor was (CANVAS_SIZE/2, CANVAS_SIZE/2)
      // The image was drawn at (CANVAS_SIZE/2 + offset.x, CANVAS_SIZE/2 + offset.y) scaled
      // In the new canvas (0,0 to outputSize, outputSize), the center is (outputSize/2, outputSize/2)
      
      const cx = outputSize / 2;
      const cy = outputSize / 2;

      ctx.translate(cx + offset.x, cy + offset.y);
      ctx.scale(scale, scale);
      ctx.drawImage(imgElement, -imgElement.width / 2, -imgElement.height / 2);
      
      setCroppedImage(tempCanvas.toDataURL('image/png'));
      setStep('details');
    }
  };

  const handleSave = async () => {
    if (!croppedImage || !name || !user) return;

    try {
      setSaving(true);
      await saveCustomBadge({
        id: `custom-${Date.now()}`,
        name,
        description: description || (category === 'terrain' ? '인상적인 특수 지형' : '나만의 해양 생물'),
        icon: croppedImage,
        category,
      }, user.uid);

      if (onCreated) {
        await onCreated();
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="p-4 border-b flex justify-between items-center bg-ocean-50">
          <h3 className="font-bold text-lg text-ocean-900">배지 만들기</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>

        <div className="p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={false}
            onChange={handleFileChange}
            className="hidden"
          />
          {step === 'category' && (
            <div className="space-y-6 py-4 text-center">
              <div>
                <p className="text-sm text-gray-600">만들고 싶은 배지 종류를 고르면 바로 사진 선택 창이 열립니다.</p>
                <p className="text-xs text-gray-400 mt-1">사진을 고른 뒤에는 영역 자르기 단계가 자동으로 시작돼요.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleCategorySelect('marine')}
                  className="group rounded-2xl border-2 border-ocean-100 hover:border-ocean-300 bg-white px-6 py-6 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition"
                >
                  <span className="text-5xl">🐋</span>
                  <span className="text-base font-semibold text-gray-900">해양 생물</span>
                  <span className="text-xs text-gray-500">
                    직접 촬영한 해양 생물 사진으로 감각적인 배지를 만들어보세요.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCategorySelect('terrain')}
                  className="group rounded-2xl border-2 border-orange-100 hover:border-orange-300 bg-white px-6 py-6 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition"
                >
                  <span className="text-5xl">🪸</span>
                  <span className="text-base font-semibold text-gray-900">특수 지형</span>
                  <span className="text-xs text-gray-500">
                    용암 돔, 케이브 등 인상 깊은 수중 지형을 배지로 기록해보세요.
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 'crop' && (
            <div className="flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-4">
                {category === 'terrain'
                  ? '특수 지형에서 강조하고 싶은 영역을 이동·확대해 주세요.'
                  : '해양 생물의 매력을 살릴 수 있도록 위치를 조절해 주세요.'}
              </p>
              
              <div 
                className="relative overflow-hidden border-2 border-gray-200 rounded-lg bg-gray-100 cursor-move shadow-inner touch-none"
                style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <canvas 
                  ref={canvasRef} 
                  width={CANVAS_SIZE} 
                  height={CANVAS_SIZE} 
                />
              </div>

              <div className="w-full mt-6 px-4">
                <label className="text-xs text-gray-500 block mb-1">확대/축소</label>
                <input 
                  type="range" 
                  min={minScale}
                  max={minScale * 10} 
                  step={minScale / 10} 
                  value={scale} 
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-ocean-600"
                />
              </div>

              <div className="flex gap-4 mt-6 w-full">
                <Button variant="secondary" onClick={handleBackToCategory} className="flex-1">
                  종류/사진 다시 선택
                </Button>
                <Button onClick={handleCrop} className="flex-1">영역 자르기</Button>
              </div>
            </div>
          )}

          {step === 'details' && croppedImage && (
            <div className="flex flex-col items-center">
              <div className="mb-6 relative">
                <div className="w-32 h-32 rounded-full border-4 border-ocean-200 overflow-hidden shadow-lg animate-float">
                  <img src={croppedImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-2 rounded-full shadow">
                  ✨
                </div>
              </div>

              <div className="w-full space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={category === 'terrain' ? '예: 비밀의 용암 지형' : '예: 귀여운 니모'} 
                    className="w-full border rounded-md px-3 py-2 focus:ring-ocean-500 focus:border-ocean-500"
                    maxLength={15}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
                  <input 
                    type="text" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={category === 'terrain' ? '예: 수중 용암동굴에서 촬영' : '예: 제주도에서 만난 친구'} 
                    className="w-full border rounded-md px-3 py-2 focus:ring-ocean-500 focus:border-ocean-500"
                    maxLength={30}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8 w-full">
                <Button variant="secondary" onClick={() => setStep('crop')} className="flex-1">뒤로</Button>
                <Button onClick={handleSave} disabled={!name || saving} className="flex-1" isLoading={saving}>
                  생성 완료!
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
