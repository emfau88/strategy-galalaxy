export const createIdFactory = (prefix = "entity") => {
  let nextId = 1;
  return Object.freeze({
    next() {
      const id = `${prefix}-${nextId}`;
      nextId += 1;
      return id;
    },
    reset() {
      nextId = 1;
    },
  });
};
