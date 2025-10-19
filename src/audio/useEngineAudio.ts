import { useEffect, useRef } from 'react'
import { useStore } from '../state/store'
import { selectCavitating, selectMasterDischarge } from '../state/selectors'

const ENGINE_IDLE = 650
const MAX_RPM = 2200

export function useEngineAudio() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const cavitationOscRef = useRef<OscillatorNode | null>(null)
  const cavitationGainRef = useRef<GainNode | null>(null)
  const isInitializedRef = useRef(false)
  const prevRedlineCrossRef = useRef(false)

  const soundOn = useStore(state => state.soundOn)
  const rpm = useStore(state => state.gauges.rpm)
  const cavitating = useStore(selectCavitating)
  const masterDischarge = useStore(selectMasterDischarge)
  const isRedline = masterDischarge >= 350

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
      
      // Create cavitation noise oscillator (gravel sound)
      cavitationOscRef.current = audioContextRef.current.createOscillator()
      cavitationOscRef.current.type = 'square'
      cavitationOscRef.current.frequency.value = 40
      
      cavitationGainRef.current = audioContextRef.current.createGain()
      cavitationGainRef.current.gain.value = 0
      
      cavitationOscRef.current.connect(cavitationGainRef.current)
      cavitationGainRef.current.connect(audioContextRef.current.destination)
      cavitationOscRef.current.start()
      
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
      if (cavitationOscRef.current) {
        cavitationOscRef.current.stop()
        cavitationOscRef.current.disconnect()
        cavitationOscRef.current = null
      }
      if (cavitationGainRef.current) {
        cavitationGainRef.current.disconnect()
        cavitationGainRef.current = null
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

  // Cavitation gravel noise
  useEffect(() => {
    if (!soundOn || !cavitationGainRef.current || !audioContextRef.current) return
    
    if (cavitating) {
      // Gravel sound: random frequency modulation
      if (cavitationOscRef.current) {
        cavitationOscRef.current.frequency.setValueAtTime(
          30 + Math.random() * 30,
          audioContextRef.current.currentTime
        )
      }
      cavitationGainRef.current.gain.setValueAtTime(
        0.03,
        audioContextRef.current.currentTime
      )
    } else {
      cavitationGainRef.current.gain.setValueAtTime(
        0,
        audioContextRef.current.currentTime
      )
    }
  }, [cavitating, soundOn])

  // Redline crossing chirp (rising edge)
  useEffect(() => {
    if (!soundOn || !audioContextRef.current) return
    
    const crossedRedline = isRedline && !prevRedlineCrossRef.current
    if (crossedRedline) {
      // Play a short chirp
      const chirpOsc = audioContextRef.current.createOscillator()
      const chirpGain = audioContextRef.current.createGain()
      
      chirpOsc.type = 'sine'
      chirpOsc.frequency.setValueAtTime(800, audioContextRef.current.currentTime)
      chirpOsc.frequency.exponentialRampToValueAtTime(400, audioContextRef.current.currentTime + 0.1)
      
      chirpGain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
      chirpGain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1)
      
      chirpOsc.connect(chirpGain)
      chirpGain.connect(audioContextRef.current.destination)
      
      chirpOsc.start()
      chirpOsc.stop(audioContextRef.current.currentTime + 0.1)
    }
    
    prevRedlineCrossRef.current = isRedline
  }, [isRedline, soundOn])

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
      if (cavitationOscRef.current) {
        cavitationOscRef.current.stop()
        cavitationOscRef.current.disconnect()
      }
      if (cavitationGainRef.current) {
        cavitationGainRef.current.disconnect()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])
}