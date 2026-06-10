import { presidentTour  } from './president.js';
import { coachTour       } from './coach.js';
import { communicationTour } from './communication.js';
import { parentTour      } from './parent.js';

export { presidentTour, coachTour, communicationTour, parentTour };

export function loadTour(profile) {
  switch (profile) {
    case 'president':      return presidentTour;
    case 'coach':          return coachTour;
    case 'communication':  return communicationTour;
    case 'parent':         return parentTour;
    default:               return presidentTour;
  }
}
