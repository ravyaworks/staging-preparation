import { describe, it, expect } from 'vitest';
import { AppError, NotFoundError, ValidationError, ConfigurationError } from '../errors';

describe('AppError', () => {
  it('creates an error with default values', () => {
    const error = new AppError('Something went wrong', 'TEST_ERROR');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Something went wrong');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  it('creates an error with custom status code', () => {
    const error = new AppError('Not found', 'NOT_FOUND', 404);
    expect(error.statusCode).toBe(404);
  });
});

describe('NotFoundError', () => {
  it('creates a 404 error with resource name', () => {
    const error = new NotFoundError('User');
    expect(error.message).toBe('User not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });

  it('creates a 404 error with resource name and id', () => {
    const error = new NotFoundError('User', '123');
    expect(error.message).toBe("User with id '123' not found");
  });
});

describe('ValidationError', () => {
  it('creates a 400 error with message', () => {
    const error = new ValidationError('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
  });
});

describe('ConfigurationError', () => {
  it('creates a 500 non-operational error', () => {
    const error = new ConfigurationError('Missing env var');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(false);
  });
});
