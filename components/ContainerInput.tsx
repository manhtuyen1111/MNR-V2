import React, { useRef, useEffect } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';

interface ContainerInputProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  isActive: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  onFocus: () => void;
}

const ContainerInput: React.FC<ContainerInputProps> = ({ 
  value, onChange, isValid, isActive, isCompleted, isDisabled, onFocus 
}) => {
  const prefixRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);

  const prefix = value.slice(0, 4);
  const numberPart = value.slice(4);

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    onChange(val + numberPart);
    if (val.length === 4 && numberRef.current) {
        numberRef.current.focus();
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 7);
    onChange(prefix + val);
  };

  const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
      if (prefixRef.current) prefixRef.current.focus();
  };

  // Focus effect logic
  useEffect(() => {
      if (isActive && value === '' && prefixRef.current && !isDisabled) {
          prefixRef.current.focus();
      }
  }, [isActive, value, isDisabled]);

  return (
    <div 
      onClick={!isDisabled ? onFocus : undefined}
      className={`
        transition-all duration-500 ease-out rounded-xl p-4 border-2 relative bg-white
        ${isActive 
          ? 'scale-105 shadow-2xl z-20 border-sky-600 ring-4 ring-sky-100 translate-y-[-5px]' 
          : isDisabled
            ? 'opacity-40 grayscale scale-95 border-slate-200 pointer-events-none'
            : 'border-green-500 shadow-sm opacity-90 scale-100' // Completed state
        }
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <label className={`text-sm font-black uppercase tracking-wider flex items-center ${isActive ? 'text-sky-700' : isCompleted ? 'text-green-700' : 'text-slate-500'}`}>
            <span className={`w-6 h-6 rounded flex items-center justify-center mr-2 text-xs font-bold transition-colors ${isActive ? 'bg-sky-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-slate-300 text-slate-500'}`}>1</span>
            SỐ CONTAINER
        </label>
        
        {value.length > 0 && isActive && (
             <button 
                onClick={handleClear} 
                className="p-1.5 bg-slate-100 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600"
            >
                <X className="w-4 h-4" />
            </button>
        )}
        {isCompleted && !isActive && <Check className="w-6 h-6 text-green-500" />}
      </div>

      <div className="flex items-start space-x-2">
        {/* Prefix Input */}
        <div className="flex-1 relative">
            <input
                ref={prefixRef}
                type="text"
                value={prefix}
                onChange={handlePrefixChange}
                onFocus={onFocus}
                disabled={isDisabled}
                placeholder="ABCD"
                className={`
                    w-full text-center text-3xl font-black font-mono py-4 rounded-lg border-2 outline-none uppercase placeholder-slate-200 shadow-inner transition-colors
                    ${prefix.length === 4 
                        ? 'border-sky-500 bg-sky-50 text-sky-900' 
                        : 'border-slate-300 bg-white text-slate-800 focus:border-sky-500'}
                `}
            />
            <div className={`text-[10px] font-bold mt-1 text-center flex justify-center items-center ${prefix.length === 4 ? 'text-green-600' : 'text-slate-400'}`}>
                {prefix.length === 4 && <Check className="w-3 h-3 mr-1" />}
                <span>{prefix.length}/4 CHỮ</span>
            </div>
        </div>

        {/* Separator */}
        <div className="pt-6">
            <div className="w-2 h-1 bg-slate-300"></div>
        </div>

        {/* Number Input */}
        <div className="flex-[1.5] relative">
            <input
                ref={numberRef}
                type="tel"
                value={numberPart}
                onChange={handleNumberChange}
                onFocus={onFocus}
                disabled={isDisabled}
                placeholder="1234567"
                className={`
                    w-full text-center text-3xl font-black font-mono py-4 rounded-lg border-2 outline-none tracking-widest placeholder-slate-200 shadow-inner transition-colors
                    ${numberPart.length === 7 
                        ? 'border-sky-500 bg-sky-50 text-sky-900' 
                        : 'border-slate-300 bg-white text-slate-800 focus:border-sky-500'}
                `}
            />
            <div className={`text-[10px] font-bold mt-1 text-center flex justify-center items-center ${numberPart.length === 7 ? 'text-green-600' : 'text-slate-400'}`}>
                 {numberPart.length === 7 && <Check className="w-3 h-3 mr-1" />}
                <span>{numberPart.length}/7 SỐ</span>
            </div>
        </div>
      </div>
      
      {/* Validation Warning */}
      {value.length > 0 && !isValid && isActive && (
         <div className="mt-2 flex items-center justify-center text-xs font-bold text-orange-600 bg-orange-50 py-2 rounded-lg border border-orange-100">
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            <span>Chưa đủ định dạng (4 chữ + 7 số)</span>
         </div>
      )}
    </div>
  );
};

export default ContainerInput;