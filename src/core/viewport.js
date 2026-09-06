const finiteNonNegative = (value) => Math.max(0, Number.isFinite(value) ? value : 0);

export const computeViewportTransform = ({
  viewportWidth,
  viewportHeight,
  safeTop = 0,
  safeRight = 0,
  safeBottom = 0,
  safeLeft = 0,
  devicePixelRatio = 1,
  maxDevicePixelRatio = 2,
  designWidth,
  designHeight,
}) => {
  const safe = {
    top: finiteNonNegative(safeTop),
    right: finiteNonNegative(safeRight),
    bottom: finiteNonNegative(safeBottom),
    left: finiteNonNegative(safeLeft),
  };
  const width = Math.max(1, finiteNonNegative(viewportWidth) - safe.left - safe.right);
  const height = Math.max(1, finiteNonNegative(viewportHeight) - safe.top - safe.bottom);
  const scale = Math.min(width / designWidth, height / designHeight);
  const contentWidth = designWidth * scale;
  const contentHeight = designHeight * scale;

  return Object.freeze({
    designWidth,
    designHeight,
    viewportWidth: finiteNonNegative(viewportWidth),
    viewportHeight: finiteNonNegative(viewportHeight),
    safe,
    availableWidth: width,
    availableHeight: height,
    scale,
    offsetX: safe.left + (width - contentWidth) / 2,
    offsetY: safe.top + (height - contentHeight) / 2,
    contentWidth,
    contentHeight,
    devicePixelRatio: Math.max(1, Math.min(finiteNonNegative(devicePixelRatio) || 1, maxDevicePixelRatio)),
  });
};

export const toDesignPoint = (clientX, clientY, canvasRect, transform) => ({
  x: (clientX - canvasRect.left - transform.offsetX) / transform.scale,
  y: (clientY - canvasRect.top - transform.offsetY) / transform.scale,
});
