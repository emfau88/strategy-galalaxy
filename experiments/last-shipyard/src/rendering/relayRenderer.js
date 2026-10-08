import { activeRelays, shieldRelays } from '../campaign/relayShield.js';

// One unedited transparent atlas: active frame left, disabled frame right.
export const renderRelays = (ctx, model) => {
  const state = model.simulation?.state;
  if (!state?.map.relayShield) return;
  const image = model.assets?.get('shield-relay-atlas');
  const projectY = y => model.camera.viewport.y + y - model.camera.y;
  const relays = shieldRelays(state), active = activeRelays(state);
  ctx.save();
  if (active.length) {
    const hq = state.structures.get('enemy-hq'), y = projectY(hq.y);
    ctx.strokeStyle = 'rgba(185,143,248,.5)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(hq.x, y, 136, 133, 0, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = 'rgba(163,113,245,.06)'; ctx.fill();
    ctx.setLineDash([3, 11]); ctx.strokeStyle = 'rgba(160,133,237,.22)';
    for (const relay of active) { ctx.beginPath(); ctx.moveTo(relay.x,projectY(relay.y)-41); ctx.lineTo(hq.x,y+100); ctx.stroke(); }
    ctx.setLineDash([]);
  }
  for (const relay of relays) {
    const y = projectY(relay.y), size = 88;
    if (image) { const half=image.naturalWidth/2; ctx.drawImage(image,relay.alive?0:half,0,half,image.naturalHeight,relay.x-size/2,y-size/2,size,size); }
    ctx.fillStyle='rgba(10,18,33,.92)'; ctx.fillRect(relay.x-49,y+46,98,18);
    ctx.fillStyle=relay.alive?'#c6a5ff':'#9faebf'; ctx.font='700 9px Inter, system-ui, sans-serif'; ctx.textAlign='center';
    ctx.fillText(relay.alive?'SCHILDRELAIS':'RELAIS AUS',relay.x,y+58);
    if(relay.alive) { ctx.fillStyle='#293346';ctx.fillRect(relay.x-30,y-49,60,4);ctx.fillStyle='#c6a5ff';ctx.fillRect(relay.x-30,y-49,60*relay.hp/relay.maxHp,4); }
  }
  ctx.restore();
};
