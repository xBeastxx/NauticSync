import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, FastForward } from 'lucide-react';

interface TourStep {
    targetId: string;
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    action?: () => void; // Optional action to trigger at start of step
    waitFor?: string; // Optional ID to wait for before showing
}

const TOUR_STEPS: TourStep[] = [
    {
        targetId: 'dashboard-header-nodes',
        title: 'Unified Connectivity',
        description: 'Manage all your links here. Scan local devices automatically, or check online status.',
        position: 'bottom'
    },
    {
        targetId: 'dashboard-pair-btn',
        title: 'Add New Devices',
        description: 'Click here to connect with other devices. Let\'s see how it works...',
        position: 'left',
        // Action removed: We don't open it yet, we just show the button.
    },
    {
        targetId: 'add-device-modal-content',
        title: 'Pairing Options',
        description: 'Scan the QR code to instantly link a mobile device, or use the Device ID to connect with a remote colleague. Copy your ID to share it securely.',
        position: 'left',
        waitFor: 'add-device-modal-content',
        action: () => {
            // Open the modal NOW, when we are explaining it.
            const btn = document.getElementById('dashboard-pair-btn');
            if (btn) btn.click();
        }
    },
    {
        targetId: 'folder-list-add-btn',
        title: 'Sync Your Folders',
        description: 'Start by clicking here to add a folder you want to keep in sync across your devices.',
        position: 'bottom',
        action: () => {
            // Close modal by dispatching Escape (now supported by Modal)
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

            // Fallback: click close button if found
            setTimeout(() => {
                const closeBtn = document.getElementById('add-device-modal-close-btn');
                if (closeBtn) closeBtn.click();
            }, 50);
        }
    },
    {
        targetId: 'sidebar-nav-backup',
        title: 'Smart Backup',
        description: 'Protect your files with versioned backups. Restore previous versions of any file instantly.',
        position: 'right'
    },
    {
        targetId: 'sidebar-nav-media',
        title: 'Media Hub',
        description: 'Access your synced photos and videos in a beautiful, dedicated gallery view.',
        position: 'right'
    },
    {
        targetId: 'sidebar-search-btn',
        title: 'Global Search',
        description: 'Press Ctrl+K or click here to instantly find any file across all your synchronized folders.',
        position: 'right'
    },
    {
        targetId: 'sidebar-nav-conflicts',
        title: 'Conflict Resolution',
        description: 'Manage conflicting file versions when changes happen on multiple devices exactly at the same time.',
        position: 'right'
    },
    {
        targetId: 'activity-timeline',
        title: 'Live Activity',
        description: 'Monitor real-time sync progress, uploads, and downloads in this timeline.',
        position: 'left'
    }
];

interface ContextualGuideProps {
    onComplete: () => void;
}

export const ContextualGuide = ({ onComplete }: ContextualGuideProps) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isWaiting, setIsWaiting] = useState(false);

    const currentStep = TOUR_STEPS[currentStepIndex];

    useEffect(() => {
        let rafId: number;
        let stopTracking = false;

        setIsWaiting(true);
        setTargetRect(null);

        // Execute action if present
        if (currentStep.action) {
            currentStep.action();
        }

        const trackTarget = () => {
            if (stopTracking) return;

            const el = document.getElementById(currentStep.targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                // Only update if visible and dimensioned
                if (rect.width > 0 && rect.height > 0) {
                    setTargetRect(rect);
                    setIsWaiting(false);
                }
            } else {
                // If element is lost, maybe keep last rect or waiting?
            }
            rafId = requestAnimationFrame(trackTarget);
        };

        // Initial find and scroll
        const initialFind = () => {
            const el = document.getElementById(currentStep.targetId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Start tracking immediately
                trackTarget();
                return true;
            }
            return false;
        };

        // Try to find initially
        if (!initialFind()) {
            const interval = setInterval(() => {
                if (initialFind()) {
                    clearInterval(interval);
                }
            }, 100);

            // Cleanup interval if component unmounts before find
            return () => {
                clearInterval(interval);
                stopTracking = true;
                cancelAnimationFrame(rafId);
            };
        }

        return () => {
            stopTracking = true;
            cancelAnimationFrame(rafId);
        };
    }, [currentStepIndex]);

    const handleNext = () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    // Calculate Popover Position with Containment
    let popoverStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 60,
        opacity: (!isWaiting && targetRect) ? 1 : 0,
        pointerEvents: (!isWaiting && targetRect) ? 'auto' : 'none',
        transition: 'opacity 0.2s ease-in-out'
    };

    if (targetRect) {
        const gap = 16;
        const popoverWidth = 320; // w-80 is 20rem = 320px

        switch (currentStep.position) {
            case 'bottom':
                popoverStyle.top = targetRect.bottom + gap;
                popoverStyle.left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
                break;
            case 'top':
                popoverStyle.bottom = (window.innerHeight - targetRect.top) + gap;
                popoverStyle.left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
                break;
            case 'right':
                popoverStyle.top = targetRect.top;
                popoverStyle.left = targetRect.right + gap;
                break;
            case 'left':
                popoverStyle.top = targetRect.top;
                // Position to the left of target
                popoverStyle.left = targetRect.left - popoverWidth - gap;
                break;
        }

        // Boundary Protection (Clamp to viewport)
        if (typeof popoverStyle.left === 'number') {
            const padding = 20;
            // Prevent going off left edge
            if (popoverStyle.left < padding) {
                popoverStyle.left = padding;
            }
            // Prevent going off right edge
            if (popoverStyle.left + popoverWidth > window.innerWidth - padding) {
                popoverStyle.left = window.innerWidth - popoverWidth - padding;
            }
        }
    } else {
        popoverStyle = {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 60
        };
    }

    return createPortal(
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-50 bg-black/40 transition-colors duration-500 pointer-events-none" />

            {/* Highlight box */}
            {targetRect && (
                <div
                    className="fixed border-2 border-yellow-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] transition-all duration-500 ease-in-out pointer-events-none z-50 mix-blend-hard-light"
                    style={{
                        top: targetRect.top - 6,
                        left: targetRect.left - 6,
                        width: targetRect.width + 12,
                        height: targetRect.height + 12,
                    }}
                />
            )}

            {/* Popover Card */}
            <div
                className="w-80 bg-zinc-900 border border-zinc-700 p-6 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                style={popoverStyle}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">
                        Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                    </span>
                    <button onClick={onComplete} className="text-zinc-500 hover:text-white" title="Exit Tour">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{currentStep.title}</h3>
                <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                    {currentStep.description}
                </p>

                <div className="flex items-center justify-between">
                    <button
                        onClick={handlePrev}
                        disabled={currentStepIndex === 0}
                        className="text-sm text-zinc-500 hover:text-white disabled:opacity-0 transition-opacity"
                    >
                        Back
                    </button>

                    <div className="flex items-center gap-2">
                        {currentStepIndex < TOUR_STEPS.length - 1 && (
                            <button
                                onClick={onComplete}
                                className="text-xs text-zinc-500 hover:text-white mr-2 flex items-center gap-1"
                            >
                                <FastForward className="w-3 h-3" />
                                Skip
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold rounded-lg transition-colors"
                        >
                            {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                            {currentStepIndex < TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};
