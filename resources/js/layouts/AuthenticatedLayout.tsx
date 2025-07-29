import { Head, Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Authenticated({ children }: PropsWithChildren) {
    return (
        <div className="bg-background min-h-screen">
            <Head title="PingTone" />

            <nav className="border-gray-200 bg-card border-b">
                <div className="max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto">
                    <div className="h-16 flex items-center justify-between">
                        <div className="flex items-center">
                            <Link href="/" className="text-xl font-bold text-foreground">
                                PingTone
                            </Link>
                        </div>

                        <div className="space-x-4 flex items-center">
                            <Link href="/" className="text-foreground hover:text-primary transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/phones" className="text-foreground hover:text-primary transition-colors">
                                Phones
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="py-6">
                <div className="max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto">{children}</div>
            </main>
        </div>
    );
}
