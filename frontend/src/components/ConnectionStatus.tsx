import React from 'react';
import { ConnectionStatus as ConnectionStatusType } from '../types';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  return (
    <div className="flex items-center text-sm">
      <span 
        className={`status-indicator ${
          status.connected ? 'status-connected' : 'status-disconnected'
        }`}
      />
      <span>
        {status.connected ? 'Connected' : 'Disconnected'}
        {status.lastUpdate && (
          <span className="text-gray-400 ml-2">
            Last update: {new Date(status.lastUpdate).toLocaleTimeString()}
          </span>
        )}
      </span>
      {status.error && (
        <span className="text-red text-xs ml-2">
          ({status.error})
        </span>
      )}
    </div>
  );
};