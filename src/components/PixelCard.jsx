function PixelCard({ title, description, children, footer, className = '' }) {
  return (
    <div className={`pixel-card ${className}`}>
      {title ? <div className="pixel-card-header">{title}</div> : null}
      {description ? <div className="pixel-card-desc">{description}</div> : null}
      <div className="pixel-card-content">{children}</div>
      {footer ? <div className="pixel-card-footer">{footer}</div> : null}
    </div>
  )
}

export default PixelCard