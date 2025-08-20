import React, { forwardRef } from 'react'
import closeIcon from '../../assets/close-icon.svg'
import './CloseButton.css'

const CloseButton = forwardRef(({ 
  onClick, 
  className = '', 
  size = 'medium', 
  variant = 'default',
  ariaLabel = 'Kapat',
  ...props 
}, ref) => {
  const sizeClasses = {
    small: 'close-btn-small',
    medium: 'close-btn-medium', 
    large: 'close-btn-large'
  }

  const variantClasses = {
    default: 'close-btn-default',
    modal: 'close-btn-modal',
    overlay: 'close-btn-overlay',
    embedded: 'close-btn-embedded'
  }

  return (
    <button
      ref={ref}
      type="button"
      className={`close-btn ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      {...props}
    >
      <img src={closeIcon} alt="" className="close-btn-icon" />
    </button>
  )
})

export default CloseButton