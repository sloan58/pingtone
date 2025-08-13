import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import axios from 'axios';
import { Camera, Download, Eye, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PhoneScreenCaptureModal } from './phone-screen-capture-modal';

interface ScreenCapture {
    id: number;
    filename: string;
    captured_at: string;
    image_url: string;
    formatted_file_size: string;
    captured_by?: string;
}

interface PhoneScreenCapturesProps {
    phoneId: string;
    phoneName: string;
    canScreenCapture: boolean;
    screenCaptures: ScreenCapture[];
}

export function PhoneScreenCaptures({ phoneId, phoneName, canScreenCapture, screenCaptures: initialScreenCaptures }: PhoneScreenCapturesProps) {
    const [isCapturing, setIsCapturing] = useState(false);
    const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
    const [screenCaptures, setScreenCaptures] = useState(initialScreenCaptures);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; captureId: number | null; captureName: string }>({
        open: false,
        captureId: null,
        captureName: '',
    });
    const [viewModal, setViewModal] = useState<{ open: boolean; capture: ScreenCapture | null }>({
        open: false,
        capture: null,
    });

    const handleCaptureScreenshot = async () => {
        if (!canScreenCapture) {
            toast.error('This phone does not support screen capture.');
            return;
        }

        setIsCapturing(true);
        try {
            const response = await axios.post(`/phones/${phoneId}/capture-screenshot`);
            const data = response.data;

            if (data.success) {
                toast.success('Screenshot captured successfully!');
                // Add the new capture to local state
                if (data.screenCapture) {
                    const newCapture = {
                        id: data.screenCapture.id,
                        filename: data.screenCapture.filename,
                        captured_at: data.screenCapture.captured_at,
                        image_url: data.screenCapture.image_url,
                        formatted_file_size: data.screenCapture.formatted_file_size,
                        captured_by: data.screenCapture.captured_by,
                    };
                    setScreenCaptures((prev) => [newCapture, ...prev]);
                }
            } else {
                toast.error(data.message || 'Failed to capture screenshot');
            }
        } catch (error) {
            console.error('Error capturing screenshot:', error);
            toast.error('Failed to capture screenshot. Please check your network connection and try again.');
        } finally {
            setIsCapturing(false);
        }
    };

    const handleDeleteCapture = (captureId: number, captureName: string) => {
        setDeleteDialog({
            open: true,
            captureId,
            captureName,
        });
    };

    const confirmDeleteCapture = async () => {
        const captureId = deleteDialog.captureId;
        if (!captureId) return;

        setDeletingIds((prev) => new Set(prev).add(captureId));
        try {
            const response = await axios.delete(`/phone-screen-captures/${captureId}`);
            const data = response.data;

            if (data.success) {
                toast.success('Screen capture deleted successfully!');
                // Remove the deleted capture from local state
                setScreenCaptures((prev) => prev.filter((capture) => capture.id !== captureId));
            } else {
                toast.error(data.message || 'Failed to delete screen capture');
            }
        } catch (error) {
            console.error('Error deleting screen capture:', error);
            toast.error('Failed to delete screen capture. Please try again.');
        } finally {
            setDeletingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(captureId);
                return newSet;
            });
        }
    };

    const handleViewCapture = (capture: ScreenCapture) => {
        setViewModal({
            open: true,
            capture,
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Screen Captures</h3>
                    <p className="text-sm text-muted-foreground">Capture and manage screenshots from {phoneName}</p>
                </div>
                <Button onClick={handleCaptureScreenshot} disabled={!canScreenCapture || isCapturing} className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    {isCapturing ? 'Capturing...' : 'Capture Now'}
                </Button>
            </div>

            {!canScreenCapture && (
                <Card className="border-orange-200/20 bg-orange-950/20 py-2">
                    <CardContent className="py-1.5">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                                <div className="h-2 w-2 rounded-full bg-orange-400"></div>
                            </div>
                            <div>
                                <p className="mb-1 text-sm font-medium text-orange-200">Screen capture not available</p>
                                <p className="text-sm text-muted-foreground">
                                    This phone does not support screen capture or is not properly configured. Screen capture requires a registered
                                    Cisco 6xxx, 7xxx, 8xxx, or 9xxx series phone.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {screenCaptures.length === 0 ? (
                <Card className="border-dashed border-muted-foreground/20">
                    <CardContent className="pt-4">
                        <div className="py-8 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
                                <Camera className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h4 className="mb-2 text-lg font-medium text-foreground">No screen captures yet</h4>
                            <p className="mx-auto mb-6 max-w-sm text-muted-foreground">Capture your first screenshot to see it here.</p>
                            {canScreenCapture && (
                                <Button onClick={handleCaptureScreenshot} disabled={isCapturing}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    {isCapturing ? 'Capturing...' : 'Capture Now'}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {screenCaptures.map((capture) => (
                        <Card key={capture.id} className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex items-center gap-4 p-4">
                                    <img
                                        src={capture.image_url}
                                        alt={`Screen capture from ${formatDate(capture.captured_at)}`}
                                        className="h-16 w-16 rounded border object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                            <h4 className="truncate font-medium">{capture.filename}</h4>
                                            <Badge variant="secondary" className="text-xs">
                                                {capture.formatted_file_size}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Captured on {formatDate(capture.captured_at)}
                                            {capture.captured_by && ` by ${capture.captured_by}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleViewCapture(capture)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = capture.image_url;
                                                link.download = capture.filename;
                                                link.click();
                                            }}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteCapture(capture.id, capture.filename)}
                                            disabled={deletingIds.has(capture.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
                title="Delete Screen Capture"
                description={`Are you sure you want to delete "${deleteDialog.captureName}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                onConfirm={confirmDeleteCapture}
            />

            <PhoneScreenCaptureModal
                open={viewModal.open}
                onOpenChange={(open) => setViewModal((prev) => ({ ...prev, open }))}
                capture={viewModal.capture}
            />
        </div>
    );
}
