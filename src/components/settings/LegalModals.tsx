import { X, FileText, Scale, Users } from 'lucide-react';
import { createPortal } from 'react-dom';
import { TERMS_AND_CONDITIONS, EULA, CREDITS, PRIVACY_POLICY } from '../../lib/legalContent';
import { Shield } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon: any;
    content?: string;
    type?: 'text' | 'credits';
}

const BaseModal = ({ isOpen, onClose, title, icon: Icon, content, type = 'text' }: ModalProps) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-800 rounded-lg">
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {type === 'text' ? (
                        <div className="prose prose-invert prose-zinc max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-zinc-400 text-sm leading-relaxed">
                                {content}
                            </pre>
                        </div>
                    ) : (
                        <div className="space-y-8 text-center">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                    {CREDITS.company}
                                </h3>
                                <p className="text-zinc-500">Established {CREDITS.year}</p>
                            </div>

                            <div className="py-4">
                                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Created By</p>
                                <div className="flex flex-col items-center gap-1">
                                    <h4 className="text-lg font-medium text-white">{CREDITS.developer}</h4>
                                    <span className="text-zinc-500">&</span>
                                    <h4 className="text-lg font-medium text-white">{(CREDITS as any).collaborator}</h4>
                                </div>

                                <a href={`mailto:${CREDITS.email}`} className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors block pt-4">
                                    {CREDITS.email}
                                </a>
                            </div>

                            <div className="text-left space-y-4">
                                <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-2">
                                    Powered by Open Source
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {CREDITS.libraries.map((lib) => (
                                        <div key={lib} className="flex items-center gap-2 text-sm text-zinc-500">
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                            {lib}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <p className="text-xs text-zinc-600 mt-8">
                                © {CREDITS.year} {CREDITS.company}. All rights reserved.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white text-black hover:bg-zinc-200 font-medium rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export const TermsModal = (props: { isOpen: boolean; onClose: () => void }) => (
    <BaseModal {...props} title="Terms & Conditions" icon={FileText} content={TERMS_AND_CONDITIONS} />
);

export const EulaModal = (props: { isOpen: boolean; onClose: () => void }) => (
    <BaseModal {...props} title="End User License Agreement" icon={Scale} content={EULA} />
);

export const CreditsModal = (props: { isOpen: boolean; onClose: () => void }) => (
    <BaseModal {...props} title="Credits" icon={Users} type="credits" />
);

export const PrivacyModal = (props: { isOpen: boolean; onClose: () => void }) => (
    <BaseModal {...props} title="Privacy Policy" icon={Shield} content={PRIVACY_POLICY} />
);
