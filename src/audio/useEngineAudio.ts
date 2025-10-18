import { useEffect, useRef } from 'react'
import { useStore } from '../state/store'

const ENGINE_IDLE = 650
const MAX_RPM = 2200

export function useEngineAudio() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const isInitializedRef = useRef(false)

  const soundOn = useStore(state => state.soundOn)
  const rpm = useStore(state => state.gauges.rpm)

  // Initialize audio context only when sound is turned on AND we have a gesture
  useEffect(() => {
    if (soundOn && !isInitializedRef.current) {
      // Create audio context
      audioContextRef.current = new AudioContext()
      
      // Create oscillator for engine tone
      oscillatorRef.current = audioContextRef.current.createOscillator()
      oscillatorRef.current.type = 'sawtooth'
      oscillatorRef.current.frequency.value = 80
      
      // Create gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.gain.value = 0.05
      
      // Connect nodes
      oscillatorRef.current.connect(gainNodeRef.current)
      gainNodeRef.current.connect(audioContextRef.current.destination)
      
      // Start oscillator
      oscillatorRef.current.start()
      
      isInitializedRef.current = true
    } else if (!soundOn && isInitializedRef.current) {
      // Stop and cleanup when sound is turned off
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
        oscillatorRef.current.disconnect()
        oscillatorRef.current = null
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect()
        gainNodeRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      isInitializedRef.current = false
    }
  }, [soundOn])

  // Update audio parameters based on RPM
  useEffect(() => {
    if (!soundOn || !oscillatorRef.current || !gainNodeRef.current) return

    // Normalize RPM (0..1)
    const normalizedRpm = (rpm - ENGINE_IDLE) / (MAX_RPM - ENGINE_IDLE)
    
    // Frequency increases modestly with RPM (80-120 Hz range)
    const frequency = 80 + normalizedRpm * 40
    oscillatorRef.current.frequency.setValueAtTime(
      frequency,
      audioContextRef.current!.currentTime
    )
    
    // Gain scales with RPM
    const gain = 0.02 + normalizedRpm * 0.08
    gainNodeRef.current.gain.setValueAtTime(
      gain,
      audioContextRef.current!.currentTime
    )
  }, [rpm, soundOn])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
        oscillatorRef.current.disconnect()
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])
}