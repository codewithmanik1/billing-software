import React, { useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      setTimeout(() => confirmButtonRef.current?.focus(), 100);
    }
  }, [isOpen]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose} initialFocus={confirmButtonRef}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-[100dvh] items-end sm:items-center justify-center p-0 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-t-3xl sm:rounded-2xl bg-white dark:bg-dark-800 p-6 text-left align-middle shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] sm:shadow-2xl transition-all border-t sm:border border-gray-100 dark:border-dark-700">
                <div className="flex items-start gap-4 mb-6">
                  <div className={`p-3 rounded-xl shrink-0 ${isDestructive ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-[#B8860B]/10 text-[#B8860B]'}`}>
                    <AlertCircle size={24} />
                  </div>
                  <div className="pt-1">
                    <Dialog.Title as="h3" className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                      {title}
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                      {message}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 font-bold text-sm uppercase tracking-widest rounded-xl transition-colors outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 min-h-[44px]"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    ref={confirmButtonRef}
                    className={`w-full sm:w-auto px-6 py-3 sm:py-2.5 font-bold uppercase tracking-widest text-sm rounded-xl transition-all shadow-lg min-h-[44px] flex justify-center items-center outline-none focus:ring-4 ${
                      isDestructive 
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 focus:ring-red-500/40' 
                        : 'bg-[#B8860B] hover:bg-[#8B6508] text-white shadow-[#B8860B]/20 focus:ring-[#B8860B]/40'
                    }`}
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                  >
                    {confirmText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
