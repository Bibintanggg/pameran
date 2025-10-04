import { SignIn, useUser } from '@clerk/clerk-react';
import { Head, router, usePage } from '@inertiajs/react';
import SyncLoader from 'react-spinners/SyncLoader';
import GuestLayout from '@/Layouts/GuestLayout';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Login() {
    const { isSignedIn, user } = useUser();
    const { auth } = usePage().props;
    const [isSyncing, setIsSyncing] = useState(false);
    const [hasSynced, setHasSynced] = useState(false);

    useEffect(() => {
        if (isSignedIn && user && !auth?.user && !isSyncing && !hasSynced) {
            setIsSyncing(true);

            axios.get("/sanctum/csrf-cookie").then(() => {
                axios.post('/auth/clerk/sync', {
                    clerk_user_id: user.id,
                }).then(() => {
                    setHasSynced(true);
                    window.location.href = '/home';
                }).catch(error => {
                    console.error('Sync error:', error.response?.data || error.message);
                    setIsSyncing(false);
                });
            }).catch(error => {
                console.error('CSRF error:', error);
                setIsSyncing(false);
            });
        }

        // Jika sudah login di Laravel, redirect langsung
        if (auth?.user) {
            window.location.href = '/home';
        }
    }, [isSignedIn, user?.id, auth?.user]);

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-32 w-80 h-80 bg-black-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-40 left-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative w-full max-w-md">
                    {isSyncing ? (
                        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center transform transition-all duration-300 hover:scale-105">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <SyncLoader size={15} color="#4f46e5" />
                                <p className="text-gray-600 font-medium text-lg">Logging you in...</p>
                                <p className="text-gray-400 text-sm">Please wait while we prepare your account</p>
                            </div>
                        </div>
                    ) : (
                        <div className="transform transition-all duration-300 hover:scale-[1.02]">
                            <SignIn
                                path="/login"
                                routing="path"
                                signUpUrl="/register"
                                fallbackRedirectUrl="/home"
                                // appearance={{
                                //     elements: {
                                //         rootBox: "w-full",
                                //         card: "shadow-2xl rounded-2xl border-0 bg-white/90 backdrop-blur-sm",
                                //         headerTitle: "text-2xl font-bold text-gray-800",
                                //         headerSubtitle: "text-gray-600",
                                //         socialButtonsBlock: "space-y-3",
                                //         socialButtons: "transition-all duration-200 hover:shadow-md",
                                //         formFieldInput: "rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-200",
                                //         formButtonPrimary: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg py-3 font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl",
                                //         footerActionLink: "text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200",
                                //         dividerLine: "bg-gray-300",
                                //         dividerText: "text-gray-500 bg-white px-4",
                                //         identityPreview: "rounded-lg border-gray-300",
                                //         identityPreviewText: "text-gray-700",
                                //         identityPreviewEditButton: "text-indigo-600 hover:text-indigo-800",
                                //     },
                                //     variables: {
                                //         colorPrimary: "#4f46e5",
                                //         colorText: "#374151",
                                //         colorTextSecondary: "#6b7280",
                                //         colorNeutral: "#f3f4f6",
                                //     }
                                // }}
                                unsafeMetadata={{ mfa: false }}
                            />
                        </div>
                    )}

                    <div className="text-center mt-6">
                        <p className="text-gray-500 text-sm">
                            Secure login powered by{" "}
                            <span className="font-semibold text-indigo-600">Clerk</span>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </GuestLayout>
    );
}
