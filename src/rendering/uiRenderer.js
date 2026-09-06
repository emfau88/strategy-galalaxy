const text = (ctx, value, x, y, size, color, align = "left") => {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px Inter, system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
};

export const renderUiLayer = (ctx, model) => {
  const { width, height, state, debugEnabled, testMode, lastInput } = model;
  ctx.fillStyle = "rgba(4, 12, 28, 0.74)";
  ctx.fillRect(16, 16, width - 32, 86);
  text(ctx, "STRATEGY GALALAXY", width / 2, 50, 18, "#d9f4ff", "center");
  text(ctx, model.simulation ? "Headless lane combat" : "Canvas foundation", width / 2, 76, 12, "#7fd2ff", "center");

  text(ctx, "LEFT LANE", width * 0.29, 137, 10, "#84d7ff", "center");
  text(ctx, "RIGHT LANE", width * 0.71, 137, 10, "#84d7ff", "center");
  const activeUnits = model.simulation?.state.units.size ?? 0;
  text(ctx, model.simulation ? `${activeUnits} units · automatic test battle` : "RENDER LAYERS READY", width / 2, height / 2, 12, "rgba(218, 244, 255, 0.52)", "center");

  if (lastInput) {
    text(ctx, `Input: ${Math.round(lastInput.x)}, ${Math.round(lastInput.y)}`, width / 2, height - 94, 11, "#b6eaff", "center");
  } else {
    text(ctx, "Tap or click to verify design-space input", width / 2, height - 94, 11, "#b6eaff", "center");
  }
  text(ctx, state, width / 2, height - 68, 11, "#829cc4", "center");
  if (model.simulation) text(ctx, `Cycle ${model.cycle} · ${model.phaseRemaining.toFixed(1)}s`, width / 2, height - 48, 11, "#b6eaff", "center");
  if (model.economy) {
    const playerEnergy = Math.floor(model.economy.get("TEAM_PLAYER").energy);
    const enemyEnergy = Math.floor(model.economy.get("TEAM_ENEMY").energy);
    text(ctx, `Energy  P ${playerEnergy}  ·  E ${enemyEnergy}`, width / 2, 120, 11, "#d9f4ff", "center");
  }

  if (debugEnabled || testMode) {
    ctx.fillStyle = "rgba(5, 16, 34, 0.82)";
    ctx.fillRect(16, height - 34, width - 32, 18);
    const label = testMode ? "TEST MODE: match harness ready" : "DEBUG MODE";
    text(ctx, label, 28, height - 21, 10, "#f9d783");
  }
};
