import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { cameraOffset, movementFromKeys, rotateCamera } from '../src/web/controls.js';
import { createGame, step } from '../src/core/game.js';

test('WASD projects to the correct screen direction across camera yaw and pitch', () => {
  for (const yaw of [0, 90, 180, -90, 37]) for (const pitch of [.15, .55, 1.2]) {
    const camera = new PerspectiveCamera(55, 16 / 9, .1, 180);
    camera.position.fromArray(cameraOffset(yaw, pitch)); camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const origin = new Vector3(0, 0, 0).project(camera);
    for (const [key, axis, sign] of [['KeyD', 'x', 1], ['KeyA', 'x', -1], ['KeyW', 'y', 1], ['KeyS', 'y', -1]]) {
      const game = createGame({ random_motes: false, random_shades: false });
      step(game, { cam_yaw_deg: yaw, move: movementFromKeys(new Set([key])) });
      const projected = new Vector3(...game.player.pos).project(camera);
      assert.ok((projected[axis] - origin[axis]) * sign > 0, `${key}, yaw=${yaw}, pitch=${pitch}`);
    }
  }
});
test('mouse turns right without changing contract yaw convention; pitch stays bounded', () => {
  const right = rotateCamera(0, .55, 100, 0);
  assert.ok(right.yaw < 0);
  const before = cameraOffset(0, .55), after = cameraOffset(right.yaw, right.pitch);
  assert.ok(-after[0] > -before[0]);
  assert.equal(rotateCamera(0, .55, 0, -10000).pitch, .15);
  assert.equal(rotateCamera(0, .55, 0, 10000).pitch, 1.2);
});
