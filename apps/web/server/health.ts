import { currentRelease } from '../src/observability/json-logger';
import { recordHealth } from '../src/observability/health-metrics';

export interface HealthBody {
  readonly status: 'ok';
  readonly service: string;
  readonly release: string;
  readonly components: Record<string, never>;
}

export function health(): HealthBody {
  recordHealth('ok', {});

  return {
    status: 'ok',
    service: process.env.OTEL_SERVICE_NAME?.trim() || 'sity-web',
    release: currentRelease() ?? 'dev',
    components: {},
  };
}
