import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
    Phone, 
    Settings, 
    BookOpen, 
    Globe, 
    RotateCcw, 
    AlertTriangle,
    MessageSquare,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    MousePointer,
    Zap,
    Terminal
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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

    const executeCommand = async (action: string, parameters: any = {}) => {
        if (!canRemoteControl) {
            toast.error('Remote control is not available for this phone');
            return;
        }

        setIsLoading(true);
        
        try {
            const response = await axios.post(`/phones/${phoneId}/remote-control`, {
                action,
                parameters
            });

            if (response.data.success) {
                toast.success(response.data.toast?.message || 'Command executed successfully');
            } else {
                toast.error(response.data.toast?.message || 'Command failed');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.toast?.message || 
                               error.response?.data?.message || 
                               'Failed to execute command';
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
            duration: 0
        });
    };

    const handleCustomCommand = () => {
        if (!customCommand.trim()) {
            toast.error('Please enter a command');
            return;
        }
        
        executeCommand('custom_command', {
            command: customCommand
        });
    };

    if (!canRemoteControl) {
        return (
            <div className="text-center py-8">
                <Phone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">Remote Control Not Available</h3>
                <p className="text-sm text-muted-foreground">
                    This phone does not support remote control or is not properly configured.
                </p>
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
                <Badge variant="outline" className="text-green-600 border-green-200">
                    <Zap className="w-3 h-3 mr-1" />
                    Ready
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Navigation Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MousePointer className="w-4 h-4" />
                            Navigation
                        </CardTitle>
                        <CardDescription>
                            Navigate through phone menus and screens
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-2 max-w-32 mx-auto">
                            <div></div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => executeCommand('nav_up')}
                                disabled={isLoading}
                            >
                                <ArrowUp className="w-4 h-4" />
                            </Button>
                            <div></div>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => executeCommand('nav_left')}
                                disabled={isLoading}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => executeCommand('nav_select')}
                                disabled={isLoading}
                            >
                                Select
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => executeCommand('nav_right')}
                                disabled={isLoading}
                            >
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                            
                            <div></div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => executeCommand('nav_down')}
                                disabled={isLoading}
                            >
                                <ArrowDown className="w-4 h-4" />
                            </Button>
                            <div></div>
                        </div>
                    </CardContent>
                </Card>

                {/* Common Buttons */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Common Buttons
                        </CardTitle>
                        <CardDescription>
                            Press common phone buttons
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => executeCommand('settings')}
                                disabled={isLoading}
                                className="justify-start"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => executeCommand('directories')}
                                disabled={isLoading}
                                className="justify-start"
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Directories
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => executeCommand('services')}
                                disabled={isLoading}
                                className="justify-start col-span-2"
                            >
                                <Globe className="w-4 h-4 mr-2" />
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

                {/* Line Buttons */}
                <Card>
                    <CardHeader>
                        <CardTitle>Line Buttons</CardTitle>
                        <CardDescription>
                            Press line buttons on the phone
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                                <Button
                                    key={num}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => executeCommand('press_line', { line_number: num })}
                                    disabled={isLoading}
                                >
                                    Line {num}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Display Message */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Display Message
                        </CardTitle>
                        <CardDescription>
                            Send a text message to the phone screen
                        </CardDescription>
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
                            <Button
                                onClick={handleDisplayMessage}
                                disabled={isLoading}
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Send Message
                            </Button>
                            <Button
                                onClick={() => executeCommand('display_alert', { 
                                    message: messageText || messageTitle || 'Test Alert' 
                                })}
                                disabled={isLoading}
                                variant="outline"
                            >
                                Send Alert
                            </Button>
                        </div>
                        <Button
                            onClick={() => executeCommand('display_menu', { 
                                title: messageTitle || 'Test Menu' 
                            })}
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
                            <AlertTriangle className="w-4 h-4" />
                            System Actions
                        </CardTitle>
                        <CardDescription>
                            Perform system-level operations (use with caution)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowRebootConfirm(true)}
                            disabled={isLoading}
                            className="w-full justify-start"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reboot Phone
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowFactoryResetConfirm(true)}
                            disabled={isLoading}
                            className="w-full justify-start text-red-600 hover:text-red-700"
                        >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Factory Reset
                        </Button>
                    </CardContent>
                </Card>

                {/* Custom Command */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Terminal className="w-4 h-4" />
                            Custom Command
                        </CardTitle>
                        <CardDescription>
                            Execute a custom CGI/Execute command (advanced users)
                        </CardDescription>
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
                        <Button
                            onClick={handleCustomCommand}
                            disabled={isLoading}
                            variant="outline"
                            className="w-full"
                        >
                            <Terminal className="w-4 h-4 mr-2" />
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
