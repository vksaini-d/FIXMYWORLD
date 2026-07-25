import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { issueCategories } from '../constants';
import { getCategoryIcon } from './Icons';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatCard = ({ label, value, color, glowColor, icon }) => (
    <div className="glass-pod-layered glass-card-hover relative overflow-hidden">
        <div className="glass-pod-inner p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${color}`}>
                    {icon}
                </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
                <span className={`text-4xl font-black font-orbitron ${color}`}>{value}</span>
                <div className={`h-2 w-2 rounded-full animate-pulse ${glowColor}`} />
            </div>
        </div>
    </div>
);

export const AnalyticsView = ({ data }) => {
    const resolutionRate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;

    const chartData = {
        labels: Object.keys(data.byCategory).map(key => issueCategories.find(c => c.value === key)?.label || key),
        datasets: [
            {
                label: '# of Issues',
                data: Object.values(data.byCategory),
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',  // Sage Emerald
                    'rgba(56, 189, 248, 0.8)',  // Slate Blue
                    'rgba(245, 158, 11, 0.8)',  // Ochre Amber
                    'rgba(168, 85, 247, 0.8)', // Muted Purple
                    'rgba(244, 63, 94, 0.8)',  // Soft Rose
                    'rgba(148, 163, 184, 0.8)',// Platinum Slate
                ],
                borderColor: [
                    '#059669',
                    '#0284c7',
                    '#d97706',
                    '#7c3aed',
                    '#e11d48',
                    '#475569',
                ],
                borderWidth: 1.5,
                hoverOffset: 8,
            },
        ],
    };

    const chartOptions = {
        cutout: '74%',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                titleColor: '#34d399',
                bodyColor: '#f1f5f9',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 10,
            },
        },
    };

    return (
        <div className="space-y-8 pb-16 max-w-6xl mx-auto">
            {/* Header with Editorial Styling */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                    <h2 className="text-3xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-slate-200">
                        Platform Telemetry
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-wider">Civic resolution metrics and distribution analytics</p>
                </div>

                <div className="glass-pod-layered">
                    <div className="glass-pod-inner px-4 py-2 flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-semibold">Resolution Rate</span>
                        <span className="text-xl font-bold font-orbitron text-emerald-400">{resolutionRate}%</span>
                    </div>
                </div>
            </div>

            {/* Stat Cards Grid - Double-Ring Pod Geometries */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    label="Total Reports"
                    value={data.total}
                    color="text-emerald-400"
                    glowColor="bg-emerald-400"
                    icon={<svg className="w-5 h-5 stroke-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                />
                <StatCard
                    label="Open Issues"
                    value={data.reported}
                    color="text-rose-400"
                    glowColor="bg-rose-400"
                    icon={<svg className="w-5 h-5 stroke-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                    label="In Progress"
                    value={data.inProgress}
                    color="text-amber-400"
                    glowColor="bg-amber-400"
                    icon={<svg className="w-5 h-5 stroke-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                    label="Resolved"
                    value={data.resolved}
                    color="text-teal-400"
                    glowColor="bg-teal-400"
                    icon={<svg className="w-5 h-5 stroke-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </div>

            {/* Visual Charts Grid - Architectural Chamfer & Pod Mix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Doughnut Chart in Chamfer Cut-Corner Card */}
                <div className="glass-card-chamfer p-7 flex flex-col items-center relative">
                    <h3 className="mb-6 text-base font-bold font-orbitron text-slate-200 uppercase tracking-wider self-start flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Issue Distribution</span>
                    </h3>
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        <Doughnut data={chartData} options={chartOptions} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black font-orbitron text-emerald-400">{data.total}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Logged Items</span>
                        </div>
                    </div>
                </div>

                {/* Category Progress Breakdown in Layered Pod Card */}
                <div className="glass-pod-layered">
                    <div className="glass-pod-inner p-7">
                        <h3 className="mb-6 text-base font-bold font-orbitron text-slate-200 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>Category Breakdown</span>
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(data.byCategory).map(([catKey, count]) => {
                                const label = issueCategories.find(c => c.value === catKey)?.label || catKey;
                                const percentage = data.total > 0 ? ((count / data.total) * 100).toFixed(1) : 0;
                                return (
                                    <div key={catKey} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <div className="p-1 rounded-lg bg-white/5 border border-white/10 text-emerald-400">
                                                    {getCategoryIcon(catKey, "w-4 h-4")}
                                                </div>
                                                <span className="font-semibold">{label}</span>
                                            </div>
                                            <span className="text-emerald-400 font-mono text-xs font-bold">
                                                {count} ({percentage}%)
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-black/50 border border-white/10 p-0.5">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
