import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'

export function startTour() {
  const tour = new Shepherd.Tour({
    defaultStepOptions: {
      cancelIcon: { enabled: true },
      scrollTo: { behavior: 'smooth', block: 'center' },
      classes: 'shepherd-theme-custom',
    },
    useModalOverlay: true,
  })

  tour.addStep({
    id: 'start',
    text: 'Welcome to the Pierce PUC Fire Pump Simulator! This is a manual-only pump panel trainer. Let me show you the key controls.',
    attachTo: { element: '#master-gauges', on: 'bottom' },
    buttons: [
      {
        text: 'Start Tour',
        action: tour.next,
      },
    ],
  })

  tour.addStep({
    id: 'engage',
    text: 'First, engage the pump here. You can choose Water Pump or Foam System mode. This starts your pump engagement session.',
    attachTo: { element: '#engage-card', on: 'right' },
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
    id: 'source',
    text: 'Choose your water source: Tank-to-Pump for onboard water, or Hydrant for external supply. You can also control Tank Fill/Recirculate here.',
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
    id: 'governor',
    text: 'Set your discharge pressure with the Governor. Choose PRESSURE mode to set PSI, or RPM mode for manual engine control.',
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
    id: 'discharges',
    text: 'Open discharge lines and adjust valve percentage to control individual line pressure. Each line shows real-time GPM and gallons pumped.',
    attachTo: { element: '#discharges-grid', on: 'top' },
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
}