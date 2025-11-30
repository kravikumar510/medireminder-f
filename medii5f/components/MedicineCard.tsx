import React, { useState } from 'react';
import { Medicine, MedicineType } from '../types';
import Button from './Button';

interface MedicineCardProps {
  medicine: Medicine;
  onDelete: (id: string) => void;
  onEdit: (medicine: Medicine) => void;
  isDeleting: boolean;
  onPlayAlarm: () => void;
}

const getIconForType = (type?: string) => {
  switch (type) {
    case 'Capsule': return 'fa-capsules';
    case 'Syrup': return 'fa-bottle-droplet';
    case 'Injection': return 'fa-syringe';
    case 'Drops': return 'fa-eye-dropper';
    case 'Inhaler': return 'fa-mask-ventilator';
    case 'Cream': return 'fa-pump-soap';
    default: return 'fa-tablets'; // Default for Tablet and others
  }
};

const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onDelete, onEdit, isDeleting, onPlayAlarm }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleAlarmClick = () => {
    setIsPlaying(true);
    onPlayAlarm();
    setTimeout(() => setIsPlaying(false), 5000); // Reset visual state after 5s
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
      
      {isPlaying && (
        <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center pointer-events-none animate-pulse z-0">
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg text-white shadow-sm ${isPlaying ? 'bg-red-500 animate-bounce' : 'bg-primary'}`}>
              <i className={`fa-solid ${getIconForType(medicine.type)} text-xl`}></i>
            </div>
            <div>
               <span className="text-xs font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full border border-purple-100 dark:border-purple-800">
                {medicine.type || 'Tablet'}
              </span>
            </div>
          </div>
          <button 
            onClick={handleAlarmClick}
            disabled={isPlaying}
            title="Test Reminder Alarm (5s)"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isPlaying ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300 hover:text-primary hover:bg-purple-50 dark:hover:bg-purple-900'}`}
          >
            <i className={`fa-solid fa-bell ${isPlaying ? 'fa-shake' : ''}`}></i>
          </button>
        </div>
        
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{medicine.name}</h3>
        
        <div className="space-y-1 mb-4">
          <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center">
            <i className="fa-solid fa-prescription-bottle w-6 text-center mr-2 text-slate-300 dark:text-slate-600"></i>
            {medicine.dosage}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center">
            <i className="fa-solid fa-clock w-6 text-center mr-2 text-slate-300 dark:text-slate-600"></i>
            {medicine.frequency}
          </p>
        </div>
      </div>
      
      <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-2 flex justify-end gap-2 relative z-10">
        <Button 
          variant="ghost" 
          onClick={() => onEdit(medicine)} 
          className="text-slate-500 hover:text-primary hover:bg-purple-50 dark:text-slate-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20 text-sm px-3"
        >
          <i className="fa-regular fa-pen-to-square mr-2"></i> Edit
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => onDelete(medicine._id)} 
          isLoading={isDeleting}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm px-3"
        >
          <i className="fa-regular fa-trash-can mr-2"></i> Remove
        </Button>
      </div>
    </div>
  );
};

export default MedicineCard;