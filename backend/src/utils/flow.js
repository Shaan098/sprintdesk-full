// Board columns in order. A ticket may only move one column at a time.
const FLOW = ['todo', 'in_progress', 'in_review', 'done'];

const isValidMove = (from, to) => {
  const a = FLOW.indexOf(from);
  const b = FLOW.indexOf(to);
  return a !== -1 && b !== -1 && Math.abs(a - b) === 1;
};

module.exports = { FLOW, isValidMove };
