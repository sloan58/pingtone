import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

import axios from 'axios';
import { toast } from 'sonner';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Configure axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Global axios interceptors for automatic toast handling
axios.interceptors.response.use(
    (response) => {
        // Handle success toasts
        if (response.data?.toast) {
            const { type, message } = response.data.toast;
            if (type === 'success') {
                toast.success(message);
            } else if (type === 'info') {
                toast.info(message);
            } else if (type === 'warning') {
                toast.warning(message);
            }
        }
        return response;
    },
    (error) => {
        // Handle error toasts
        if (error.response?.data?.toast) {
            const { message } = error.response.data.toast;
            toast.error(message);
        } else if (error.response?.status >= 500) {
            toast.error('Server error occurred');
        } else if (error.response?.status === 404) {
            toast.error('Resource not found');
        } else if (error.response?.status === 403) {
            toast.error('Access denied');
        } else if (error.response?.status === 401) {
            toast.error('Authentication required');
        } else if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
            toast.error('Network connection error');
        } else if (error.code === 'ECONNABORTED') {
            toast.error('Request timeout');
        }
        return Promise.reject(error);
    },
);

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
