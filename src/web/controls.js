// Contract yaw is clockwise from +Z; the browser camera faces toward -Z at yaw 0.
export function movementFromKeys(keys) {
  return [Number(keys.has('KeyD')) - Number(keys.has('KeyA')), Number(keys.has('KeyS')) - Number(keys.has('KeyW'))];
}
export function cameraOffset(yaw, pitch, distance = 13) {
  const angle = yaw * Math.PI / 180;
  return [Math.sin(angle) * Math.cos(pitch) * distance, Math.sin(pitch) * distance, Math.cos(angle) * Math.cos(pitch) * distance];
}
export function rotateCamera(yaw, pitch, dx, dy) {
  return { yaw: (yaw - dx * .15) % 360, pitch: Math.max(.15, Math.min(1.2, pitch + dy * .003)) };
}
