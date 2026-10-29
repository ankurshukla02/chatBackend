export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  statusCode: number;
}

export const buildSuccessResponse = <T>(
  data: T,
  message = 'Success',
  statusCode = 200,
): ApiResponse<T> => ({
  success: true,
  message,
  data,
  statusCode,
});

export const buildErrorResponse = (
  message: string,
  statusCode = 500,
  data: null = null,
): ApiResponse<null> => ({
  success: false,
  message,
  data,
  statusCode,
});
