import { buildErrorResponse, buildSuccessResponse } from './response.util';

describe('response util', () => {
  it('creates a success payload', () => {
    expect(buildSuccessResponse({ id: '1' }, 'User registered')).toEqual({
      success: true,
      message: 'User registered',
      data: { id: '1' },
      statusCode: 200,
    });
  });

  it('creates an error payload', () => {
    expect(buildErrorResponse('Email already exists', 409)).toEqual({
      success: false,
      message: 'Email already exists',
      data: null,
      statusCode: 409,
    });
  });
});
