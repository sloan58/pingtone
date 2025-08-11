import { Phone, PhoneCall, Plus, Settings, Users, Zap } from 'lucide-react';
import { useState } from 'react';

interface PhoneButton {
    index: number;
    type: string;
    label: string;
    target: string;
    feature?: string;
}

interface PhoneButtonLayoutProps {
    buttons: PhoneButton[];
    onButtonClick?: (button: PhoneButton) => void;
    onAddButton?: () => void;
    onReorderButtons?: (buttons: PhoneButton[]) => void;
}

const getButtonIcon = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'line':
            return <PhoneCall className="h-4 w-4" />;
        case 'speed_dial':
        case 'speeddial':
            return <Zap className="h-4 w-4" />;
        case 'blf':
            return <Users className="h-4 w-4" />;
        case 'service':
            return <Settings className="h-4 w-4" />;
        default:
            return <Phone className="h-4 w-4" />;
    }
};

const getButtonColor = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'line':
            return 'bg-blue-500/10 text-blue-600 border-blue-200';
        case 'speed_dial':
        case 'speeddial':
            return 'bg-green-500/10 text-green-600 border-green-200';
        case 'blf':
            return 'bg-purple-500/10 text-purple-600 border-purple-200';
        case 'service':
            return 'bg-orange-500/10 text-orange-600 border-orange-200';
        default:
            return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
};

const getButtonLabel = (button: PhoneButton) => {
    if (button.label) return button.label;

    switch (button.type?.toLowerCase()) {
        case 'line':
            return button.target || 'Add Line';
        case 'speed_dial':
        case 'speeddial':
            return button.target || 'Add Speed Dial';
        case 'blf':
            return button.target || 'Add BLF';
        case 'service':
            return button.target || 'Add Service';
        default:
            return 'Add Button';
    }
};

