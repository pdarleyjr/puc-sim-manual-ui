import { ArrowLeft } from 'lucide-react'
import { useSettings } from '../store'
import { useLauncher } from '../../../state/launcher'

interface BackButtonProps {
  label?: string
  className?: string
}

export function BackButton({ label = 'Home', className = '' }: BackButtonProps) {
  const { saveAndNavigateHome } = useSettings()
  const { setMode } = useLauncher()
  
  const handleBack = async () => {
    // Save any pending changes to localStorage
    await saveAndNavigateHome()
    
    // Navigate to launcher
    setMode(null) // null = home/launcher
  }
  
  return (
    <button
      onClick={handleBack}
      className={`
        inline-flex items-center gap-2 px-4 py-2 
        bg-gray-100 hover:bg-gray-200 
        text-gray-700 rounded-lg 
        transition-colors duration-200
        touch-target-min
        ${className}
      `}
      style={{ minHeight: '44px', minWidth: '44px' }}
    >
      <ArrowLeft className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  )
}