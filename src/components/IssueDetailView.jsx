import React, { useEffect, useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { issueCategories } from '../constants';
import { getCategoryIcon, IconLocation, IconCheck } from './Icons';

export const IssueDetailView = ({ issue, handleBack, db, userId }) => {
    const [address, setAddress] = useState('Locating address...');

    useEffect(() => {
        if (issue?.lat && issue?.lng) {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${issue.lat}&lon=${issue.lng}`)
                .then(res => res.json())
                .then(data => setAddress(data.display_name || 'Address not found'))
                .catch(() => setAddress('Address unavailable'));
        }
    }, [issue]);

    if (!issue) {
        return (
            <div className="flex h-64 items-center justify-center">
                <span className="font-orbitron text-emerald-400 animate-pulse">Loading Issue Data...</span>
            </div>
        );
    }

    const hasUpvoted = issue.upvotes && issue.upvotes.includes(userId);

    const handleUpvote = async () => {
        if (!db || !userId) return;
        try {
            if (hasUpvoted) {
                toast('You have already confirmed this issue.', { icon: 'ℹ️' });
                return;
            }
            await updateDoc(doc(db, 'issues', issue.id), {
                upvotes: arrayUnion(userId),
            });
            toast.success('Issue upvoted!');
        } catch (e) {
            console.error(e);
            toast.error('Failed to upvote');
        }
    };

    const categoryLabel = issueCategories.find(c => c.value === issue.category)?.label || issue.category;

    return (
        <div className="mx-auto max-w-4xl pb-16 space-y-6">
            <button onClick={handleBack} className="flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors uppercase font-mono tracking-wider">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                <span>Back to Dashboard</span>
            </button>

            <div className="glass-pod-layered">
                <div className="glass-pod-inner p-6 md:p-8 space-y-6">
                    
                    {/* Header Info */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-white/10 pb-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                    {getCategoryIcon(issue.category, "w-5 h-5")}
                                </span>
                                <span className="text-xs font-bold font-orbitron uppercase tracking-wider text-emerald-300">
                                    {categoryLabel}
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 break-words">{issue.title}</h1>
                        </div>

                        <div className={`px-4 py-1.5 rounded-xl border text-xs font-bold font-orbitron self-start uppercase tracking-wider ${
                            issue.status === 'resolved'
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                : issue.status === 'in-progress'
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                : 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                        }`}>
                            {issue.status}
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            {/* Optional Attached Image */}
                            {issue.imageUrl && (
                                <div className="rounded-2xl overflow-hidden border border-white/15 max-h-80 w-full bg-black/50">
                                    <img src={issue.imageUrl} alt="Attached Issue Evidence" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Description</h3>
                                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{issue.description}</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                                    <IconLocation className="w-4 h-4 text-emerald-400" />
                                    <span>Geographic Location</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-200">{address}</p>
                                <p className="text-xs font-mono text-emerald-400/80">Lat: {issue.lat?.toFixed(6)}, Lng: {issue.lng?.toFixed(6)}</p>
                            </div>

                            <div className="text-xs text-slate-500 border-t border-white/10 pt-4 font-mono">
                                Logged on: {issue.createdAt?.toDate ? issue.createdAt.toDate().toLocaleString() : 'Recent'}
                            </div>
                        </div>

                        {/* Upvote / Community Priority Card */}
                        <div className="glass-card-chamfer p-6 flex flex-col items-center justify-center space-y-4 text-center h-fit">
                            <span className="text-5xl font-black font-orbitron text-emerald-400">{issue.upvotes?.length || 0}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono">Community Upvotes</span>

                            <button
                                onClick={handleUpvote}
                                disabled={hasUpvoted}
                                className={`w-full rounded-xl py-3 px-4 font-bold text-xs font-orbitron transition-all flex items-center justify-center gap-2 ${
                                    hasUpvoted
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                                        : 'glass-btn'
                                }`}
                            >
                                {hasUpvoted ? (
                                    <>
                                        <IconCheck className="w-4 h-4 text-emerald-400" />
                                        <span>Confirmed Upvote</span>
                                    </>
                                ) : (
                                    <span>▲ Upvote Issue</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
