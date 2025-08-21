import { forwardRef } from 'react'

const PixelButton = forwardRef(({ className = '', variant = 'default', asChild, children, ...props }, ref) => {
  const classes = ['pixel-button']
  if (variant === 'outline') classes.push('outline')
  if (className) classes.push(className)

  const Comp = asChild ? 'span' : 'button'
  return (
    <Comp ref={ref} className={classes.join(' ')} {...props}>
      {children}
    </Comp>
  )
})

export default PixelButton