import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'

// Welcome Overview Tour (5 steps)
export function startOverviewTour() {
  const tour = new Shepherd.Tour({
    defaultStepOptions: {
      cancelIcon: { enabled: true },
      scrollTo: { behavior: 'smooth', block: 'center' },
      classes: 'shepherd-theme-custom',
    },
    useModalOverlay: true,
  })

  tour.addStep({
    id: 'overview-1',
    text: 'Start here. Engage the pump or enter Scenario Mode. You control everything manually.',
    attachTo: { element: '#engage-card', on: 'right' },
    buttons: [
      {
        text: 'Next',
        action: tour.next,
      },
    ],
  })

  tour.addStep({
    id: 'overview-2',
    text: 'Choose Tank-to-Pump or Hydrant. Hydrant takes ~30s to establish in scenarios.',
    attachTo: { element: '#source-card', on: 'right' },
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
    text: 'Governor sets the ceiling: PRESSURE or RPM. Discharge valves meter a % of that.',
    attachTo: { element: '#governor-card', on: 'left' },
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
    text: 'Open a discharge with Valve %. Gauges reflect real hose/nozzle math. Watch residual ≥20 psi on hydrant.',
    attachTo: { element: '#discharges-grid', on: 'top' },
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
    text: 'Levels: Water & Foam. Colors: green>yellow>red. Tank Fill can recirculate or refill (hydrant).',
    attachTo: { element: '#levels-card', on: 'left' },
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

// Line Configuration Micro-Tour (3 steps)
export function startLineConfigTour() {
  const tour = new Shepherd.Tour({
    defaultStepOptions: {
      cancelIcon: { enabled: true },
      scrollTo: { behavior: 'smooth', block: 'center' },
      classes: 'shepherd-theme-custom',
    },
    useModalOverlay: true,
  })

  tour.addStep({
    id: 'line-1',
    text: 'Crosslays are preconfigured to Key Combat Ready 1¾" hose. GPM readings use real friction-loss & nozzle pressure.',
    attachTo: { element: '#discharges-grid', on: 'top' },
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
    attachTo: { element: '.twohalf-multiplexer', on: 'top' },
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
    attachTo: { element: '.assignment-control', on: 'right' },
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