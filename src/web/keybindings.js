export const ACTIONS={forward:'Đi tới',back:'Đi lùi',left:'Sang trái',right:'Sang phải',jump:'Nhảy',dash:'Lướt',interact:'Tương tác',pulse:'Tỏa sáng',pause:'Tạm dừng'};
export const DEFAULT_BINDINGS={forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',dash:'ShiftLeft',interact:'KeyE',pulse:'KeyQ',pause:'KeyP'};
export const normalizeKey=code=>code==='ShiftRight'?'ShiftLeft':code;
export const keyLabel=code=>code?.replace(/^Key/,'').replace(/^Digit/,'').replace('ShiftLeft','Shift').replace('Space','Space')??'?';
export function validateBindings(bindings){
 const used=new Map();for(const action of Object.keys(ACTIONS)){const key=normalizeKey(bindings[action]);if(typeof key!=='string'||!/^[A-Za-z0-9]{1,30}$/.test(key))throw new Error(`Thiếu phím ${ACTIONS[action]}`);if(used.has(key))throw new Error(`Phím ${keyLabel(key)} đã dùng cho ${ACTIONS[used.get(key)]}`);used.set(key,action);}return true;
}
export function rebind(bindings,action,code){if(!ACTIONS[action])throw new Error('Hành động không hợp lệ');const next={...bindings,[action]:normalizeKey(code)};validateBindings(next);return next;}
export function mappedInput(rawKeys,bindings){const keys=new Set([...rawKeys].map(normalizeKey));return{move:[Number(keys.has(bindings.right))-Number(keys.has(bindings.left)),Number(keys.has(bindings.back))-Number(keys.has(bindings.forward))],jump:keys.has(bindings.jump),dash:keys.has(bindings.dash),interact:keys.has(bindings.interact),pulse:keys.has(bindings.pulse)};}
