import { X, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../state/store'
import { FrictionLossSettings } from './FrictionLossSettings'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabId = 'general' | 'friction-loss'

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const soundOn = useStore(state => state.soundOn)
  const setSoundOn = useStore(state => state.setSoundOn)
  const [activeTab, setActiveTab] = useState<TabId>('general')

  if (!isOpen) return null

  const handleSoundToggle = () => {
    setSoundOn(!soundOn)
  }

  const tabButtonClass = (isActive: boolean) => `
    px-4 py-2 rounded-lg font-medium transition-all
    ${isActive 
      ? 'bg-emerald-500 text-white' 
      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
    }
  `

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1d23] rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b border-white/10">
          <button 
            onClick={() => setActiveTab('general')}
            className={tabButtonClass(activeTab === 'general')}
          >
            General
          </button>
          <button 
            onClick={() => setActiveTab('friction-loss')}
            className={tabButtonClass(activeTab === 'friction-loss')}
          >
            Friction Loss
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Sound Toggle */}
              <div className="puc-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {soundOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
                    <div>
                      <div className="font-semibold">Engine Sound</div>
                      <div className="text-sm opacity-60">
                        {soundOn ? 'Audio enabled' : 'Audio disabled'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSoundToggle}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      soundOn ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      soundOn ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                
                {soundOn && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-400">
                      Audio requires user interaction. Toggle sound after interacting with the panel.
                    </p>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="puc-card">
                <h3 className="font-semibold mb-2">About</h3>
                <div className="text-sm opacity-60 space-y-1">
                  <p>Fire Pump Manual Simulator</p>
                  <p>Manual-only operation mode</p>
                  <p>No automatic valve control</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'friction-loss' && (
            <FrictionLossSettings />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}