import React, { useState } from 'react';
import { Badge } from '../types';
import { AVAILABLE_BADGES } from '../services/storageService';
import { Button } from './Button';
import { BadgeMakerModal } from './BadgeMakerModal';

interface BadgeCollectionProps {
  unlockedBadges: Badge[];
  onBadgeCreated?: () => void | Promise<void>;
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({ unlockedBadges, onBadgeCreated }) => {
  const [isMakerOpen, setIsMakerOpen] = useState(false);
  const unlockedIds = new Set(unlockedBadges.map(b => b.id));

  // Combine system badges and custom badges (custom badges are in unlockedBadges but not in AVAILABLE_BADGES)
  // We want to show all available system badges (locked or unlocked) AND any unlocked custom badges
  
  // 1. Get all custom badges from the unlocked list (they have IDs starting with 'custom-' or aren't in available)
  const customBadges = unlockedBadges.filter(b => !AVAILABLE_BADGES.find(ab => ab.id === b.id));
  
  // 2. Available system badges
  const systemBadges = AVAILABLE_BADGES;

  const handleCreated = () => {
    if (onBadgeCreated) {
      void onBadgeCreated();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-ocean-100 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="text-4xl sm:text-5xl">🐋</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">생물 배지</h2>
              <p className="text-sm text-gray-500 mt-1">직접 촬영한 해양 생물 사진으로 나만의 특별한 배지 컬렉션을 완성해보세요.</p>
            </div>
          </div>
          <div>
            <Button 
              onClick={() => setIsMakerOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-none shadow-md w-full sm:w-auto"
              icon={<span>✨</span>}
            >
              생물 배지 만들기
            </Button>
          </div>
        </div>

        {/* Custom Badges Section (if any) */}
        {customBadges.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                나의 해양 생물들
                <span className="ml-2 text-xs text-gray-400 font-normal">({customBadges.length})</span>
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {customBadges.map((badge) => (
                <div 
                  key={badge.id} 
                  className="flex flex-col items-center p-4 rounded-xl text-center bg-white border-2 border-purple-100 shadow-sm hover:shadow-md hover:scale-105 transition-all"
                >
                  <div className="w-16 h-16 mb-3 rounded-full overflow-hidden border-2 border-purple-200 shadow-inner animate-float">
                    {badge.icon.startsWith('data:image') || badge.icon.startsWith('http') ? (
                      <img src={badge.icon} alt={badge.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl leading-[4rem]">{badge.icon}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm mb-1 text-gray-900">{badge.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Badges Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">나의 업적</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {systemBadges.map((badge) => {
              const isUnlocked = unlockedIds.has(badge.id);
              return (
                <div 
                  key={badge.id} 
                  className={`flex flex-col items-center p-4 rounded-xl text-center transition-all ${
                    isUnlocked 
                      ? 'bg-gradient-to-br from-ocean-50 to-white border border-ocean-100 shadow-sm hover:shadow-md hover:scale-105' 
                      : 'bg-gray-50 opacity-50 grayscale'
                  }`}
                >
                  <div className={`text-4xl mb-3 ${isUnlocked ? 'animate-float' : ''}`}>
                    {badge.icon}
                  </div>
                  <h3 className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                    {badge.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {badge.description}
                  </p>
                  {isUnlocked && (
                    <span className="mt-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] rounded-full font-bold">
                      획득!
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">나의 업적</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {systemBadges.map((badge) => {
            const isUnlocked = unlockedIds.has(badge.id);
            return (
              <div 
                key={badge.id} 
                className={`flex flex-col items-center p-4 rounded-xl text-center transition-all ${
                  isUnlocked 
                    ? 'bg-gradient-to-br from-ocean-50 to-white border border-ocean-100 shadow-sm hover:shadow-md hover:scale-105' 
                    : 'bg-gray-50 opacity-50 grayscale'
                }`}
              >
                <div className={`text-4xl mb-3 ${isUnlocked ? 'animate-float' : ''}`}>
                  {badge.icon}
                </div>
                <h3 className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                  {badge.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {badge.description}
                </p>
                {isUnlocked && (
                  <span className="mt-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] rounded-full font-bold">
                    획득!
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {isMakerOpen && (
        <BadgeMakerModal 
          onClose={() => setIsMakerOpen(false)} 
          onCreated={handleCreated} 
        />
      )}
    </div>
  );
};