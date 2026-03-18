import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-150',
        'active:scale-[0.97] select-none touch-manipulation',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        {
          'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950': variant === 'primary',
          'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300': variant === 'secondary',
          'text-gray-600 hover:bg-gray-100 active:bg-gray-200': variant === 'ghost',
          'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
        },
        {
          'text-xs px-3 py-2 gap-1.5': size === 'sm',
          'text-sm px-5 py-3 gap-2': size === 'md',
          'text-base px-6 py-3.5 gap-2': size === 'lg',
          'text-lg px-8 py-4 gap-3': size === 'xl',
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
export default Button
