import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, register } = useAuthStore();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                await login(formData.email, formData.password, rememberMe);
                navigate('/dashboard');
            } else {
                await register(formData.name, formData.email, formData.password);
                navigate('/dashboard');
            }
        } catch (error) {
            setError(error.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="w-full max-w-7xl grid md:grid-cols-2 gap-12 items-center relative z-10">
                {/* Left Side - Branding */}
                <div className="hidden md:block space-y-8">
                    <div className="inline-flex items-center gap-4 bg-black text-white px-8 py-6 rounded-2xl shadow-2xl border-4 border-black transform hover:scale-105 transition-transform">
                        <div className="bg-white text-black p-4 rounded-xl">
                            <FileText className="w-12 h-12" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight">Question Paper</h1>
                            <h2 className="text-4xl font-black tracking-tight">Generator</h2>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <p className="text-2xl font-bold text-gray-800">
                            AI-Powered Assessment Creation Platform
                        </p>

                        <div className="space-y-4">
                            {[
                                { icon: Sparkles, title: 'Smart Generation', desc: 'AI creates unique, high-quality questions instantly' },
                                { icon: CheckCircle2, title: 'Multiple Formats', desc: 'Export as PDF, DOCX, or HTML with one click' },
                                { icon: FileText, title: 'Full Control', desc: 'Customize every aspect of your question paper' }
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-4 bg-white/90 backdrop-blur-sm p-6 rounded-xl border-2 border-gray-200 hover:border-black transition-all hover:shadow-lg">
                                    <div className="bg-black text-white p-3 rounded-lg">
                                        <feature.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-black">{feature.title}</h3>
                                        <p className="text-gray-600">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full max-w-md mx-auto">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-4 border-black p-10">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-3 mb-4 md:hidden">
                                <div className="bg-black text-white p-3 rounded-xl">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <h1 className="text-2xl font-black text-black">QPG</h1>
                            </div>
                            <h2 className="text-3xl font-black text-black mb-2">
                                {isLogin ? 'Welcome Back!' : 'Create Account'}
                            </h2>
                            <p className="text-gray-600 font-medium">
                                {isLogin ? 'Sign in to continue creating papers' : 'Join us and start generating'}
                            </p>
                        </div>

                        {error && (
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-white text-black border-2 border-gray-300 rounded-xl focus:border-black focus:ring-4 focus:ring-black/10 transition-all font-medium placeholder:text-gray-400"
                                placeholder="John Doe"
                                required={!isLogin}
                            />
                                    </div>
                </div>
                            )}

                <div>
                    <label className="block text-sm font-bold text-black mb-2">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-white text-black border-2 border-gray-300 rounded-xl focus:border-black focus:ring-4 focus:ring-black/10 transition-all font-medium placeholder:text-gray-400"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-black mb-2">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-white text-black border-2 border-gray-300 rounded-xl focus:border-black focus:ring-4 focus:ring-black/10 transition-all font-medium placeholder:text-gray-400"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                {isLogin && (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-2 border-gray-300 text-black focus:ring-2 focus:ring-black/20"
                        />
                        <label htmlFor="rememberMe" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Remember me for 30 days
                        </label>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </form>

            <div className="mt-8 text-center">
                <button
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError('');
                    }}
                    className="text-black font-bold hover:underline decoration-2 underline-offset-4"
                >
                    {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
            </div>


        </div>

                    {/* Trust Indicators */ }
    <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600 font-medium">
        <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Secure</span>
        </div>
        <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Fast</span>
        </div>
        <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Reliable</span>
        </div>
    </div>
                </div >
            </div >
        </div >
    );
};

export default LoginPage;
