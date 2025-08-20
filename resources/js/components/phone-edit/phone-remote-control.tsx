import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import {
    AlertTriangle,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    BookOpen,
    Globe,
    MessageSquare,
    MousePointer,
    Phone,
    PhoneCall,
    RotateCcw,
    Settings,
    Terminal,
    Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PhoneRemoteControlProps {
    phoneId: string;
    phoneName: string;
    canRemoteControl?: boolean;
}

export function PhoneRemoteControl({ phoneId, phoneName, canRemoteControl = true }: PhoneRemoteControlProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showRebootConfirm, setShowRebootConfirm] = useState(false);
    const [showFactoryResetConfirm, setShowFactoryResetConfirm] = useState(false);
    const [messageTitle, setMessageTitle] = useState('');
    const [messageText, setMessageText] = useState('');
    const [customCommand, setCustomCommand] = useState('');
    const [dialNumber, setDialNumber] = useState('');

    // Live screen capture state
    const [currentScreenCapture, setCurrentScreenCapture] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [captureError, setCaptureError] = useState<string | null>(null);

    // Function to capture a temporary screenshot (doesn't save to database)
    const captureScreenshot = async (showToast: boolean = false) => {
        if (!canRemoteControl) return;

        setIsCapturing(true);
        setCaptureError(null);

        try {
            const response = await axios.post(`/phones/${phoneId}/capture-temporary-screenshot`);

            if (response.data.success && response.data.image_data_url) {
                setCurrentScreenCapture(response.data.image_data_url);
                if (showToast) {
                    toast.success('Screen captured successfully');
                }
            } else {
                throw new Error(response.data.message || 'Failed to capture screenshot');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to capture screenshot';
            setCaptureError(errorMessage);
            if (showToast) {
                toast.error(errorMessage);
            }
        } finally {
            setIsCapturing(false);
        }
    };

    // Load initial screen capture when component mounts
    useEffect(() => {
        if (canRemoteControl) {
            captureScreenshot(false);
        }
    }, [phoneId, canRemoteControl]);

    const executeCommand = async (action: string, parameters: any = {}) => {
        if (!canRemoteControl) {
            toast.error('Remote control is not available for this phone');
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`/phones/${phoneId}/remote-control`, {
                action,
                parameters,
            });

            if (response.data.success) {
                // Auto-capture screenshot after successful command (with small delay)
                setTimeout(() => {
                    captureScreenshot(false);
                }, 500);
            } else {
                toast.error(response.data.toast?.message || 'Command failed');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.toast?.message || error.response?.data?.message || 'Failed to execute command';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisplayMessage = () => {
        if (!messageTitle.trim() && !messageText.trim()) {
            toast.error('Please enter a title or message text');
            return;
        }

        executeCommand('display_message', {
            title: messageTitle || 'Message',
            text: messageText,
            duration: 0,
        });
    };

    const handleCustomCommand = () => {
        if (!customCommand.trim()) {
            toast.error('Please enter a command');
            return;
        }

        executeCommand('custom_command', {
            command: customCommand,
        });
    };

    const handleDialNumber = () => {
        if (!dialNumber.trim()) {
            toast.error('Please enter a phone number');
            return;
        }

        executeCommand('dial_number', {
            number: dialNumber,
        });
    };

    if (!canRemoteControl) {
        return (
            <div className="py-8 text-center">
                <Phone className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium text-muted-foreground">Remote Control Not Available</h3>
                <p className="text-sm text-muted-foreground">This phone does not support remote control or is not properly configured.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Remote Control</h3>
                    <p className="text-sm text-muted-foreground">Control {phoneName} remotely</p>
                </div>
                <Badge variant="outline" className="border-green-200 text-green-600">
                    <Zap className="mr-1 h-3 w-3" />
                    Ready
                </Badge>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Live Screen Capture */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Live Phone Screen
                            </div>
                            <Button variant="outline" size="sm" onClick={() => captureScreenshot(false)} disabled={isCapturing}>
                                {isCapturing ? 'Capturing...' : 'Refresh'}
                            </Button>
                        </CardTitle>
                        <CardDescription>Real-time view of {phoneName} - updates automatically after each command</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-center">
                            {captureError ? (
                                <div className="py-8 text-center">
                                    <Phone className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">Screen capture failed</p>
                                    <p className="text-xs text-red-500">{captureError}</p>
                                    <Button variant="outline" size="sm" onClick={() => captureScreenshot(false)} className="mt-2">
                                        Try Again
                                    </Button>
                                </div>
                            ) : currentScreenCapture ? (
                                <div className="relative">
                                    <img
                                        src={currentScreenCapture}
                                        alt={`${phoneName} screen capture`}
                                        className="h-auto max-w-full rounded-lg border shadow-lg"
                                        style={{ maxHeight: '400px' }}
                                    />
                                    {isCapturing && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                                            <div className="rounded bg-white/90 px-3 py-1 text-sm">Updating...</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <Phone className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        {isCapturing ? 'Capturing screen...' : 'No screen capture available'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Phone Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Controls
                        </CardTitle>
                        <CardDescription>Keypad, navigation, and line controls</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Keypad and Navigation Side by Side */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Keypad */}
                            <div>
                                <h4 className="mb-3 text-sm font-medium text-center">Keypad</h4>
                                <div className="grid grid-cols-3 gap-1">
                                    {/* Row 1: 1, 2, 3 */}
                                    {[1, 2, 3].map((num) => (
                                        <Button
                                            key={num}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => executeCommand('press_button', { button: `KeyPad${num}` })}
                                            disabled={isLoading}
                                            className="aspect-square text-xs font-semibold"
                                        >
                                            {num}
                                        </Button>
                                    ))}
                                    
                                    {/* Row 2: 4, 5, 6 */}
                                    {[4, 5, 6].map((num) => (
                                        <Button
                                            key={num}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => executeCommand('press_button', { button: `KeyPad${num}` })}
                                            disabled={isLoading}
                                            className="aspect-square text-xs font-semibold"
                                        >
                                            {num}
                                        </Button>
                                    ))}
                                    
                                    {/* Row 3: 7, 8, 9 */}
                                    {[7, 8, 9].map((num) => (
                                        <Button
                                            key={num}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => executeCommand('press_button', { button: `KeyPad${num}` })}
                                            disabled={isLoading}
                                            className="aspect-square text-xs font-semibold"
                                        >
                                            {num}
                                        </Button>
                                    ))}
                                    
                                    {/* Row 4: *, 0, # */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => executeCommand('press_button', { button: 'KeyPadStar' })}
                                        disabled={isLoading}
                                        className="aspect-square text-xs font-semibold"
                                    >
                                        *
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => executeCommand('press_button', { button: 'KeyPad0' })}
                                        disabled={isLoading}
                                        className="aspect-square text-xs font-semibold"
                                    >
                                        0
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => executeCommand('press_button', { button: 'KeyPadPound' })}
                                        disabled={isLoading}
                                        className="aspect-square text-xs font-semibold"
                                    >
                                        #
                                    </Button>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div>
                                <h4 className="mb-3 text-sm font-medium text-center">Navigation</h4>
                                <div className="flex flex-col items-center gap-1">
                                    {/* Top button */}
                                    <Button variant="outline" size="sm" onClick={() => executeCommand('nav_up')} disabled={isLoading} className="h-8 w-8 p-0">
                                        <ArrowUp className="h-3 w-3" />
                                    </Button>

                                    {/* Middle row with left, select, right */}
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="sm" onClick={() => executeCommand('nav_left')} disabled={isLoading} className="h-8 w-8 p-0">
                                            <ArrowLeft className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => executeCommand('nav_select')}
                                            disabled={isLoading}
                                            className="h-10 w-10 p-0 flex items-center justify-center rounded-full text-xs font-medium"
                                        >
                                            OK
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => executeCommand('nav_right')} disabled={isLoading} className="h-8 w-8 p-0">
                                            <ArrowRight className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    {/* Bottom button */}
                                    <Button variant="outline" size="sm" onClick={() => executeCommand('nav_down')} disabled={isLoading} className="h-8 w-8 p-0">
                                        <ArrowDown className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Line Buttons */}
                        <div>
                            <h4 className="mb-3 text-sm font-medium">Line Buttons</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {[1, 2, 3, 4].map((num) => (
                                    <Button
                                        key={num}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => executeCommand('press_button', { button: `Line${num}` })}
                                        disabled={isLoading}
                                        className="text-xs"
                                    >
                                        Line {num}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">


                {/* Common Buttons */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Common Buttons
                        </CardTitle>
                        <CardDescription>Press common phone buttons</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={() => executeCommand('settings')} disabled={isLoading} className="justify-start">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Button>
                            <Button variant="outline" onClick={() => executeCommand('directories')} disabled={isLoading} className="justify-start">
                                <BookOpen className="mr-2 h-4 w-4" />
                                Directories
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => executeCommand('services')}
                                disabled={isLoading}
                                className="col-span-2 justify-start"
                            >
                                <Globe className="mr-2 h-4 w-4" />
                                Services
                            </Button>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4].map((num) => (
                                <Button
                                    key={num}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => executeCommand('press_soft_key', { soft_key_number: num })}
                                    disabled={isLoading}
                                >
                                    Soft {num}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Dial Number */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PhoneCall className="h-4 w-4" />
                            Dial Number
                        </CardTitle>
                        <CardDescription>Enter a complete phone number to dial</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <Label htmlFor="dial-number">Phone Number</Label>
                            <Input
                                id="dial-number"
                                placeholder="e.g., 1234, *67, #123"
                                value={dialNumber}
                                onChange={(e) => setDialNumber(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleDialNumber();
                                    }
                                }}
                            />
                        </div>
                        <Button onClick={handleDialNumber} disabled={isLoading} className="w-full">
                            <PhoneCall className="mr-2 h-4 w-4" />
                            Dial
                        </Button>
                    </CardContent>
                </Card>



                {/* Display Message */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Display Message
                        </CardTitle>
                        <CardDescription>Send a text message to the phone screen</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <Label htmlFor="message-title">Title</Label>
                            <Input
                                id="message-title"
                                placeholder="Message title"
                                value={messageTitle}
                                onChange={(e) => setMessageTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="message-text">Message</Label>
                            <Textarea
                                id="message-text"
                                placeholder="Enter your message..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={handleDisplayMessage} disabled={isLoading}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Send Message
                            </Button>
                            <Button
                                onClick={() =>
                                    executeCommand('display_alert', {
                                        message: messageText || messageTitle || 'Test Alert',
                                    })
                                }
                                disabled={isLoading}
                                variant="outline"
                            >
                                Send Alert
                            </Button>
                        </div>
                        <Button
                            onClick={() =>
                                executeCommand('display_menu', {
                                    title: messageTitle || 'Test Menu',
                                })
                            }
                            disabled={isLoading}
                            variant="outline"
                            className="w-full"
                        >
                            Send Test Menu
                        </Button>
                    </CardContent>
                </Card>

                {/* System Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            System Actions
                        </CardTitle>
                        <CardDescription>Perform system-level operations (use with caution)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" onClick={() => setShowRebootConfirm(true)} disabled={isLoading} className="w-full justify-start">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reboot Phone
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowFactoryResetConfirm(true)}
                            disabled={isLoading}
                            className="w-full justify-start text-red-600 hover:text-red-700"
                        >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Factory Reset
                        </Button>
                    </CardContent>
                </Card>

                {/* Custom Command */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Terminal className="h-4 w-4" />
                            Custom Command
                        </CardTitle>
                        <CardDescription>Execute a custom CGI/Execute command</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <Label htmlFor="custom-command">XML Command</Label>
                            <Textarea
                                id="custom-command"
                                placeholder="<CiscoIPPhoneExecute>...</CiscoIPPhoneExecute>"
                                value={customCommand}
                                onChange={(e) => setCustomCommand(e.target.value)}
                                rows={3}
                                className="font-mono text-sm"
                            />
                        </div>
                        <Button onClick={handleCustomCommand} disabled={isLoading} variant="outline" className="w-full">
                            <Terminal className="mr-2 h-4 w-4" />
                            Execute Command
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                open={showRebootConfirm}
                onOpenChange={setShowRebootConfirm}
                onConfirm={() => {
                    executeCommand('reboot');
                    setShowRebootConfirm(false);
                }}
                title="Reboot Phone"
                description={`Are you sure you want to reboot ${phoneName}? The phone will be unavailable for a few minutes.`}
                confirmText="Reboot"
                variant="default"
            />

            <ConfirmDialog
                open={showFactoryResetConfirm}
                onOpenChange={setShowFactoryResetConfirm}
                onConfirm={() => {
                    executeCommand('factory_reset');
                    setShowFactoryResetConfirm(false);
                }}
                title="Factory Reset Phone"
                description={`Are you sure you want to factory reset ${phoneName}? This will erase all settings and configuration. This action cannot be undone.`}
                confirmText="Factory Reset"
                variant="destructive"
            />
        </div>
    );
}
