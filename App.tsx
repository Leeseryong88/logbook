import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { LogEntryForm } from './components/LogEntryForm';
import { DiveList } from './components/DiveList';
import { LogDetailModal } from './components/LogDetailModal';
import { Button } from './components/Button';
import { DiveMap } from './components/DiveMap';
import { DiveLog, UserStats, Badge } from './types';
import { getLogs, saveLog, deleteLog, getUnlockedBadges } from './services/storageService';
import { useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { MyPage } from './components/MyPage';

const LOGO_SRC = '/dive-mori-logo.png';

const App: React.FC = () => {
  const { user, loading: authLoading, logout, profile, role, profileLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'logs' | 'map' | 'mypage' | 'add'>('dashboard');
  const [logs, setLogs] = useState<DiveLog[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedLog, setSelectedLog] = useState<DiveLog | null>(null);
  const [mapFocusLogId, setMapFocusLogId] = useState<string | null>(null);
  const [logToEdit, setLogToEdit] = useState<DiveLog | undefined>(undefined);
  const [dataLoading, setDataLoading] = useState(false);
  const isAdmin = role === 'admin';

  const refreshData = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setBadges([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    try {
      const storedLogs = await getLogs(user.uid);
      setLogs(storedLogs);
      const unlocked = await getUnlockedBadges(storedLogs, user.uid);
      setBadges(unlocked);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const handleSaveLog = async (log: DiveLog) => {
    if (!user) return;
    await saveLog(log, user.uid);
    await refreshData();
    setCurrentView('logs');
    setLogToEdit(undefined);
  };

  const handleDeleteLog = async (id: string) => {
    if (!user) return;
    await deleteLog(id, user.uid);
    await refreshData();
    setSelectedLog(null);
  };

  const handleViewOnMap = (log: DiveLog) => {
    setSelectedLog(null);
    setMapFocusLogId(log.id);
    setCurrentView('map');
  };

  const handleEditLog = (log: DiveLog) => {
    setLogToEdit(log);
    setSelectedLog(null);
    setCurrentView('add');
  };

  const handleStartNewLog = () => {
    setLogToEdit(undefined);
    setCurrentView('add');
  };

  // Calculate Stats
  const stats: UserStats = {
    totalDives: logs.length,
    totalTimeMinutes: logs.reduce((acc, log) => acc + log.durationMinutes, 0),
    maxDepth: logs.reduce((max, log) => Math.max(max, log.maxDepthMeters), 0),
    uniqueLocations: new Set(logs.map(l => l.location)).size
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ocean-50">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-ocean-200 border-t-ocean-500 rounded-full mx-auto mb-4" />
          <p className="text-sm text-gray-500">사용자 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const userName = profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Diver';

  const NavIcon = ({ name, active }: { name: string; active: boolean }) => {
    const colorClass = active ? "text-ocean-600" : "text-gray-400";
    
    switch (name) {
      case 'dashboard':
        return (
          <svg className={`w-6 h-6 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'logs':
        return (
          <svg className={`w-6 h-6 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'map':
        return (
          <svg className={`w-6 h-6 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        );
      case 'mypage':
        return (
          <svg className={`w-6 h-6 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-ocean-50 text-gray-900 pb-24 md:pb-10">
      {/* Desktop Header */}
      <header className="bg-white border-b border-ocean-100 sticky top-0 z-30 shadow-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={LOGO_SRC}
              alt="DiveMori 로고"
              className="w-9 h-9 rounded-2xl border border-ocean-100 object-cover shadow-sm"
            />
            <h1 className="text-xl font-bold text-ocean-900 tracking-tight">DiveMori</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-2">
                <p className="text-sm font-semibold text-ocean-900">{userName}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    role === 'admin'
                      ? 'bg-purple-100 text-purple-700 border-purple-200'
                      : role === 'instructor'
                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                        : 'bg-blue-100 text-blue-700 border-blue-200'
                  }`}
                >
                  {role === 'admin' ? 'Admin' : role === 'instructor' ? 'Instructor' : 'Diver'}
                </span>
              </div>
              <p className="text-xs text-gray-500">{profile?.email || user.email}</p>
            </div>
            <Button onClick={handleStartNewLog} size="sm" icon={<span>+</span>}>
              기록하기
            </Button>
            <Button onClick={logout} size="sm" variant="secondary">
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="bg-white border-b border-ocean-100 sticky top-0 z-30 shadow-sm md:hidden">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={LOGO_SRC}
              alt="DiveMori 로고"
              className="w-8 h-8 rounded-2xl border border-ocean-100 object-cover shadow-sm"
            />
            <h1 className="text-lg font-bold text-ocean-900 tracking-tight">DiveMori</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            로그아웃
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        
        {/* Desktop Navigation Tabs */}
        <div className="hidden md:flex items-center space-x-2 mb-8 bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-white/20 shadow-sm w-fit">
          {[
            { id: 'dashboard', label: '대시보드', icon: '📊' },
            { id: 'logs', label: '로그북', icon: '📖' },
            { id: 'map', label: '지도', icon: '🗺️' },
            { id: 'mypage', label: '마이페이지', icon: '👤' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentView(tab.id as any);
                if (tab.id === 'map') {
                  setMapFocusLogId(null);
                }
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                currentView === tab.id 
                  ? 'bg-ocean-600 text-white shadow-md transform scale-[1.02]' 
                  : 'text-gray-500 hover:bg-white hover:text-ocean-600 hover:shadow-sm'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Views */}
        {dataLoading ? (
          <div className="py-16 text-center text-gray-500">
            데이터를 불러오는 중입니다...
          </div>
        ) : (
          <div className="animate-fade-in">
            {currentView === 'dashboard' && <Dashboard logs={logs} stats={stats} userName={userName} />}
            
            {currentView === 'logs' && <DiveList logs={logs} onSelectLog={setSelectedLog} />}
            
            {currentView === 'map' && (
              <DiveMap 
                logs={logs} 
                onSelectLog={setSelectedLog} 
                focusedLogId={mapFocusLogId}
              />
            )}

            {currentView === 'mypage' && (
              <MyPage
                profile={profile}
                unlockedBadges={badges}
                onBadgeCreated={() => {
                  void refreshData();
                }}
              />
            )}

            {currentView === 'add' && (
              <LogEntryForm 
                key={logToEdit?.id || 'new'} 
                initialData={logToEdit}
                onSave={handleSaveLog} 
                onCancel={() => {
                  setLogToEdit(undefined);
                  setCurrentView('dashboard');
                }} 
                lastDiveNumber={logs.length > 0 ? logs[0].diveNumber : 0}
              />
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40 flex justify-around items-center h-16 px-2 safe-area-pb">
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="flex flex-col items-center justify-center w-full h-full space-y-1"
        >
          <NavIcon name="dashboard" active={currentView === 'dashboard'} />
          <span className={`text-[10px] ${currentView === 'dashboard' ? 'text-ocean-600 font-bold' : 'text-gray-500'}`}>홈</span>
        </button>
        
        <button 
          onClick={() => setCurrentView('logs')}
          className="flex flex-col items-center justify-center w-full h-full space-y-1"
        >
          <NavIcon name="logs" active={currentView === 'logs'} />
          <span className={`text-[10px] ${currentView === 'logs' ? 'text-ocean-600 font-bold' : 'text-gray-500'}`}>로그북</span>
        </button>

        <button 
          onClick={handleStartNewLog}
          className="flex flex-col items-center justify-center -mt-6"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-ocean-50 transition-transform active:scale-95 ${currentView === 'add' ? 'bg-ocean-700' : 'bg-ocean-600'}`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </button>

        <button 
          onClick={() => {
            setCurrentView('map');
            setMapFocusLogId(null);
          }}
          className="flex flex-col items-center justify-center w-full h-full space-y-1"
        >
          <NavIcon name="map" active={currentView === 'map'} />
          <span className={`text-[10px] ${currentView === 'map' ? 'text-ocean-600 font-bold' : 'text-gray-500'}`}>지도</span>
        </button>
        
        <button 
          onClick={() => setCurrentView('mypage')}
          className="flex flex-col items-center justify-center w-full h-full space-y-1"
        >
          <NavIcon name="mypage" active={currentView === 'mypage'} />
          <span className={`text-[10px] ${currentView === 'mypage' ? 'text-ocean-600 font-bold' : 'text-gray-500'}`}>마이페이지</span>
        </button>
      </nav>

      {/* Modal */}
      {selectedLog && (
        <LogDetailModal 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
          onDelete={handleDeleteLog}
          onViewOnMap={handleViewOnMap}
          onEdit={handleEditLog}
        />
      )}

    </div>
  );
};

export default App;