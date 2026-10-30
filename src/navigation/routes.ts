// Which screens exist for the selected client.
import type { ClientConfig } from '../config/types';
import { client } from '../config/client';
import { routes } from './routes.generated';
import type { RouteDef } from './types';

export function isRouteEnabled(r: RouteDef, c: ClientConfig): boolean {
  return !r.feature || c.features[r.feature] === true;
}

export function enabledRoutes(c: ClientConfig = client): RouteDef[] {
  return routes.filter(r => isRouteEnabled(r, c));
}

export function findRoute(name: string, c: ClientConfig = client): RouteDef | undefined {
  return enabledRoutes(c).find(r => r.name === name);
}
