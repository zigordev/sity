import { initRum } from './observability/rum-client';

if (import.meta.env.PROD) initRum();
