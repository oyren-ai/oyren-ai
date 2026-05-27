import type { EmptyObject } from './EmptyObject.ts';
import type { SidecarError } from './SidecarError.ts';

export interface HandlerResponse<T = EmptyObject, E = SidecarError> {
  data?: T;
  error?: E;
}