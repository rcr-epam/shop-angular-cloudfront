// lambda function to create a new product  in the products database table
/* eslint-disable @typescript-eslint/no-explicit-any */
import { APIGatewayProxyHandler } from 'aws-lambda';
import { createProduct } from './data-access';
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  CreatedResponse,
} from '../utils/utils';
import { Product } from '../domain/product';
import { validate } from 'uuid';

/**
 * Lambda function handler to create a new product.  Delegates to createProduct in data-access.ts.
 *
 * @param event - API Gateway event
 * @returns  APIGateway Proxy Result
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Create Product :', JSON.stringify(event, null, 2));
  try {
    if (!event.body) {
      return BadRequestResponse('Request body is required');
    }
    const productData = JSON.parse(event.body) as Product;
    const isValid = validate(productData.id);
    if (!isValid) {
      return BadRequestResponse('Invalid product ID format');
    }
    const { product, error } = await createProduct(productData);
    if (error) {
      console.error('Error creating product:', error);
      return InternalServerErrorResponse();
    }
    return CreatedResponse(product);
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return InternalServerErrorResponse();
  }
};
