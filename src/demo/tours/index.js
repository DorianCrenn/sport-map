import { presidentTour    } from './president.js';
import { coachTour         } from './coach.js';
import { communicationTour } from './communication.js';
import { parentTour        } from './parent.js';
import { playerTour        } from './player.js';
import { supporterTour     } from './supporter.js';

export { presidentTour, coachTour, communicationTour, parentTour, playerTour, supporterTour };

export function loadTour(profile) {
  switch (profile) {
    case 'president':      return presidentTour;
    case 'coach':          return coachTour;
    case 'communication':  return communicationTour;
    case 'parent':         return parentTour;
    case 'player':         return playerTour;
    case 'supporter':      return supporterTour;
    default:               return presidentTour;
  }
}
