const ring = (count, radius, cx = 0, cz = 0, start = 0, y = 0, spacing = 360 / count) =>
  Array.from({ length: count }, (_, i) => {
    const a = (start + i * spacing) * Math.PI / 180;
    return [cx + Math.cos(a) * radius, y, cz + Math.sin(a) * radius];
  });
const lamps = positions => positions.map((pos, i) => ({ id: `L${i + 1}`, pos, lit: false, deposited: 0 }));
export const NIGHTS = {
  1: { name: 'Đảo Bến', duration: 240, shadeInterval: 480, shadeCap: 6, shadeSpeed: 4,
    islands: [[0, 0, 40]], pads: [],
    lanterns: lamps([[0,0,25],[23.8,0,7.7],[14.7,0,-20.2],[-14.7,0,-20.2],[-23.8,0,7.7]]),
    motePoints: [...ring(8,12), ...ring(16,33)], shadePoints: ring(12,37,0,0,15), charms: [] },
  2: { name: 'Đảo Cau', duration: 270, shadeInterval: 420, shadeCap: 8, shadeSpeed: 4,
    islands: [[0,0,28],[70,0,28]], pads: [{ pos:[20,0,18], vy:14, speed:24, target:[70,0,0] }, { pos:[50,0,-18], vy:14, speed:24, target:[0,0,0] }],
    lanterns: lamps([[0,0,20],[17,0,-10],[-17,0,-10],[70,0,20],[87,0,-10],[53,0,-10]]),
    motePoints: [...ring(4,10),...ring(8,22),...ring(4,10,70),...ring(8,22,70)],
    shadePoints: [...ring(8,26,0,0,22.5),...ring(8,26,70,0,22.5)], charms:[{id:'C1',pos:[35,0,0]}] },
  3: { name: 'Đảo Chuông', duration: 300, shadeInterval: 360, shadeCap: 10, shadeSpeed: 4.5,
    islands: [[0,0,45]], pads:[{pos:[0,3,13],vy:12,speed:8,target:[0,3,0]}],
    lanterns: lamps([[0,6,6],[18,3,10],[-18,3,10],[35,0,-10],[-35,0,-10],[20,0,-35],[-20,0,-35]]),
    motePoints:[...ring(18,34),...ring(8,18,0,0,20,3,20),...ring(4,5,0,0,45,6)],
    shadePoints:ring(16,43), charms:[{id:'C1',pos:[30,0,25]},{id:'C2',pos:[-30,0,25]}] },
};
export function onIsland(night, x, z) {
  const map = NIGHTS[night];
  return map.islands.some(([cx,cz,r])=>Math.hypot(x-cx,z-cz)<=r)
    || (night===2 && x>=26 && x<=44 && Math.abs(z)<=2);
}
function ramp(x,z) {
  for (const deg of [30,150]) {
    const a=deg*Math.PI/180, along=x*Math.cos(a)+z*Math.sin(a), side=-x*Math.sin(a)+z*Math.cos(a);
    if (along>=24 && along<=30 && Math.abs(side)<=1.5) return (30-along)/2;
  }
  return null;
}
export function surfaces(night,x,z) {
  if (!onIsland(night,x,z)) return [];
  const result=[0];
  if (night===3) {
    const r=Math.hypot(x,z), slope=ramp(x,z);
    if (slope!==null) result.push(slope);
    if (z>0 && r>=12 && r<=24) result.push(3);
    if (r<=8) result.push(6);
  }
  return result;
}
export function support(night,x,z,y) {
  const below=surfaces(night,x,z).filter(h=>h<=y+1e-6);
  return below.length ? Math.max(...below) : -Infinity;
}
export function blocked(night,from,to) {
  if (night!==3) return false;
  const r=Math.hypot(to[0],to[2]);
  if (r<2 && to[1]>=6-1e-6 && to[1]<14) return true;
  // Elevated platforms have vertical sides; a player starting below a platform may walk underneath.
  if (Math.hypot(from[0],from[2])>8 && r<=8 && from[1]<6-1e-6 && from[1]>0.1) return true;
  const fromR=Math.hypot(from[0],from[2]);
  const wasTier1=from[2]>0 && fromR>=12 && fromR<=24;
  const entersTier1=to[2]>0 && r>=12 && r<=24 && !wasTier1;
  if (entersTier1 && from[1]<3-0.11 && ramp(from[0],from[2])===null) return true;
  return false;
}
