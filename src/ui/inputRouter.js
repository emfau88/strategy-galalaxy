import { toDesignPoint } from "../core/viewport.js";

export class InputRouter {
  constructor(canvas, getTransform, onInput) {
    this.canvas = canvas;
    this.getTransform = getTransform;
    this.onInput = onInput;
    this.activePointerId = null;
    this.bound = {
      down: (event) => this.handlePointer("down", event),
      move: (event) => this.handlePointer("move", event),
      up: (event) => this.handlePointer("up", event),
      cancel: (event) => this.handlePointer("cancel", event),
    };
  }

  attach() {
    this.canvas.addEventListener("pointerdown", this.bound.down);
    this.canvas.addEventListener("pointermove", this.bound.move);
    this.canvas.addEventListener("pointerup", this.bound.up);
    this.canvas.addEventListener("pointercancel", this.bound.cancel);
  }

  destroy() {
    this.canvas.removeEventListener("pointerdown", this.bound.down);
    this.canvas.removeEventListener("pointermove", this.bound.move);
    this.canvas.removeEventListener("pointerup", this.bound.up);
    this.canvas.removeEventListener("pointercancel", this.bound.cancel);
  }

  handlePointer(kind, event) {
    if (kind === "down") {
      this.activePointerId = event.pointerId;
      this.canvas.setPointerCapture?.(event.pointerId);
      this.canvas.focus({ preventScroll: true });
    }
    if (this.activePointerId !== event.pointerId) return;
    const point = toDesignPoint(event.clientX, event.clientY, this.canvas.getBoundingClientRect(), this.getTransform());
    this.onInput({ kind, pointerType: event.pointerType, pointerId: event.pointerId, ...point });
    event.preventDefault();
    if (kind === "up" || kind === "cancel") this.activePointerId = null;
  }
}
