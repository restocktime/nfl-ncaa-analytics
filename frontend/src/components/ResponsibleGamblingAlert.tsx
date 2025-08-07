import React from 'react';
import { GamblingAlert } from '../types/gambling';

interface ResponsibleGamblingAlertProps {
  alert: GamblingAlert;
  onAcknowledge: (alertId: string) => void;
  onTakeBreak?: () => void;
}

export const ResponsibleGamblingAlert: React.FC<ResponsibleGamblingAlertProps> = ({
  alert,
  onAcknowledge,
  onTakeBreak
}) => {
  const getSeverityStyles = (severity: GamblingAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-900 border-red-500 text-red-100';
      case 'WARNING':
        return 'bg-yellow-900 border-yellow-500 text-yellow-100';
      case 'INFO':
        return 'bg-blue-900 border-blue-500 text-blue-100';
      default:
        return 'bg-gray-900 border-gray-500 text-gray-100';
    }
  };

  const getIcon = (type: GamblingAlert['type']) => {
    switch (type) {
      case 'TIME_LIMIT':
        return '⏰';
      case 'ACTIVITY_LIMIT':
        return '📊';
      case 'SPENDING_LIMIT':
        return '💰';
      case 'BREAK_REMINDER':
        return '☕';
      default:
        return '⚠️';
    }
  };

  return (
    <div className={`gambling-alert ${getSeverityStyles(alert.severity)}`}>
      <div className="flex items-start space-x-3">
        <div className="text-2xl">
          {getIcon(alert.type)}
        </div>
        
        <div className="flex-1">
          <h4 className="font-bold text-lg mb-2">
            {alert.title}
          </h4>
          <p className="text-sm mb-4">
            {alert.message}
          </p>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Acknowledge
            </button>
            
            {(alert.type === 'TIME_LIMIT' || alert.type === 'BREAK_REMINDER') && onTakeBreak && (
              <button
                onClick={onTakeBreak}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Take Break
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onAcknowledge(alert.id)}
          className="text-gray-400 hover:text-white text-xl"
          aria-label="Close alert"
        >
          ×
        </button>
      </div>
      
      <div className="text-xs text-gray-400 mt-3">
        {new Date(alert.timestamp).toLocaleString()}
      </div>
    </div>
  );
};