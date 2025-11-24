import React, { useEffect, useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { issueCategories } from '../constants';

export const IssueDetailView = ({ issue, handleBack, getCategoryClass, db, userId }) => {
    const [address, setAddress] = useState('Locating address...');

    useEffect(() => {
        if (issue?.lat && issue?.lng) {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${issue.lat}&lon=${issue.lng}`)
                .then(res => res.json())
                .then(data => setAddress(data.display_name || 'Address not found'))
                .catch(() => setAddress('Address unavailable'));
        }
    }, [issue]);

    if (!issue) return <div>Loading...</div>;

    const handleUpvote = async () => {
        if (!db || !userId) return;
        try {
            if (issue.upvotes && issue.upvotes.includes(userId)) {
                toast('You already upvoted this issue.', { icon: 'ℹ️' });
                return;
            }
            await updateDoc(doc(db, 'issues', issue.id), {
                upvotes: arrayUnion(userId),
            });
            toast.success('Upvoted!');
        } catch (e) {
            console.error(e);
            toast.error('Failed to upvote');
        }
    };

    const categoryLabel = issueCategories.find(c => c.value === issue.category)?.label || issue.category;

    return (
        <div className="mx-auto max-w-4xl pb-10">
            <button onClick={handleBack} className="mb-4 flex items-center text-cyan-400 hover:text-cyan-300 transition-colors">
                ← Back to Dashboard
            </button>

            <div className="overflow-hidden rounded-xl border border-cyan-500/30 bg-gray-900/80 backdrop-blur-md shadow-2xl">
                <div className="border-b border-gray-800 p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <span className={`mb-2 inline-block rounded px-3 py-1 text-sm font-bold ${getCategoryClass(issue.category)}`}>
                                {categoryLabel}
                            </span>
                            <h1 className="text-3xl font-bold text-white break-words">{issue.title}</h1>
                        </div>
                        <div className={`px-3 py-1 rounded border self-start ${issue.status === 'resolved'
                                ? 'border-green-500 text-green-400'
                                : 'border-yellow-500 text-yellow-400'
                            }`}>
                            {issue.status?.toUpperCase()}
                        </div>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-cyan-400">Description</h3>
                            <p className="mt-2 text-gray-300 leading-relaxed whitespace-pre-wrap">{issue.description}</p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-cyan-400">Location</h3>
                            <p className="mt-1 text-gray-300">{address}</p>
                            <p className="text-xs text-gray-500 font-mono mt-1">Lat: {issue.lat}, Lng: {issue.lng}</p>
                        </div>

                        <div className="text-xs text-gray-500">
                            Reported on: {issue.createdAt?.toDate ? issue.createdAt.toDate().toLocaleString() : 'Unknown date'}
                        </div>
                    </div>

                    <div className="rounded-lg bg-gray-800/50 p-6 space-y-4 h-fit text-center border border-gray-700">
                        <div className="text-5xl font-bold text-white">{issue.upvotes?.length || 0}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-widest">Community Priority</div>
                        <button
                            onClick={handleUpvote}
                            className="w-full rounded bg-cyan-600 py-3 font-bold text-white hover:bg-cyan-500 transition-all active:scale-95"
                        >
                            ▲ Upvote Issue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
