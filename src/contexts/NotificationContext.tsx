import React, { createContext, useContext, useState, ReactNode } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// The onConfirm function can now receive the input text (reason)
interface NotificationContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showConfirm: (
    message: string, 
    onConfirmAction: (inputText?: string) => void,
    // Add an optional config for showing an input field
    promptConfig?: { label: string; placeholder?: string; isRequired?: boolean }
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'success' | 'error' | 'confirm'>('success');
  const [message, setMessage] = useState('');
  
  // State for the confirmation logic
  const [onConfirm, setOnConfirm] = useState<(inputText?: string) => void>(() => () => {});
  
  // NEW: State to manage the input prompt within the modal
  const [promptConfig, setPromptConfig] = useState<{ label: string; placeholder?: string; isRequired?: boolean } | null>(null);
  const [inputValue, setInputValue] = useState('');

  const showSuccess = (msg: string) => {
    setType('success');
    setMessage(msg);
    setPromptConfig(null); // Ensure no prompt is shown
    setIsOpen(true);
  };

  const showError = (msg: string) => {
    setType('error');
    setMessage(msg);
    setPromptConfig(null); // Ensure no prompt is shown
    setIsOpen(true);
  };

  const showConfirm = (
    msg: string, 
    confirmAction: (inputText?: string) => void,
    config?: { label: string; placeholder?: string; isRequired?: boolean }
  ) => {
    setType('confirm');
    setMessage(msg);
    setOnConfirm(() => confirmAction);
    setPromptConfig(config || null); // Set the prompt config if it exists
    setInputValue(''); // Reset input value each time
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setPromptConfig(null); // Clear config on close
  };

  const handleConfirm = () => {
    onConfirm(inputValue); // Pass the input value to the confirm function
    handleClose();
  };

  const getModalInfo = () => {
    switch (type) {
      case 'success':
        return { title: 'Success', icon: <CheckCircle className="h-6 w-6 text-green-500" /> };
      case 'error':
        return { title: 'Error', icon: <XCircle className="h-6 w-6 text-red-500" /> };
      case 'confirm':
        return { title: 'Confirm Action', icon: <AlertTriangle className="h-6 w-6 text-yellow-500" /> };
      default:
        return { title: '', icon: null };
    }
  };

  const { title, icon } = getModalInfo();
  
  // Check if the confirm button should be disabled
  const isConfirmDisabled = promptConfig?.isRequired && inputValue.trim() === '';

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showConfirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4 animate-fade-in-up">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">{icon}</div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-gray-600 mt-1">{message}</p>

                {/* NEW: Conditionally render the input field */}
                {promptConfig && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {promptConfig.label}
                    </label>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={promptConfig.placeholder || ''}
                      className="w-full border rounded-lg p-2 text-sm"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              {type === 'confirm' ? (
                <>
                  <button onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300">Cancel</button>
                  <button 
                    onClick={handleConfirm} 
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isConfirmDisabled}
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button onClick={handleClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">OK</button>
              )}
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};