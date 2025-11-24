import React, { useState } from 'react';

export const LoginOverlay = ({ onGoogleLogin, onEmailLogin, onEmailSignup }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await onEmailLogin(email, password);
            } else {
                await onEmailSignup(email, password, name);
            }
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center backdrop-blur-sm bg-black/60">
            <div className="relative w-full max-w-md p-8 m-4 rounded-2xl border border-cyan-500/30 bg-gray-900/90 shadow-[0_0_50px_rgba(14,165,233,0.3)] text-center">
                <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl"></div>

                <h1 className="mb-2 text-4xl font-orbitron font-extrabold text-white" style={{ textShadow: '0 0 10px #0ea5e9' }}>
                    FixMyWorld
                </h1>
                <p className="mb-8 text-gray-400 font-share-tech">Citizen Reporting Platform</p>

                {error && <div className="mb-4 p-2 bg-red-500/20 border border-red-500/50 text-red-200 text-sm rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded bg-gray-800 border border-gray-700 text-white p-3 focus:border-cyan-500 focus:outline-none"
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded bg-gray-800 border border-gray-700 text-white p-3 focus:border-cyan-500 focus:outline-none"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded bg-gray-800 border border-gray-700 text-white p-3 focus:border-cyan-500 focus:outline-none"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded bg-cyan-600 py-3 font-bold text-white hover:bg-cyan-500 disabled:opacity-50 transition-all"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="bg-gray-900 px-2 text-gray-400">Or continue with</span></div>
                </div>

                <button
                    onClick={onGoogleLogin}
                    className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-lg bg-white px-6 py-3 font-bold text-gray-900 transition-all hover:bg-gray-100 hover:scale-[1.02]"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign in with Google
                </button>

                <p className="mt-6 text-sm text-gray-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => setIsLogin(!isLogin)} className="text-cyan-400 hover:underline">
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
};
