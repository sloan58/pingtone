import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface ToastData {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
}

export function useToast() {
    const { props } = usePage<{ flash?: { toast?: ToastData } }>();

    useEffect(() => {
        if (props.flash?.toast) {
            const { type, title, message } = props.flash.toast;

            switch (type) {
                case 'success':
                    toast.success(title, {
                        description: message,
                    });
                    break;
                case 'error':
                    toast.error(title, {
                        description: message,
                    });
                    break;
                case 'warning':
                    toast.warning(title, {
                        description: message,
                    });
                    break;
                case 'info':
                    toast.info(title, {
                        description: message,
                    });
                    break;
                default:
                    toast(title, {
                        description: message,
                    });
            }
        }
    }, [props.flash?.toast]);
}
