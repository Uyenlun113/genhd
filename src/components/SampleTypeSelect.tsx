'use client';

import React, { useState, useEffect } from 'react';
import { List } from 'lucide-react';

const PRESET_SAMPLE_TYPES = ['Máu', 'Niêm mạc miệng', 'Tóc', 'Móng'];

interface SampleTypeSelectProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  selectClassName?: string;
  inputClassName?: string;
  placeholder?: string;
}

export default function SampleTypeSelect({
  value,
  onChange,
  disabled = false,
  selectClassName,
  inputClassName,
  placeholder = 'Nhập loại mẫu (Enter để lưu)...',
}: SampleTypeSelectProps) {
  const isPreset = PRESET_SAMPLE_TYPES.includes(value);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(!isPreset && Boolean(value));
  const [tempValue, setTempValue] = useState<string>(value || '');

  useEffect(() => {
    setTempValue(value || '');
    if (!PRESET_SAMPLE_TYPES.includes(value) && Boolean(value)) {
      setIsCustomMode(true);
    }
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === 'Khác') {
      setIsCustomMode(true);
      const newTemp = isPreset ? '' : value;
      setTempValue(newTemp);
      if (isPreset) {
        onChange('');
      }
    } else {
      setIsCustomMode(false);
      onChange(selected);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onChange(tempValue);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleInputBlur = () => {
    onChange(tempValue);
  };

  const handleSwitchToSelect = () => {
    setIsCustomMode(false);
    if (!PRESET_SAMPLE_TYPES.includes(tempValue)) {
      onChange(PRESET_SAMPLE_TYPES[0]);
    }
  };

  const defaultSelectClass = "w-full p-2 text-xs border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-600 cursor-pointer";
  const defaultInputClass = "w-full p-2 text-xs border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-600";

  if (isCustomMode) {
    return (
      <div className="relative w-full flex items-center">
        <input
          type="text"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          disabled={disabled}
          autoFocus
          placeholder={placeholder}
          className={`${inputClassName || defaultInputClass} pr-7`}
        />
        {!disabled && (
          <button
            type="button"
            onClick={handleSwitchToSelect}
            className="absolute right-2 text-slate-400 hover:text-sky-600 p-0.5 rounded cursor-pointer transition-colors"
            title="Chọn lại từ danh sách mẫu có sẵn"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <select
        value={isPreset ? value : 'Khác'}
        onChange={handleSelectChange}
        disabled={disabled}
        className={selectClassName || defaultSelectClass}
      >
        {PRESET_SAMPLE_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
        <option value="Khác">Khác (tự nhập thủ công)</option>
      </select>
    </div>
  );
}
