import React, { useState, useEffect } from 'react';
import { DiveLog, DiveType, MarineLife, Badge } from '../types';
import { Button } from './Button';
import { LocationPicker } from './LocationPicker';
import { getCustomBadges } from '../services/storageService';
import { PhotoEditorModal } from './PhotoEditorModal';
import { useAuth } from '../contexts/AuthContext';

interface LogEntryFormProps {
  initialData?: Partial<DiveLog>;
  onSave: (log: DiveLog) => Promise<void>;
  onCancel: () => void;
  lastDiveNumber: number;
}

export const LogEntryForm: React.FC<LogEntryFormProps> = ({ initialData, onSave, onCancel, lastDiveNumber }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<DiveLog>>({
    diveNumber: lastDiveNumber + 1,
    date: new Date().toISOString().split('T')[0],
    diveType: DiveType.FUN,
    marineLifeSightings: [],
    photos: [],
    photoStoragePaths: [],
    rating: 3,
    geo: undefined, // Default to no location
    ...initialData,
  });

  const [showMapModal, setShowMapModal] = useState(false);
  const [myBadges, setMyBadges] = useState<Badge[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Photo editing state
  const [editingImageSrc, setEditingImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMyBadges([]);
      return;
    }
    let active = true;
    setBadgesLoading(true);
    getCustomBadges(user.uid)
      .then((badges) => {
        if (active) {
          setMyBadges(badges);
        }
      })
      .finally(() => {
        if (active) {
          setBadgesLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Ensure arrays are initialized if missing in old data
        marineLifeSightings: initialData.marineLifeSightings || [],
        photos: initialData.photos || [],
        photoStoragePaths: initialData.photoStoragePaths || []
      }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      geo: {
        lat,
        lng,
        name: prev.location || 'Custom Location'
      }
    }));
  };

  const handleClearLocation = () => {
    setFormData(prev => ({ ...prev, geo: undefined }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setEditingImageSrc(result);
      }
    };
    reader.readAsDataURL(file);
    // Reset input value so same file can be selected again if needed
    e.target.value = '';
  };

  const handlePhotoSave = (croppedImage: string) => {
    setFormData(prev => ({ ...prev, photos: [croppedImage], photoStoragePaths: [] }));
    setEditingImageSrc(null);
  };

  const handleAddBadgeLife = (badge: Badge) => {
    // Prevent duplicates
    if (formData.marineLifeSightings?.some(life => life.name === badge.name)) {
      return;
    }

    const newLife: MarineLife = {
      id: Date.now().toString(),
      name: badge.name,
      description: badge.description,
      imageUrl: badge.icon // Use badge icon as the image
    };
    setFormData(prev => ({
      ...prev,
      marineLifeSightings: [...(prev.marineLifeSightings || []), newLife]
    }));
  };

  const removeMarineLife = (id: string) => {
    setFormData(prev => ({
      ...prev,
      marineLifeSightings: prev.marineLifeSightings?.filter(l => l.id !== id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const fullLog: DiveLog = {
      id: initialData?.id || Date.now().toString(),
      date: formData.date || new Date().toISOString(),
      location: formData.location || 'Unknown',
      siteName: formData.siteName || 'Unknown Site',
      diveNumber: formData.diveNumber || 0,
      timeIn: formData.timeIn || '09:00',
      timeOut: formData.timeOut || '10:00',
      durationMinutes: formData.durationMinutes || 0,
      maxDepthMeters: formData.maxDepthMeters || 0,
      startPressureBar: formData.startPressureBar || 200,
      endPressureBar: formData.endPressureBar || 50,
      visibilityMeters: formData.visibilityMeters || 10,
      waterTempCelsius: formData.waterTempCelsius || 25,
      suitThicknessMm: formData.suitThicknessMm || 3,
      weightsKg: formData.weightsKg || 4,
      diveType: formData.diveType || DiveType.FUN,
      notes: formData.notes || '',
      buddies: formData.buddies || '',
      marineLifeSightings: formData.marineLifeSightings || [],
      photos: formData.photos || [],
      photoStoragePaths: formData.photoStoragePaths || [],
      rating: formData.rating || 3,
      geo: formData.geo
    };

    try {
      setSaving(true);
      await onSave(fullLog);
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!initialData?.id;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-4 md:p-6 max-w-4xl mx-auto animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-ocean-900 flex items-center">
          <span className="text-3xl mr-2">🤿</span> {isEditing ? '로그 수정' : '로그 작성'}
        </h2>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">로그 번호</label>
          <input
            type="number"
            name="diveNumber"
            value={formData.diveNumber ?? ''}
            onChange={handleNumberChange}
            className="w-28 border rounded-full px-3 py-1.5 text-center font-semibold text-ocean-700 focus:ring-ocean-500 focus:border-ocean-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Basic Info */}
        <div className="space-y-4">
           <h3 className="font-semibold text-ocean-700 border-b pb-2">기본 정보</h3>
           
           {/* Photo Upload (Moved here) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">대표 사진</label>
            <div className="flex items-center justify-center">
              <label className="relative w-28 h-28 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center bg-gray-50 hover:bg-ocean-50 hover:border-ocean-300 transition cursor-pointer overflow-hidden group">
                {formData.photos && formData.photos[0] ? (
                  <>
                    <img src={formData.photos[0]} alt="Main" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center rounded-full">
                       <p className="text-white text-xs opacity-0 group-hover:opacity-100 font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                         편집
                       </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-2xl mb-1 opacity-50">📷</span>
                    <span className="text-[11px] text-gray-500">사진 업로드</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
            {formData.photos && formData.photos[0] && (
               <p className="text-xs text-gray-400 mt-1 text-center">
                 * 사진을 클릭하면 섬네일 위치를 다시 조정할 수 있습니다.
               </p>
            )}
          </div>
           <div>
             <label className="block text-sm font-medium text-gray-700">날짜</label>
             <input type="date" name="date" value={formData.date ?? ''} onChange={handleChange} className="mt-1 block w-full border rounded-md px-3 py-2" required />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700">장소 (지역)</label>
             <input type="text" name="location" value={formData.location ?? ''} onChange={handleChange} placeholder="예: 제주도 서귀포" className="mt-1 block w-full border rounded-md px-3 py-2" required />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">포인트 명</label>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 name="siteName" 
                value={formData.siteName ?? ''} 
                 onChange={handleChange} 
                 placeholder="예: 문섬 새끼섬" 
                 className="block w-full border rounded-md px-3 py-2 flex-1" 
                 required 
               />
               <Button 
                 type="button" 
                 variant="secondary" 
                 onClick={() => setShowMapModal(true)}
                 title="지도에서 위치 선택"
                 className="px-3 whitespace-nowrap"
               >
                 📍 지도
               </Button>
             </div>
             {formData.geo && (
                <div className="flex items-center justify-between mt-1 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                  <p className="text-xs text-blue-800 truncate">
                     위치 설정됨: {formData.geo.lat.toFixed(4)}, {formData.geo.lng.toFixed(4)}
                  </p>
                  <button 
                    type="button" 
                    onClick={handleClearLocation} 
                    className="text-xs text-red-500 hover:text-red-700 hover:underline ml-2 whitespace-nowrap"
                  >
                    삭제
                  </button>
                </div>
             )}
           </div>
        </div>

        {/* Technical Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-ocean-700 border-b pb-2">다이빙 데이터</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">입수 시간</label>
              <input type="time" name="timeIn" value={formData.timeIn ?? ''} onChange={handleChange} className="mt-1 block w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">출수 시간</label>
              <input type="time" name="timeOut" value={formData.timeOut ?? ''} onChange={handleChange} className="mt-1 block w-full border rounded-md px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">최대 수심 (m)</label>
              <input type="number" name="maxDepthMeters" value={formData.maxDepthMeters ?? ''} onChange={handleNumberChange} className="mt-1 block w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">다이빙 시간 (분)</label>
              <input type="number" name="durationMinutes" value={formData.durationMinutes ?? ''} onChange={handleNumberChange} className="mt-1 block w-full border rounded-md px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">시작 공기 (bar)</label>
              <input type="number" name="startPressureBar" value={formData.startPressureBar ?? ''} onChange={handleNumberChange} className="mt-1 block w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">종료 공기 (bar)</label>
              <input type="number" name="endPressureBar" value={formData.endPressureBar ?? ''} onChange={handleNumberChange} className="mt-1 block w-full border rounded-md px-3 py-2" />
            </div>
          </div>
        </div>

        {/* Conditions & Gear */}
        <div className="space-y-4">
           <h3 className="font-semibold text-ocean-700 border-b pb-2">환경 및 장비</h3>
           <div className="grid grid-cols-2 gap-2">
             <div>
               <label className="block text-sm font-medium text-gray-700">수온 (°C)</label>
               <input type="number" name="waterTempCelsius" value={formData.waterTempCelsius ?? ''} onChange={handleNumberChange} className="mt-1 block w-full border rounded-md px-3 py-2" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">시야 (m)</label>
               <input type="number" name="visibilityMeters" value={formData.visibilityMeters ?? ''} onChange={handleNumberChange} className="mt-1 block w-full border rounded-md px-3 py-2" />
             </div>
           </div>
           <div className="grid grid-cols-2 gap-2">
             <div>
               <label className="block text-sm font-medium text-gray-700">수트 두께 (mm)</label>
               <input type="number" name="suitThicknessMm" value={formData.suitThicknessMm ?? ''} onChange={handleNumberChange} className="mt-1 block w-full border rounded-md px-3 py-2" />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">웨이트 (kg)</label>
               <input type="number" name="weightsKg" value={formData.weightsKg ?? ''} onChange={handleNumberChange} className="mt-1 block w-full border rounded-md px-3 py-2" />
             </div>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700">다이빙 종류</label>
            <select name="diveType" value={formData.diveType ?? DiveType.FUN} onChange={handleChange} className="mt-1 block w-full border rounded-md px-3 py-2">
               {Object.values(DiveType).map(type => (
                 <option key={type} value={type}>{type}</option>
               ))}
             </select>
           </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">다이빙 노트</label>
        <textarea 
          name="notes" 
          value={formData.notes ?? ''} 
          onChange={handleChange} 
          rows={4} 
          className="w-full border rounded-md px-3 py-2 focus:ring-ocean-500 focus:border-ocean-500"
          placeholder="오늘의 다이빙은 어떠셨나요?"
        ></textarea>
      </div>

      {/* Marine Life - Only Badges now */}
      <div className="mb-6">
        <h3 className="font-semibold text-ocean-700 border-b pb-2 mb-4">해양 생물 기록</h3>
        
        {/* Badge Selector Only */}
        {badgesLoading ? (
          <div className="text-sm text-gray-500 mb-4 bg-gray-50 p-4 rounded-lg">
            나만의 배지를 불러오는 중입니다...
          </div>
        ) : myBadges.length > 0 ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">나만의 배지에서 추가</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {myBadges.map(badge => (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => handleAddBadgeLife(badge)}
                  className="flex-shrink-0 flex flex-col items-center gap-1 w-16 p-1 hover:bg-ocean-50 rounded-lg transition"
                  title={badge.name}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                    <img src={badge.icon} alt={badge.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs text-gray-600 truncate w-full text-center">{badge.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 mb-4 bg-gray-50 p-4 rounded-lg">
            <p>아직 생성된 '나만의 배지'가 없습니다.</p>
            <p className="text-xs mt-1">배지 탭에서 커스텀 배지를 만들어보세요!</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          {formData.marineLifeSightings?.map((life) => (
            <div key={life.id} className="bg-teal-50 border border-teal-200 text-teal-800 px-3 py-1 rounded-full text-sm flex items-center shadow-sm">
              {life.imageUrl ? (
                <img src={life.imageUrl} alt={life.name} className="w-5 h-5 rounded-full mr-2 object-cover border border-teal-200" />
              ) : (
                <span className="mr-2">🐟</span>
              )}
              <span className="font-medium">{life.name}</span>
              <button 
                type="button" 
                onClick={() => removeMarineLife(life.id)}
                className="ml-2 text-teal-500 hover:text-teal-700 font-bold"
              >
                &times;
              </button>
            </div>
          ))}
          {(!formData.marineLifeSightings || formData.marineLifeSightings.length === 0) && (
            <p className="text-sm text-gray-400 italic mt-2">기록된 생물이 없습니다.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          취소
        </Button>
        <Button type="submit" variant="primary" isLoading={saving} disabled={saving}>
          {isEditing ? '수정 완료' : '저장하기'}
        </Button>
      </div>

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">위치 선택</h3>
              <button onClick={() => setShowMapModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 flex-1">
               <p className="text-sm text-gray-500 mb-2">지도에서 다이빙 포인트 위치를 클릭하세요.</p>
               <LocationPicker 
                 lat={formData.geo?.lat} 
                 lng={formData.geo?.lng} 
                 onLocationSelect={handleLocationSelect} 
               />
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
               <Button onClick={() => setShowMapModal(false)}>확인</Button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Editor Modal */}
      {editingImageSrc && (
        <PhotoEditorModal 
          imageSrc={editingImageSrc}
          onClose={() => setEditingImageSrc(null)}
          onSave={handlePhotoSave}
        />
      )}
    </form>
  );
};
