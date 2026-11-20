export function frameMetrics(samples){
 if(!samples.length||samples.some(n=>!Number.isFinite(n)||n<=0))throw new Error('Frame intervals must be positive finite numbers');
 const sorted=[...samples].sort((a,b)=>a-b),count=samples.length,k=Math.max(1,Math.ceil(.01*count));
 const sum=samples.reduce((total,n)=>total+n,0),slow=sorted.slice(-k).reduce((total,n)=>total+n,0)/k;
 return {avg_fps:1000*count/sum,p1_low_fps:1000/slow,frame_ms_p95:sorted[Math.ceil(.95*count)-1],frames:count};
}
