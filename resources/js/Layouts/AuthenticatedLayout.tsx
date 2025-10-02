import { UserButton } from '@clerk/clerk-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

import { ReactNode } from 'react';

export default function Authenticated({ children }: { children: ReactNode }) {
    const handleLogout = async () => {
        await axios.post('/auth/clerk/logout');
    };

    return (
        <div>
            <nav>
                <UserButton afterSignOutUrl="/login" />
            </nav>
            {children}
        </div>
    );
}
