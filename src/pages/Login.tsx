import { useActionState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAppDispatch } from "../app/hooks";
import { setCredentials } from "../features/auth/authSlice";
import api from "../services/axios";

const Login = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/";
    const [error, submitAction, isPending] = useActionState(
        async (_prev: string | null, formData: FormData) => {
            try {
                const res = await api.post("/auth/login", {
                    email: formData.get("email"),
                    password: formData.get("password"),
                });

                const { user, accessToken } = res.data.data;

                if (user.role !== "BUYER") {
                    return "This account is not a customer account";
                }

                dispatch(setCredentials({ token: accessToken, user }));
                navigate(from, { replace: true });
                return null;
            } catch (err: any) {
                return err.response?.data?.message || "Invalid email or password";
            }
        },
        null
    );

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-xl font-medium text-gray-900">Welcome back</h1>
                    <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                                <circle cx="8" cy="8" r="7" stroke="#A32D2D" strokeWidth="1.2" />
                                <path d="M8 5v4M8 11v.5" stroke="#A32D2D" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span className="text-sm text-red-700">{error}</span>
                        </div>
                    )}

                    <form action={submitAction} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">
                                Email address
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                required
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                required
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {isPending ? "Signing in..." : "Sign in"}
                        </button>
                    </form>
                    {/* divider */}
                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400">or</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* google button */}

                    <a  href={`${import.meta.env.VITE_API_URL}/auth/google`}
                        className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </a>

                    <p className="text-center text-sm text-gray-500 mt-4">
                        Don't have an account?{" "}
                        <Link to="/register" state={{ from }} className="text-blue-600 hover:underline font-medium">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;