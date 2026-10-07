// Must be the FIRST import in `main.ts` so Sentry can instrument modules
// loaded afterwards. Does nothing at all unless `SENTRY_DSN` is set.
import * as Sentry from '@sentry/nestjs';
import {sentryOptionsFromEnv} from './observability/sentry';

const options = sentryOptionsFromEnv(process.env);
if (options !== undefined) Sentry.init(options);
