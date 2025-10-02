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

            <div className="flex justify-center items-center min-h-screen">
                {isSyncing ? (
                    <div className="text-center">
                        <SyncLoader size={10} />
                        <p>Logging you in...</p>
                    </div>
                ) : (
                    <SignIn
                        path="/login"
                        routing="path"
                        signUpUrl="/register"
                        afterSignInUrl="/home"
                        appearance={{
                            elements: {
                                card: "shadow-lg rounded-xl"
                            }
                        }}
                        unsafeMetadata={{ mfa: false }}
                    />
                )}
            </div>
        </GuestLayout>
    );
}
