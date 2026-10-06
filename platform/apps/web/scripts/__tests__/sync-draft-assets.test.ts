import {describe, expect, it} from 'vitest';
import {getSyncPaths} from '../sync-draft-assets.mjs';

describe('sync-draft-assets path mapping', () => {
  it('maps slugs to correct src and dst paths', () => {
    const tasks = getSyncPaths('/source', '/target', ['africa', 'safari']);
    expect(tasks).toEqual([
      {src: '/source/africa', dst: '/target/africa'},
      {src: '/source/safari', dst: '/target/safari'}
    ]);
  });
});
