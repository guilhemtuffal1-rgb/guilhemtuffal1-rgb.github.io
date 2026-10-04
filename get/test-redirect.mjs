// Run: node get/test-redirect.mjs
import assert from 'node:assert';
import {
  EDITIONS, pickEdition, sanitizeCampaign, detectPlatform,
  buildAppStoreUrl, buildPlayUrl, APPLE_PROVIDER_TOKEN,
  sanitizeQuizCode, buildAndroidQuizIntent,
} from './redirect.mjs';

// pickEdition falls back to world for unknown/missing codes
assert.strictEqual(pickEdition('europe'), 'europe');
assert.strictEqual(pickEdition('atlantis'), 'world');
assert.strictEqual(pickEdition(null), 'world');

// sanitizeCampaign keeps a safe token, rejects everything else
assert.strictEqual(sanitizeCampaign('daily'), 'daily');
assert.strictEqual(sanitizeCampaign('score-2'), 'score-2');
assert.strictEqual(sanitizeCampaign('a b&c=1'), 'share');
assert.strictEqual(sanitizeCampaign(''), 'share');
assert.strictEqual(sanitizeCampaign('x'.repeat(999)), 'x'.repeat(40)); // trimmed to 40 chars, still valid charset

// detectPlatform
assert.strictEqual(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', '', 0), 'ios');
assert.strictEqual(detectPlatform('Mozilla/5.0 (Linux; Android 14)', '', 0), 'android');
assert.strictEqual(detectPlatform('Mozilla/5.0 (Macintosh)', 'MacIntel', 5), 'ios'); // iPadOS desktop UA
assert.strictEqual(detectPlatform('Mozilla/5.0 (Macintosh)', 'MacIntel', 0), 'desktop'); // real Mac
assert.strictEqual(detectPlatform('Mozilla/5.0 (Windows NT 10.0)', 'Win32', 0), 'desktop');

// buildPlayUrl always carries a UTM referrer
const playUrl = buildPlayUrl(EDITIONS.world.androidId, 'daily');
assert.ok(playUrl.startsWith('https://play.google.com/store/apps/details?'));
assert.ok(playUrl.includes('id=com.guigui314.GeoMaster&'));
assert.ok(decodeURIComponent(playUrl).includes('utm_source=periplo_site&utm_medium=share&utm_campaign=daily'));

// buildAppStoreUrl omits pt/ct while the provider token placeholder is unset
assert.ok(APPLE_PROVIDER_TOKEN.startsWith('REPLACE_'), 'update this test once a real token is set');
const iosUrl = buildAppStoreUrl(EDITIONS.world.iosId, 'daily');
assert.strictEqual(iosUrl, 'https://apps.apple.com/app/id6764830622?mt=8');
assert.ok(!iosUrl.includes('pt=') && !iosUrl.includes('ct='));

// Shared quiz codes: the app's alphabet only, case-insensitive
assert.strictEqual(sanitizeQuizCode('ab3k7m'), 'AB3K7M');
assert.strictEqual(sanitizeQuizCode('AB3K70'), null);
assert.strictEqual(sanitizeQuizCode('AB3K7M&x=1'), null);
assert.strictEqual(sanitizeQuizCode(null), null);
const intent = buildAndroidQuizIntent('world', 'AB3K7M', EDITIONS.world.androidId, playUrl);
assert.ok(intent.startsWith('intent://quiz/AB3K7M#Intent;scheme=periplo-world;package=com.guigui314.GeoMaster;'));
assert.ok(intent.endsWith(';end'));
assert.strictEqual(decodeURIComponent(intent.split('S.browser_fallback_url=')[1].slice(0, -4)), playUrl);

console.log('get/redirect.mjs: all assertions passed');
