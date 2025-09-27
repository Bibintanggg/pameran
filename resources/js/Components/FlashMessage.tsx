import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { CheckCircle2Icon, AlertCircleIcon } from 'lucide-react';

interface PageProps {
    flash: {
        success?: string;
        error?: string;
    };
}

export default function FlashMessage() {
    const { props } = usePage<PageProps>();
    const [show, setShow] = useState(false);
    
    const success = props.flash?.success;
    const error = props.flash?.error;
    
    useEffect(() => {
        if (success || error) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);
    
    if (!show || (!success && !error)) return null;
    
    return (
        <div className="fixed top-4 right-4 z-50">
            <Alert className={`${success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"} shadow-lg`}>
                {success ? (
                    <CheckCircle2Icon className="text-green-600 h-4 w-4" />
                ) : (
                    <AlertCircleIcon className="text-red-600 h-4 w-4" />
                )}
                <AlertTitle className={success ? "text-green-800" : "text-red-800"}>
                    {success ? "Success!" : "Error!"}
                </AlertTitle>
                <AlertDescription className={success ? "text-green-700" : "text-red-700"}>
                    {success || error}
                </AlertDescription>
            </Alert>
        </div>
    );
}