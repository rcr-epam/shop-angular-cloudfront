export const ApiErrorRresponse = (
  statusCode: number,
  message: string,
  errorMessage?: string,
) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      success: false,
      message,
      errorMessage,
    }),
  };
};

export const BadRequestResponse = (message: string) => {
  return ApiErrorRresponse(400, 'bad Request', message);
};

export const NotFoundResponse = (message: string) => {
  return ApiErrorRresponse(404, 'Not Found', message);
};

export const InternalServerErrorResponse = (errorMessage?: string) => {
  return ApiErrorRresponse(500, 'internal Server Error', errorMessage);
};

export const OKResponse = (data?: unknown) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
};

export const CreatedResponse = (data?: unknown) => {
  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
};

/**
 * Simple validation function to check if the provided data has the required fields for a Product.
 * This is a basic check and can be extended as needed.
 *
 * @param data Product data to validate
 * @returns  true if valid, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ValidateProductData = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
): data is {
  title: string;
  description: string;
  price: number;
  count: number;
} => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const { title, description, price, count } = data;
  return (
    typeof title === 'string' &&
    typeof description === 'string' &&
    typeof price === 'number' &&
    typeof count === 'number'
  );
};
