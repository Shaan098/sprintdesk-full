const { isValidMove } = require('../src/utils/flow');

describe('board flow rules', () => {
  test('allows one step forward', () => {
    expect(isValidMove('todo', 'in_progress')).toBe(true);
    expect(isValidMove('in_review', 'done')).toBe(true);
  });
  test('allows one step back', () => {
    expect(isValidMove('done', 'in_review')).toBe(true);
  });
  test('blocks skipping columns', () => {
    expect(isValidMove('todo', 'done')).toBe(false);
    expect(isValidMove('in_progress', 'done')).toBe(false);
  });
  test('blocks unknown statuses and no-op moves', () => {
    expect(isValidMove('todo', 'archived')).toBe(false);
    expect(isValidMove('todo', 'todo')).toBe(false);
  });
});
