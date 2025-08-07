import React, { useState } from 'react';
import { EducationalContent as EducationalContentType } from '../types/gambling';

interface EducationalContentProps {
  content: EducationalContentType[];
  onClose?: () => void;
}

export const EducationalContent: React.FC<EducationalContentProps> = ({
  content,
  onClose
}) => {
  const [selectedContent, setSelectedContent] = useState<EducationalContentType | null>(null);

  const getTypeIcon = (type: EducationalContentType['type']) => {
    switch (type) {
      case 'TIP':
        return '💡';
      case 'WARNING':
        return '⚠️';
      case 'RESOURCE':
        return '📚';
      default:
        return 'ℹ️';
    }
  };

  const getTypeColor = (type: EducationalContentType['type']) => {
    switch (type) {
      case 'TIP':
        return 'border-blue-500 bg-blue-900';
      case 'WARNING':
        return 'border-yellow-500 bg-yellow-900';
      case 'RESOURCE':
        return 'border-green-500 bg-green-900';
      default:
        return 'border-gray-500 bg-gray-900';
    }
  };

  if (selectedContent) {
    return (
      <div className="educational-content">
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h3 className="card-title">
                {getTypeIcon(selectedContent.type)} {selectedContent.title}
              </h3>
              <button
                onClick={() => setSelectedContent(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ←
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm leading-relaxed">
              {selectedContent.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-3">
                  {paragraph}
                </p>
              ))}
            </div>
            
            {selectedContent.url && (
              <div className="pt-4 border-t border-gray-600">
                <a
                  href={selectedContent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Learn More 🔗
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="educational-content">
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h3 className="card-title">Responsible Gambling Resources</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          {content.map((item) => (
            <div
              key={item.id}
              className={`educational-item ${getTypeColor(item.type)}`}
              onClick={() => setSelectedContent(item)}
            >
              <div className="flex items-start space-x-3 cursor-pointer">
                <div className="text-xl">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-300 line-clamp-2">
                    {item.content.substring(0, 100)}...
                  </p>
                </div>
                <div className="text-gray-400">
                  →
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-600">
          <div className="text-xs text-gray-400 text-center">
            <p>If you or someone you know has a gambling problem, help is available.</p>
            <div className="mt-2 space-x-4">
              <a
                href="https://www.ncpgambling.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                National Council on Problem Gambling
              </a>
              <span>•</span>
              <a
                href="tel:1-800-522-4700"
                className="text-blue-400 hover:text-blue-300"
              >
                1-800-522-4700
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};