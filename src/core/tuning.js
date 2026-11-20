export const TUNING = Object.freeze({
  player_speed:6, carry_capacity:10, lantern_cost:10, lantern_count_night1:5,
  pickup_radius:1, interact_radius:2, pulse_cost:3, pulse_radius:5,
  night1_duration_s:240, night2_duration_s:270, night3_duration_s:300,
  flames:3, invuln_s:1.5, hit_drop_ratio:.5, pulse_stun_s:2, pulse_push_m:4,
  pulse_cooldown_s:3, safe_radius:6, shade_speed:4, shade_hit_radius:1,
  fall_enabled:true, dash_speed:14, dash_duration_s:.2, dash_cooldown_s:1.5,
  fuel_max:100, fuel_decay_per_s:1, fuel_per_mote:10, relight_cost:5, win_ratio:.6,
  drain_per_s:5, low_fuel_threshold:30, capacity_max:20,
  score:Object.freeze({per_mote:5,per_lantern:100,per_relight:40,per_stun:5,per_drain_stun:15,per_second_left:0,per_flame_left:50,per_lantern_at_dawn:50,per_fuel_at_dawn:1}),
});
export const PALETTE={sky:'#0E1430',fog:'#1B2350',grass:'#2F5D50',sand:'#C9B48A',wood:'#6B4A2F',sea:'#12384A',
  lit:'#FFB347',core:'#FFE9B0',unlit:'#5B5F6E',mote:'#FFF6C2',halo:'#FFE58A',shade:'#120A1A',rim:'#7A3CFF',
  stunned:'#3A3450',shirt:'#E8E2D0',red:'#C8102E',gold:'#F2C14E',drifter:'#8FA3B8',danger:'#FF5A5F',text:'#F5F1E6'};
