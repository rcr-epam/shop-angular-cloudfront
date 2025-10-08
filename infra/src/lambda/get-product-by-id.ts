import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MOCK_PRODUCTS } from '../utils/mock-data';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const productId = event.pathParameters?.id;

    if (!productId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Bad Request',
          message: 'Product ID is required'
        })
      };
    }

    const product = MOCK_PRODUCTS.find(p => p.id === productId);

    if (!product) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Not Found',
          message: `Product with ID ${productId} not found`
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'  // Only this CORS header is needed
      },
      body: JSON.stringify({
        success: true,
        data: product
      })
    };
  } catch (error) {
    console.error('Error fetching product by ID:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
};
