'use client';

import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';

export interface DateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export default function DateTimePicker({ 
  label, 
  value, 
  onChange, 
  placeholder = "Select date and time",
  className = ""
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    value ? value.toISOString().split('T')[0] : ''
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    value ? value.toTimeString().slice(0, 5) : ''
  );

  const handleDateChange = (dateString: string) => {
    setSelectedDate(dateString);
    if (dateString && selectedTime) {
      const newDate = new Date(`${dateString}T${selectedTime}`);
      onChange(newDate);
    }
  };

  const handleTimeChange = (timeString: string) => {
    setSelectedTime(timeString);
    if (selectedDate && timeString) {
      const newDate = new Date(`${selectedDate}T${timeString}`);
      onChange(newDate);
    }
  };

  const handleApply = () => {
    if (selectedDate && selectedTime) {
      const newDate = new Date(`${selectedDate}T${selectedTime}`);
      onChange(newDate);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setSelectedDate(value ? value.toISOString().split('T')[0] : '');
    setSelectedTime(value ? value.toTimeString().slice(0, 5) : '');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:border-[#484de6] focus:outline-none transition-colors duration-200"
      >
        <Calendar className="w-5 h-5 text-gray-400" />
        <span className="flex-1 text-left text-gray-900">
          {value ? value.toLocaleString() : placeholder}
        </span>
        <Clock className="w-5 h-5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-4">
            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#484de6] focus:outline-none"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Time Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#484de6] focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 px-4 py-2 bg-[#484de6] text-white rounded-lg hover:bg-[#3a3bc7] transition-colors duration-200 cursor-pointer"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
