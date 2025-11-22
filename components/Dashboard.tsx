import React from 'react';
import { DiveLog, UserStats } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  logs: DiveLog[];
  stats: UserStats;
  userName?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ logs, stats, userName }) => {
  // Prepare data for charts - reverse to show chronological order left-to-right
  const chartData = [...logs].reverse().map(log => ({
    name: `No. ${log.diveNumber}`,
    depth: log.maxDepthMeters,
    time: log.durationMinutes,
    date: new Date(log.date).toLocaleDateString()
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-ocean-600 to-ocean-800 text-white shadow-lg p-8 mb-8">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-ocean-400 opacity-20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">
            환영합니다, {userName || 'Diver'}님! 👋
          </h2>
          <p className="text-ocean-100 text-lg max-w-2xl">
            지금까지 총 <span className="font-bold text-white">{stats.totalDives}회</span>의 다이빙으로 
            <span className="font-bold text-white"> {Math.floor(stats.totalTimeMinutes / 60)}시간 {stats.totalTimeMinutes % 60}분</span> 동안 
            바닷속 세상을 탐험하셨네요.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Dives */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-ocean-100 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-ocean-50 flex items-center justify-center text-ocean-600 group-hover:bg-ocean-600 group-hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M16 10V7a4 4 0 10-8 0v3m0 0h8" />
              </svg>
            </div>
            <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">+1 this week</span>
          </div>
          <div className="text-gray-500 text-sm font-medium">총 다이빙</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats.totalDives}</div>
        </div>

        {/* Time Underwater */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-ocean-100 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-gray-500 text-sm font-medium">총 다이빙 시간</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">
            {Math.floor(stats.totalTimeMinutes / 60)}<span className="text-base text-gray-400 font-normal ml-1">시간</span> {stats.totalTimeMinutes % 60}<span className="text-base text-gray-400 font-normal ml-1">분</span>
          </div>
        </div>

        {/* Max Depth */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-ocean-100 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
          <div className="text-gray-500 text-sm font-medium">최대 수심</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">
            {stats.maxDepth}<span className="text-base text-gray-400 font-normal ml-1">m</span>
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-ocean-100 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="text-gray-500 text-sm font-medium">방문한 포인트</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">
            {stats.uniqueLocations}<span className="text-base text-gray-400 font-normal ml-1">곳</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Depth Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-ocean-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">수심 기록</h3>
              <p className="text-sm text-gray-500">최근 다이빙의 최대 수심 변화</p>
            </div>
            <div className="p-2 bg-ocean-50 rounded-lg text-ocean-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis 
                  reversed 
                  width={40}
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                  }}
                  itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="depth" 
                  stroke="#0ea5e9" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorDepth)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Duration Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-ocean-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">다이빙 시간</h3>
              <p className="text-sm text-gray-500">다이빙 시간 추이 (분)</p>
            </div>
            <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis 
                  width={40}
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                  }}
                  itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="time" 
                  stroke="#14b8a6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#14b8a6', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, fill: '#0d9488' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
