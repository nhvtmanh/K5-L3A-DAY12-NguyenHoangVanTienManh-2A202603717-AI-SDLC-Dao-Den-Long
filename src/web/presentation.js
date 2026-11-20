export function lanternPresentation(lantern, simTick) {
  const weak=lantern.lit && lantern.fuelUnits<1800;
  const blinkOn=!weak || Math.floor(simTick/30)%2===0;
  return { paperScale:lantern.lit?1:.8, torn:!lantern.lit, weak, blinkOn,
    barVisible:lantern.lit&&blinkOn, fuelRatio:lantern.lit?lantern.fuelUnits/6000:0 };
}
export const shadeAccent=colorblind=>colorblind?'#00B3FF':'#7A3CFF';
