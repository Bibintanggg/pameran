import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ActiveCardProvider } from './context/ActiveCardContext';
import { Toaster } from "@/Components/ui/toaster"
import { ClerkProvider } from '@clerk/clerk-react';

const appName = import.meta.env.VITE_APP_NAME || 'E-KURS';
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        const inertiaProps = props as any;
        const cards = inertiaProps.cards || [];

        root.render(
            <ClerkProvider
                publishableKey={clerkPubKey}
                appearance={{
                    elements: {
                        factorOneCard: { display: 'none' },
                        factorTwoCard: { display: 'none' }
                    }
                }}>
                <ActiveCardProvider cards={cards}>
                    <App {...props} />
                    <Toaster />
                </ActiveCardProvider>
            </ClerkProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
