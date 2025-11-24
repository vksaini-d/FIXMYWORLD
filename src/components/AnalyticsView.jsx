import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { issueCategories } from '../constants';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatCard = ({ label, value, color, border }) => (
    <div className={`flex flex-col items-center justify-center rounded-xl border ${border} bg-gray-900/80 p-6 shadow-lg backdrop-blur-sm`}>
        <span className={`text-4xl font-bold ${color}`}>{value}</span>
        <span className="mt-2 text-sm text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
);

export const AnalyticsView = ({ data }) => {
    const chartData = {
        labels: Object.keys(data.byCategory).map(key => issueCategories.find(c => c.value === key)?.label || key),
        datasets: [
            {
                label: '# of Issues',
                data: Object.values(data.byCategory),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.5)', // Blue
                    'rgba(34, 197, 94, 0.5)',  // Green
                    'rgba(234, 179, 8, 0.5)',  // Yellow
                    'rgba(6, 182, 212, 0.5)',  // Cyan
                    'rgba(168, 85, 247, 0.5)', // Purple
                    'rgba(239, 68, 68, 0.5)',  // Red
                    'rgba(107, 114, 128, 0.5)', // Gray
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(6, 182, 212, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(107, 114, 128, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="space-y-8 pb-10">
            <h2 className="text-3xl font-orbitron text-cyan-400">Platform Analytics</h2>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard label="Total Issues" value={data.total} color="text-cyan-400" border="border-cyan-500/50" />
                <StatCard label="Reported" value={data.reported} color="text-red-400" border="border-red-500/50" />
                <StatCard label="In Progress" value={data.inProgress} color="text-yellow-400" border="border-yellow-500/50" />
                <StatCard label="Resolved" value={data.resolved} color="text-green-400" border="border-green-500/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 flex flex-col items-center">
                    <h3 className="mb-4 text-xl font-bold text-gray-300">Issue Distribution</h3>
                    <div className="w-full max-w-xs">
                        <Pie data={chartData} />
                    </div>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                    <h3 className="mb-4 text-xl font-bold text-gray-300">Category Breakdown</h3>
                    <div className="space-y-3">
                        {Object.entries(data.byCategory).map(([catKey, count]) => {
                            const label = issueCategories.find(c => c.value === catKey)?.label || catKey;
                            const percentage = data.total > 0 ? ((count / data.total) * 100).toFixed(1) : 0;
                            return (
                                <div key={catKey}>
                                    <div className="mb-1 flex justify-between text-sm">
                                        <span className="text-gray-400">{label}</span>
                                        <span className="text-cyan-400">{count} ({percentage}%)</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                                        <div
                                            className="h-full bg-cyan-600 transition-all duration-500"
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
    );
};
