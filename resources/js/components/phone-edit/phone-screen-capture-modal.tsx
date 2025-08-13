import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface PhoneScreenCaptureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    capture: {
        id: number;
        filename: string;
        captured_at: string;
        image_url: string;
        formatted_file_size: string;
    } | null;
}

export function PhoneScreenCaptureModal({ open, onOpenChange, capture }: PhoneScreenCaptureModalProps) {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    if (!capture) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = capture.image_url;
        link.download = capture.filename;
        link.click();
    };

    const handleImageError = () => {
        setImageError(true);
        setImageLoading(false);
    };

    const handleImageLoad = () => {
        setImageLoading(false);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setImageError(false);
            setImageLoading(true);
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
                <DialogHeader className="flex-shrink-0 pr-12">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-semibold">{capture.filename}</DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleDownload}>
                                <Download className="h-4 w-4" />
                                Download
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Captured on {formatDate(capture.captured_at)}</span>
                        <span>•</span>
                        <span>{capture.formatted_file_size}</span>
                    </div>
                </DialogHeader>
                <div className="flex-1 overflow-auto">
                    <div className="flex min-h-[400px] items-center justify-center rounded-lg bg-muted/20">
                        {imageError ? (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                                <div>
                                    <h4 className="text-lg font-medium">Failed to load image</h4>
                                    <p className="text-sm text-muted-foreground">
                                        The screen capture image could not be loaded. It may have been deleted or moved.
                                    </p>
                                </div>
                                <Button variant="outline" onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Image
                                </Button>
                            </div>
                        ) : (
                            <div className="relative">
                                {imageLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted/20">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">Loading image...</span>
                                        </div>
                                    </div>
                                )}
                                <img
                                    src={capture.image_url}
                                    alt={`Screen capture from ${formatDate(capture.captured_at)}`}
                                    className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
                                    style={{ maxHeight: 'calc(90vh - 120px)' }}
                                    onError={handleImageError}
                                    onLoad={handleImageLoad}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
