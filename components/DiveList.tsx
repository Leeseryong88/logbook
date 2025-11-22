
import React from 'react';
import { DiveLog } from '../types';

interface DiveListProps {
  logs: DiveLog[];
  onSelectLog: (log: DiveLog) => void;
}

export const DiveList: React.FC<DiveListProps> = ({ logs, onSelectLog }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-16 bg-white/50 rounded-2xl border border-dashed border-ocean-200 animate-fade-in">
        <div className="text-6xl mb-4 opacity-80">🤿</div>
        <h3 className="text-xl font-bold text-ocean-900">아직 기록된 다이빙이 없습니다.</h3>
        <p className="text-gray-500 mt-2">첫 번째 다이빙 로그를 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 animate-fade-in">
      {logs.map((log) => (
        <div 
          key={log.id} 
          onClick={() => onSelectLog(log)}
          className="bg-white rounded-2xl p-4 shadow-sm border border-ocean-100 hover:shadow-md hover:border-ocean-200 transition-all cursor-pointer group flex items-center relative overflow-hidden"
        >
          {/* Decorative Background Gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-ocean-50 to-transparent opacity-50 -z-0 rounded-bl-full pointer-events-none" />

          {/* Circular Thumbnail */}
          <div className="relative shrink-0 z-10 mr-4 sm:mr-5">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full shadow-md border-4 border-white overflow-hidden bg-ocean-50 relative group-hover:scale-105 transition-transform duration-300">
              {log.photos && log.photos.length > 0 ? (
                <img src={log.photos[0]} alt={log.siteName} className="w-full h-full object-cover object-center" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ocean-300 bg-ocean-50">
                   <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                   </svg>
                </div>
              )}
            </div>
            {/* Dive Number Badge */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-ocean-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border-2 border-white whitespace-nowrap z-20">
              #{log.diveNumber}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 z-10 py-1">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-lg text-gray-900 truncate pr-2 group-hover:text-ocean-600 transition-colors">
                {log.siteName}
              </h3>
              {/* Dive Type Badge - Compact */}
              <div className="shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap border ${
                   log.diveType === 'Fun Dive' ? 'bg-green-50 text-green-700 border-green-100' :
                   log.diveType === 'Training' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                   'bg-ocean-50 text-ocean-700 border-ocean-100'
                }`}>
                  {log.diveType}
                </span>
              </div>
            </div>

            <div className="flex items-center text-xs text-gray-500 mb-3">
               <span className="truncate max-w-[120px]">{log.location}</span>
               <span className="mx-1.5 text-gray-300">|</span>
               <span>{new Date(log.date).toLocaleDateString()}</span>
            </div>
            
            {/* Stats Grid */}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex flex-col items-start bg-gray-50 rounded px-2 py-1 min-w-[50px]">
                <span className="text-[9px] text-gray-400 uppercase leading-none mb-0.5">Depth</span>
                <span className="font-bold text-ocean-700 leading-none">{log.maxDepthMeters}m</span>
              </div>
              <div className="flex flex-col items-start bg-gray-50 rounded px-2 py-1 min-w-[50px]">
                <span className="text-[9px] text-gray-400 uppercase leading-none mb-0.5">Time</span>
                <span className="font-bold text-ocean-700 leading-none">{log.durationMinutes}m</span>
              </div>
              {/* Marine Life Icons (if any) */}
              {log.marineLifeSightings && log.marineLifeSightings.length > 0 && (
                 <div className="flex-1 flex justify-end items-center gap-[-4px]">
                    <div className="flex -space-x-1.5 overflow-hidden pl-1">
                      {log.marineLifeSightings.slice(0, 3).map((life, i) => (
                        <div key={i} className="w-6 h-6 rounded-full ring-2 ring-white flex-shrink-0 overflow-hidden bg-gray-100" title={life.name}>
                          {life.imageUrl ? (
                            <img src={life.imageUrl} alt={life.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px]">🐟</div>
                          )}
                        </div>
                      ))}
                    </div>
                    {log.marineLifeSightings.length > 3 && (
                        <span className="text-[10px] text-gray-400 ml-1">+{log.marineLifeSightings.length - 3}</span>
                    )}
                 </div>
              )}
            </div>
          </div>
          
          {/* Right Chevron */}
          <div className="ml-2 text-gray-300 group-hover:text-ocean-400 group-hover:translate-x-1 transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </div>

        </div>
      ))}
    </div>
  );
};
