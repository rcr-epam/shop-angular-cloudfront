import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { fetchProductById } from './data-access';
import { BadRequestResponse, InternalServerErrorResponse, NotFoundResponse, OKResponse } from '../utils/utils';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log('Fetch Product by Id :', JSON.stringify(event, null, 2));

  try {
    const productId = event.pathParameters?.id;
    if (!productId) {
      return BadRequestResponse('Product ID is required in path parameters');
    }
    const { product, error } = await fetchProductById(productId);
    
    if (error) return InternalServerErrorResponse();

    if (!product) return NotFoundResponse(`Product with ID ${productId} not found`);
  
    return OKResponse(product);
  
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return InternalServerErrorResponse();
  }
};
