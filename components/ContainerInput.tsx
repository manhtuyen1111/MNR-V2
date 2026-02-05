import React, { useRef } from 'react';
import { CheckCircle, AlertCircle, Container } from 'lucide-react';

interface ContainerInputProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
  isActive: boolean;
  onFocus: () => void;
}

const ContainerInput: React.FC<ContainerInputProps> = ({ value, onChange, isValid, isActive, onFocus }) => {
  const prefixRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);

  // Split value into prefix (first 4) and number (rest)
  const prefix = value.slice(0, 4);
  const numberPart = value.slice(4);

  const handlePrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    onChange(val + numberPart);
    // Auto jump to number input if prefix is full
    if (val.length === 4 && numberRef.current) {
        numberRef.current.focus();
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 7);
    onChange(prefix + val);
  };

  return (
    <div 
      onClick={onFocus}
      className={`
        transition-all duration-300 ease-out rounded-2xl p-3 border-2
        ${isActive 
          ? 'bg-white border-sky-600 shadow-[0_10px_40px_-10px_rgba(14,165,233,0.3)] scale-[1.02] z-30 translate-y-[-4px]' 
          : 'bg-white border-slate-200 shadow-sm scale-100 opacity-90'
        }
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
            <div className={`p-1 rounded-md ${isActive ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                 <span className="text-[10px] font-bold px-1">01</span>
            </div>
            <label className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-sky-700' : 'text-slate-500'}`}>
              Số Container
            </label>
        </div>
        {isValid && <CheckCircle className="w-5 h-5 text-green-500 fill-green-100" />}
      </div>

      <div className="flex items-center space-x-3">
        {/* Prefix Input */}
        <div className="w-28 relative">
            <input
            ref={prefixRef}
            type="text"
            value={prefix}
            onChange={handlePrefixChange}
            onFocus={onFocus}
            placeholder="ABCD"
            className={`
                w-full text-center text-2xl font-black font-mono py-3 rounded-xl border-2 outline-none transition-colors uppercase placeholder-slate-200
                ${isActive ? 'border-sky-200 bg-sky-50 text-sky-900 focus:border-sky-500' : 'border-slate-100 bg-slate-50 text-slate-700'}
            `}
            />
            <span className="absolute -bottom-4 left-0 w-full text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tiếp đầu ngữ</span>
        </div>

        {/* Dash Separator */}
        <div className="h-1 w-3 bg-slate-300 rounded-full"></div>

        {/* Number Input */}
        <div className="flex-1 relative">
            <input
            ref={numberRef}
            type="tel" // Keypad for numbers
            value={numberPart}
            onChange={handleNumberChange}
            onFocus={onFocus}
            placeholder="1234567"
            className={`
                w-full text-center text-2xl font-black font-mono py-3 rounded-xl border-2 outline-none transition-colors tracking-widest placeholder-slate-200
                ${isActive ? 'border-sky-200 bg-sky-50 text-sky-900 focus:border-sky-500' : 'border-slate-100 bg-slate-50 text-slate-700'}
            `}
            />
            <span className="absolute -bottom-4 left-0 w-full text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">7 Số cuối</span>
        </div>
      </div>
      
      {/* Validation Message */}
      <div className="h-4 mt-4 flex justify-center">
         {value.length > 0 && !isValid && (
             <div className="flex items-center text-[10px] font-bold text-red-500 animate-pulse">
                <AlertCircle className="w-3 h-3 mr-1" />
                <span>Yêu cầu: 4 chữ + 7 số</span>
             </div>
         )}
      </div>
    </div>
  );
};

export default ContainerInput;