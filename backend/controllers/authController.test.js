import test from 'node:test';
import assert from 'node:assert/strict';

import { isValidProfilePhoto } from './authController.js';

const makeDataUri = (mimeType, bytes) =>
  `data:${mimeType};base64,${bytes.toString('base64')}`;

test('accepts bounded JPEG, PNG, and WebP image signatures', () => {
  assert.equal(
    isValidProfilePhoto(
      makeDataUri(
        'image/jpeg',
        Buffer.from([0xff, 0xd8, 0xff, 0x00]),
      ),
    ),
    true,
  );
  assert.equal(
    isValidProfilePhoto(
      makeDataUri(
        'image/png',
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ),
    true,
  );
  assert.equal(
    isValidProfilePhoto(
      makeDataUri(
        'image/webp',
        Buffer.from('RIFF0000WEBP'),
      ),
    ),
    true,
  );
  assert.equal(isValidProfilePhoto(null), true);
});

test('rejects unsupported, malformed, spoofed, and oversized profile photos', () => {
  assert.equal(
    isValidProfilePhoto('data:image/svg+xml;base64,PHN2Zz4='),
    false,
  );
  assert.equal(
    isValidProfilePhoto('data:image/png;base64,not-base64!'),
    false,
  );
  assert.equal(
    isValidProfilePhoto(
      makeDataUri('image/png', Buffer.from('not a PNG')),
    ),
    false,
  );

  const oversizedPng = Buffer.alloc(512 * 1024 + 1);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    .copy(oversizedPng);
  assert.equal(
    isValidProfilePhoto(makeDataUri('image/png', oversizedPng)),
    false,
  );
});
