import React from 'react';
import { DiveLog, UserStats } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  logs: DiveLog[];
  stats: UserStats;
}

export const Dashboard: React.FC<DashboardProps> = ({ logs, stats }) => {
  // Prepare data for charts - reverse to show chronological order left-to-right
  const chartData = [...logs].reverse().map(log => ({
    name: `No. ${log.diveNumber}`,
    depth: log.maxDepthMeters,
    time: log.durationMinutes,
    date: new Date(log.date).toLocaleDateString()
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-ocean-100">
          <div className="text-ocean-500 text-sm font-medium uppercase tracking-wide">Total Dives</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats.totalDives}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-ocean-100">
          <div className="text-ocean-500 text-sm font-medium uppercase tracking-wide">Time Underwater</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">
            {Math.floor(stats.totalTimeMinutes / 60)}<span className="text-lg text-gray-500 font-normal">h</span> {stats.totalTimeMinutes % 60}<span className="text-lg text-gray-500 font-normal">m</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-ocean-100">
          <div className="text-ocean-500 text-sm font-medium uppercase tracking-wide">Max Depth</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats.maxDepth}<span className="text-lg text-gray-500 font-normal">m</span></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-ocean-100">
          <div className="text-ocean-500 text-sm font-medium uppercase tracking-wide">Locations</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{stats.uniqueLocations}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-ocean-100 h-80 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex-shrink-0">Depth History</h3>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0f2fe" />
                <XAxis dataKey="name" hide />
                <YAxis reversed label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Area type="monotone" dataKey="depth" stroke="#0284c7" fillOpacity={1} fill="url(#colorDepth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-ocean-100 h-80 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex-shrink-0">Dive Duration</h3>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0f2fe" />
                <XAxis dataKey="name" hide />
                <YAxis label={{ value: 'Time (min)', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Line type="monotone" dataKey="time" stroke="#14b8a6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};