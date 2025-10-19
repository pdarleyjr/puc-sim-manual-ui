import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'
import { getEngageContext } from '../../state/selectors'

const isMobile = window.matchMedia('(max-width: 1023px)').matches

// Welcome Overview Tour (5 steps + 2 line config steps)
export function startOverviewTour() {
  const ctx = getEngageContext()
  
  const tour = new Shepherd.Tour({
    defaultStepOptions: {
      cancelIcon: { enabled: true },
      scrollTo: { behavior: 'smooth', block: 'center' },
      classes: 'shadow-xl rounded-2xl ring-1 ring-white/10',
      arrow: true,
      canClickTarget: false,
    },
    useModalOverlay: true,
  })

  // Context-aware intro text
  const ENGAGE_INTRO: Record<string, string> = {
    'panel-only': 'Start here. Engage the water pump, or engage the water pump + foam manifold if you plan to flow foam.',
    'foam': 'Start here. Engage the water pump + foam manifold. Foam can flow only from the trashline, crosslays 1–3, and the driver-side rear 2½″.',
    'scenario-prearmed': 'Scenario is preselected. Enter the panel with the pump disengaged. Use the Scenario bar to Start or Abort at any time.'
  }

  tour.addStep({
    id: 'overview-1',
    text: ENGAGE_INTRO[ctx],
    attachTo: { element: '#anchor-engage', on: isMobile ? 'bottom' : 'right-start' },
    buttons: [
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  tour.addStep({
    id: 'overview-2',
    text: 'Choose Tank-to-Pump or Hydrant. In scenarios, Hydrant becomes available when your officer announces the tactic.',
    attachTo: { element: '#anchor-source', on: isMobile ? 'bottom-start' : 'right-start' },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  tour.addStep({
    id: 'overview-3',
    text: 'Governor sets the ceiling (PRESSURE/RPM). Discharge valves meter a % of that ceiling.',
    attachTo: { element: '#anchor-governor', on: isMobile ? 'bottom-end' : 'left-start' },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  tour.addStep({
    id: 'overview-4',
    text: 'Open a discharge with Valve %. Gauges reflect real hose/nozzle math. Watch hydrant residual ≥20 psi.',
    attachTo: { element: '#anchor-discharges', on: isMobile ? 'top-start' : 'right-start' },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  tour.addStep({
    id: 'overview-5',
    text: 'Levels: Water & Foam. Bars run green→yellow→red. Tank Fill recirculates (tank) or refills (hydrant).',
    attachTo: { element: '#anchor-levels', on: 'left-start' },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  // Line Configuration Facts
  tour.addStep({
    id: 'line-facts-1',
    text: 'Crosslays are preconfigured to Key Combat Ready 1¾″ hose. GPM readings use accurate friction-loss and nozzle pressure.',
    attachTo: { element: '#anchor-discharges', on: isMobile ? 'top-start' : 'right-start' },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  tour.addStep({
    id: 'line-facts-2',
    text: 'For 2½″ lines, choose the operation in "Assignment" (FDC, Skid/Leader, Blitzfire, Deck Gun) for accurate GPM.',
    attachTo: { element: '#anchor-twohalf', on: isMobile ? 'top-start' : 'top-end' },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Finish',
        action: tour.complete,
      },
    ],
  })

  tour.start()
  return tour
}

// Line Configuration Micro-Tour (3 steps) - kept for backwards compatibility
export function startLineConfigTour() {
  const tour = new Shepherd.Tour({
    defaultStepOptions: {
      cancelIcon: { enabled: true },
      scrollTo: { behavior: 'smooth', block: 'center' },
      classes: 'shadow-xl rounded-2xl ring-1 ring-white/10',
      arrow: true,
      canClickTarget: false,
    },
    useModalOverlay: true,
  })

  tour.addStep({
    id: 'line-1',
    text: 'Crosslays are preconfigured to Key Combat Ready 1¾" hose. GPM readings use real friction-loss & nozzle pressure.',
    attachTo: { element: '#anchor-discharges', on: isMobile ? 'top-start' : 'right-start' },
    buttons: [
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  tour.addStep({
    id: 'line-2',
    text: '2½" lines: pick the evolution in "Assignment" (e.g., FDC/standpipe, Skid/leader line, Blitzfire, Deck Gun).',
    attachTo: { element: '#anchor-twohalf', on: isMobile ? 'top-start' : 'top-end' },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  tour.addStep({
    id: 'line-3',
    text: 'Choosing an evolution loads the right hose/nozzle math so your GPM is accurate for that operation.',
    attachTo: { element: '#anchor-twohalf', on: isMobile ? 'top-start' : 'top-end' },
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Finish',
        action: tour.complete,
      },
    ],
  })

  tour.start()
  return tour
}

// Legacy startTour function (for backwards compatibility if needed)
export function startTour() {
  startOverviewTour()
}