import { TEAM } from '../core/constants.js';

export const shieldRelays = state => [...state.structures.values()].filter(s => s.structureType === 'relay' && s.team === TEAM.ENEMY);
export const activeRelays = state => state.map.relayShield ? shieldRelays(state).filter(s => s.alive) : [];
export const carrierProtected = (state, entity) => entity?.structureType === 'hq' && entity.team === TEAM.ENEMY && activeRelays(state).length > 0;
export const laneWaitingForShield = (state, unit) => unit.team === TEAM.PLAYER && activeRelays(state).length > 0
  && !activeRelays(state).some(s => s.laneId === unit.laneId);
