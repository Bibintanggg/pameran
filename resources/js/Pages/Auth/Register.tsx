import { SignUp, useUser } from '@clerk/clerk-react';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Register() {
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

        if (auth?.user) {
            window.location.href = '/home';
        }
    }, [isSignedIn, user?.id, auth?.user]);

    return (
        <div className="flex justify-center items-center min-h-screen">
            {isSyncing ? (
                <div className="text-center">
                    <p>Setting up your account...</p>
                </div>
            ) : (
                <SignUp 
                    path="/register"
                    routing="path"
                    signInUrl="/login"
                    afterSignUpUrl={'/home'}
                />
            )}
        </div>
    );
}