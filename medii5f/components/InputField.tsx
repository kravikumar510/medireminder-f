import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
        <input
          className={`w-full px-4 py-2 ${icon ? 'pl-10' : ''} border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 ${
            error ? 'border-red-500' : 'border-slate-300'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default InputField;