export function PhoneButtonLayout({ buttons = [], onButtonClick, onAddButton, onReorderButtons }: PhoneButtonLayoutProps) {
    const [draggedButton, setDraggedButton] = useState<PhoneButton | null>(null);
    const [dragOverButton, setDragOverButton] = useState<PhoneButton | null>(null);

    // Use the buttons prop, fallback to mock data if empty
    const displayButtons =
        buttons.length > 0
            ? buttons.sort((a, b) => (a.index || 0) - (b.index || 0))
            : [
                  {
                      index: 1,
                      type: 'line',
                      label: '1001',
                      target: '1001/hq-internal-dn',
                      feature: 'shared_line',
                  },
                  {
                      index: 2,
                      type: 'line',
                      label: '1002',
                      target: '1002/hq-internal-dn',
                      feature: 'shared_line',
                  },
                  {
                      index: 3,
                      type: 'speed_dial',
                      label: '445',
                      target: '445 (Test)',
                      feature: 'speed_dial',
                  },
                  {
                      index: 4,
                      type: 'speed_dial',
                      label: 'Marty',
                      target: '2028055054 (Marty)',
                      feature: 'speed_dial',
                  },
                  {
                      index: 5,
                      type: 'speed_dial',
                      label: 'Add Speed Dial',
                      target: '',
                      feature: 'speed_dial',
                  },
                  {
                      index: 6,
                      type: 'blf',
                      label: 'Add BLF',
                      target: '',
                      feature: 'blf',
                  },
                  {
                      index: 7,
                      type: 'service',
                      label: 'Add Service',
                      target: '',
                      feature: 'service',
                  },
                  {
                      index: 8,
                      type: 'line',
                      label: '1003',
                      target: '1003/hq-internal-dn',
                      feature: 'shared_line',
                  },
              ];

    console.log('PhoneButtonLayout - Original buttons:', buttons);
    console.log('PhoneButtonLayout - Sorted displayButtons:', displayButtons);

    const handleDragStart = (e: React.DragEvent, button: PhoneButton) => {
        setDraggedButton(button);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', button.index.toString());

        // Add visual feedback
        const target = e.target as HTMLElement;
        target.style.opacity = '0.5';
        target.style.transform = 'rotate(2deg)';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedButton(null);
        setDragOverButton(null);

        // Remove visual feedback
        const target = e.target as HTMLElement;
        target.style.opacity = '1';
        target.style.transform = 'rotate(0deg)';
    };

    const handleDragOver = (e: React.DragEvent, button: PhoneButton) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        // Only allow dropping on same type
        if (draggedButton && draggedButton.type.toLowerCase() === button.type.toLowerCase()) {
            setDragOverButton(button);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        setDragOverButton(null);
    };

    const handleDrop = (e: React.DragEvent, targetButton: PhoneButton) => {
        e.preventDefault();

        if (!draggedButton || draggedButton.type.toLowerCase() !== targetButton.type.toLowerCase()) {
            return;
        }

        // Create new array
        const newButtons = [...displayButtons];

        // Get all buttons of the same type, sorted by their current template position
        const buttonType = draggedButton.type.toLowerCase();
        const sameTypeButtons = newButtons.filter((button) => button.type.toLowerCase() === buttonType).sort((a, b) => a.index - b.index);

        // Find the positions of the dragged and target buttons in the same-type sequence
        const draggedPositionInSequence = sameTypeButtons.findIndex((button) => button.index === draggedButton.index);
        const targetPositionInSequence = sameTypeButtons.findIndex((button) => button.index === targetButton.index);

        if (draggedPositionInSequence === -1 || targetPositionInSequence === -1) {
            return;
        }

        // Get the template positions for this type (e.g., [1, 2, 8] for lines)
        const templatePositions = sameTypeButtons.map((button) => button.index).sort((a, b) => a - b);

        // Create a new sequence where the dragged button moves to the target position
        const newSequence = [...sameTypeButtons];
        const [movedButton] = newSequence.splice(draggedPositionInSequence, 1);
        newSequence.splice(targetPositionInSequence, 0, movedButton);

        // Reassign template positions to the new sequence
        // We need to work with the button objects directly, not find them by index
        const sameTypeButtonsInNewArray = newButtons.filter((button) => button.type.toLowerCase() === buttonType).sort((a, b) => a.index - b.index);

        newSequence.forEach((button, sequenceIndex) => {
            const buttonInNewArray = sameTypeButtonsInNewArray[sequenceIndex];
            if (buttonInNewArray) {
                // Create a completely new button object to avoid circular references
                const newButton = {
                    index: templatePositions[sequenceIndex],
                    label: button.label,
                    target: button.target,
                    feature: button.feature,
                    type: button.type,
                };

                // Replace the button in the array
                const buttonIndex = newButtons.findIndex((b) => b === buttonInNewArray);
                if (buttonIndex !== -1) {
                    newButtons[buttonIndex] = newButton;
                }
            }
        });

        // Call the callback to update parent state
        onReorderButtons?.(newButtons);

        setDraggedButton(null);
        setDragOverButton(null);
    };

    const canDropOn = (targetButton: PhoneButton) => {
        return draggedButton && draggedButton.type.toLowerCase() === targetButton.type.toLowerCase() && draggedButton.index !== targetButton.index;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Phone Button Configuration</h3>
                    <p className="text-sm text-muted-foreground">Configure lines, speed dials, and BLFs</p>
                </div>
                {onAddButton && (
                    <button
                        onClick={onAddButton}
                        className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        Add Button
                    </button>
                )}
            </div>

            {/* Button Grid */}
            <div className="grid grid-cols-1 gap-3">
                {displayButtons.map((button, idx) => (
                    <div
                        key={button.index || idx}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, button)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, button)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, button)}
                        onClick={() => onButtonClick?.(button)}
                        className={`group relative flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${getButtonColor(button.type)} ${onButtonClick ? 'hover:ring-2 hover:ring-primary/20' : ''} ${dragOverButton?.index === button.index && canDropOn(button) ? 'ring-opacity-50 bg-primary/5 ring-2 ring-primary' : ''} ${draggedButton?.index === button.index ? 'opacity-50' : ''} `}
                    >
                        {/* Button Number */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-sm font-semibold text-gray-700 shadow-sm">
                            {button.index || idx + 1}
                        </div>

                        {/* Icon */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/60">{getButtonIcon(button.type)}</div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="truncate font-medium text-foreground">{getButtonLabel(button)}</span>
                                {button.type?.toLowerCase() === 'line' && button.target && (
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                        Shared
                                    </span>
                                )}
                            </div>
                            {button.target && button.target !== getButtonLabel(button) && (
                                <p className="mt-1 truncate text-sm text-muted-foreground">{button.target}</p>
                            )}
                        </div>

                        {/* Action Icon */}
                        {onButtonClick && (
                            <div className="opacity-0 transition-opacity group-hover:opacity-100">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 hover:bg-white">
                                    <Settings className="h-4 w-4 text-gray-600" />
                                </div>
                            </div>
                        )}

                        {/* Drag Handle */}
                        <div className="opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg bg-white/80 hover:bg-white active:cursor-grabbing">
                                <div className="flex flex-col gap-0.5">
                                    <div className="h-0.5 w-3 rounded bg-gray-400"></div>
                                    <div className="h-0.5 w-3 rounded bg-gray-400"></div>
                                    <div className="h-0.5 w-3 rounded bg-gray-400"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                <h4 className="mb-3 text-sm font-medium text-foreground">Button Types</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        <span className="text-muted-foreground">Lines</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="text-muted-foreground">Speed Dials</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                        <span className="text-muted-foreground">BLFs</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                        <span className="text-muted-foreground">Services</span>
                    </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                    💡 Drag and drop buttons to reorder them. You can only move buttons within the same type.
                </p>
            </div>
        </div>
    );
}
