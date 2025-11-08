import React from 'react'
import { X } from 'lucide-react'

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`relative bg-white rounded-2xl shadow-xl ${maxWidth} w-full`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-center gap-2">
              <img 
                src="/images/logo.png" 
                alt="Logo" 
                className="h-6 w-6 filter brightness-0 invert"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal
