import { describe, expect, it } from 'vitest';

import { describeRepositoryError } from './repositoryErrorMessages';

describe('describeRepositoryError', () => {
  it('names the rules when the database refuses a write', () => {
    expect(describeRepositoryError({ code: 'permission-denied' })).toContain('security rules');
  });

  it('reassures rather than alarms when there is no connection', () => {
    expect(describeRepositoryError({ code: 'unavailable' })).toContain('kept on the phone');
  });

  it('always says something, whatever was thrown', () => {
    expect(describeRepositoryError(new Error('boom'))).not.toBe('');
    expect(describeRepositoryError('a string')).not.toBe('');
    expect(describeRepositoryError(null)).not.toBe('');
  });

  it('never talks about signing in, which is a different subject', () => {
    expect(describeRepositoryError({ code: 'something-unmapped' })).not.toContain('Sign-in');
  });
});
