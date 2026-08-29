/* FRONTEND STATUS BADGE COMPONENT (3-Tier Operational Semantics) */
import { createElement } from './utils.js';

export function createStatusBadge(tierInput) {
  const tier = String(tierInput || 'SAFE').toUpperCase();

  let className = 'status-badge status-badge--safe';
  let iconHtml = '✓';
  let label = 'SAFE';

  if (tier === 'CAUTION' || tier === 'DEGRADED' || tier === 'RESTRICTED' || tier === 'REROUTED') {
    className = 'status-badge status-badge--caution';
    iconHtml = '▲';
    label = 'CAUTION';
  } else if (tier === 'BLOCKED' || tier === 'HAZARDOUS' || tier === 'IMPASSABLE' || tier === 'STRANDED') {
    className = 'status-badge status-badge--blocked';
    iconHtml = '🛑';
    label = 'BLOCKED';
  }

  const badge = createElement('span', { className }, [
    createElement('span', { className: 'status-badge__icon', 'aria-hidden': 'true' }, iconHtml),
    createElement('span', { className: 'status-badge__label' }, label)
  ]);

  return badge;
}
