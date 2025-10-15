import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { fetchProducts } from './data-access';
import { InternalServerErrorResponse, OKResponse } from '../utils/utils';

/**
 * Handler function for fetching the list of products.
 * Most of the logic goes into the data-access module.
 * 
 * @param event API Gateway Proxy Event
 * @returns 
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Fetch Products List:', JSON.stringify(event, null, 2));

  const {products, error} = await fetchProducts();
  if (error) return InternalServerErrorResponse();  
  
  return OKResponse(products);
};


