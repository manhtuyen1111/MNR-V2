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
        transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] rounded-2xl p-5 border relative bg-white
        ${isActive 
          ? 'border-sky-600 shadow-[0_10px_40px_-15px_rgba(2,132,199,0.3)] z-20 ring-4 ring-sky-50 transform scale-[1.03]' 
          : isDisabled
            ? 'opacity-60 grayscale border-slate-200 bg-slate-50'
            : 'border-green-500 shadow-sm opacity-100' // Completed state
        }
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <label className={`text-sm font-black uppercase tracking-wider flex items-center ${isActive ? 'text-sky-800' : isCompleted ? 'text-green-700' : 'text-slate-500'}`}>
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center mr-3 text-sm font-black shadow-sm transition-colors ${isActive ? 'bg-sky-600 text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
            SỐ CONTAINER
        </label>
        
        {value.length > 0 && isActive && (
             <button 
                onClick={handleClear} 
                className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        )}
        {isCompleted && !isActive && <Check className="w-8 h-8 text-green-600 stroke-[3]" />}
      </div>

      <div className="flex items-start space-x-3">
        {/* Prefix Input */}
        <div className="flex-1 relative group">
            <input
                ref={prefixRef}
                type="text"
                value={prefix}
                onChange={handlePrefixChange}
                onFocus={onFocus}
                disabled={isDisabled}
                placeholder="ABCD"
                className={`
                    w-full text-center text-3xl font-black font-mono py-4 rounded-xl border-2 outline-none uppercase placeholder-slate-300 shadow-inner transition-all
                    ${prefix.length === 4 
                        ? 'border-blue-600 bg-blue-50 text-blue-900' 
                        : 'border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100'}
                `}
            />
            <div className={`text-[10px] font-bold mt-2 text-center flex justify-center items-center uppercase tracking-wide ${prefix.length === 4 ? 'text-blue-700' : 'text-slate-400'}`}>
                {prefix.length === 4 && <Check className="w-3.5 h-3.5 mr-1" />}
                <span>Mã chủ (4)</span>
            </div>
        </div>

        {/* Separator */}
        <div className="pt-8 opacity-30">
            <div className="w-4 h-1 bg-slate-800 rounded-full"></div>
        </div>

        {/* Number Input */}
        <div className="flex-[1.6] relative">
            <input
                ref={numberRef}
                type="tel"
                value={numberPart}
                onChange={handleNumberChange}
                onFocus={onFocus}
                disabled={isDisabled}
                placeholder="1234567"
                className={`
                    w-full text-center text-3xl font-black font-mono py-4 rounded-xl border-2 outline-none tracking-wider placeholder-slate-300 shadow-inner transition-all
                    ${numberPart.length === 7 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                        : 'border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100'}
                `}
            />
            <div className={`text-[10px] font-bold mt-2 text-center flex justify-center items-center uppercase tracking-wide ${numberPart.length === 7 ? 'text-emerald-700' : 'text-slate-400'}`}>
                 {numberPart.length === 7 && <Check className="w-3.5 h-3.5 mr-1" />}
                <span>Số seri (7)</span>
            </div>
        </div>
      </div>
      
      {/* Validation Warning */}
      {value.length > 0 && !isValid && isActive && (
         <div className="mt-4 flex items-center justify-center text-xs font-bold text-orange-700 bg-orange-50 py-3 rounded-xl border border-orange-200 animate-fadeIn shadow-sm">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span>Sai định dạng (Ví dụ: MSKU 1234567)</span>
         </div>
      )}
    </div>
  );
};

export default ContainerInput;