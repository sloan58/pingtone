import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';

export default function Dashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl sm:px-6 lg:px-8 mx-auto">
                    <div className="bg-card shadow-sm sm:rounded-lg overflow-hidden">
                        <div className="p-6 text-foreground">
                            <h2 className="mb-4 text-2xl font-semibold">Welcome to PingTone</h2>
                            <p className="text-muted-foreground">Your unified communications management platform.</p>
                        </div>
                    </div>
                </div>

                {/* Test styles to verify TweakCN theme */}
                <div className="mt-8 p-4 bg-primary text-primary-foreground rounded-lg">
                    <p className="font-semibold">Primary Color Test</p>
                    <p>This should use the TweakCN primary color</p>
                </div>

                <div className="mt-4 p-4 bg-secondary text-secondary-foreground rounded-lg">
                    <p className="font-semibold">Secondary Color Test</p>
                    <p>This should use the TweakCN secondary color</p>
                </div>

                <div className="mt-4 p-4 bg-accent text-accent-foreground rounded-lg">
                    <p className="font-semibold">Accent Color Test</p>
                    <p>This should use the TweakCN accent color</p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
