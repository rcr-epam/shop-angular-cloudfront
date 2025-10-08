

export const ApiErrorRresponse = (statusCode: number, message: string, errorMessage?: string) => {
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
  return ApiErrorRresponse(400, 'bad Request', message );
};

export const NotFoundResponse = (message: string) => {
  return ApiErrorRresponse(404, 'Not Found', message);
}

export const InternalServerErrorResponse = (errorMessage?: string) => {
  return ApiErrorRresponse(500, 'internal Server Error', errorMessage); 
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const OKResponse = (data?: any) => {
  return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };
}  
  