import React from 'react';
import { DiveLog } from '../types';
import { Button } from './Button';

interface LogDetailModalProps {
  log: DiveLog;
  onClose: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onViewOnMap: (log: DiveLog) => void;
  onEdit: (log: DiveLog) => void;
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({ log, onClose, onDelete, onViewOnMap, onEdit }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-fade-in flex flex-col">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900 truncate max-w-[200px] sm:max-w-md">{log.siteName}</h2>
            <p className="text-sm text-gray-500">{log.location} • {new Date(log.date).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Photos Carousel style */}
          {log.photos && log.photos.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
              {log.photos.map((photo, idx) => (
                <img 
                  key={idx} 
                  src={photo} 
                  alt="Dive" 
                  className="h-64 w-auto rounded-lg shadow-md object-cover object-center shrink-0" 
                />
              ))}
            </div>
          )}

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-ocean-50 p-3 rounded-lg text-center">
                <span className="block text-xs text-ocean-500 uppercase">Max Depth</span>
                <span className="text-lg font-bold text-ocean-900">{log.maxDepthMeters}m</span>
             </div>
             <div className="bg-ocean-50 p-3 rounded-lg text-center">
                <span className="block text-xs text-ocean-500 uppercase">Duration</span>
                <span className="text-lg font-bold text-ocean-900">{log.durationMinutes} min</span>
             </div>
             <div className="bg-ocean-50 p-3 rounded-lg text-center">
                <span className="block text-xs text-ocean-500 uppercase">Water Temp</span>
                <span className="text-lg font-bold text-ocean-900">{log.waterTempCelsius}°C</span>
             </div>
             <div className="bg-ocean-50 p-3 rounded-lg text-center">
                <span className="block text-xs text-ocean-500 uppercase">Visibility</span>
                <span className="text-lg font-bold text-ocean-900">{log.visibilityMeters}m</span>
             </div>
          </div>

          {/* Map Link */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center justify-between">
            <div className="flex items-center text-gray-700">
              <span className="mr-2">📍</span>
              <span className="truncate">{log.location}</span>
            </div>
            {log.geo && (
              <button 
                onClick={() => onViewOnMap(log)}
                className="text-ocean-600 hover:text-ocean-800 text-sm font-medium flex items-center whitespace-nowrap ml-2"
              >
                지도에서 보기 &rarr;
              </button>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Dive Notes</h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg text-sm">
              {log.notes || "No notes recorded."}
            </p>
          </div>

          {/* Marine Observation */}
          {log.marineLifeSightings && log.marineLifeSightings.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">해양 관측 기록</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {log.marineLifeSightings.map((life, idx) => (
                   <div key={idx} className="flex items-start p-3 bg-teal-50 rounded-lg border border-teal-100">
                     {life.imageUrl ? (
                        <img 
                          src={life.imageUrl} 
                          alt={life.name} 
                          className="w-12 h-12 rounded-full object-cover border border-teal-200 mr-3 flex-shrink-0 bg-white"
                        />
                     ) : (
                        <div className="text-3xl mr-3 flex-shrink-0">🐟</div>
                     )}
                     <div className="min-w-0">
                       <div className="font-bold text-teal-900 truncate">{life.name}</div>
                       <div className="text-xs text-teal-600 mb-1 truncate">{life.scientificName}</div>
                       <div className="text-xs text-teal-800 opacity-80 line-clamp-2">{life.description}</div>
                     </div>
                   </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between items-center rounded-b-none sm:rounded-b-2xl pb-safe">
           <Button variant="danger" onClick={() => {
             if(confirm('정말로 이 로그를 삭제하시겠습니까?')) {
               onDelete(log.id);
               onClose();
             }
          }}>
            삭제
          </Button>
          
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => onEdit(log)}>
              수정
            </Button>
            <Button variant="secondary" onClick={onClose}>닫기</Button>
          </div>
        </div>
      </div>
    </div>
  );
};