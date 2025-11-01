import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  BadRequestResponse,
  InternalServerErrorResponse,
} from '../utils/utils';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
});

// S3 bucket name - should be set as environment variable
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// URL expiration time in seconds (default: 5 minutes)
const URL_EXPIRATION = parseInt(process.env.URL_EXPIRATION || '300');

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    // Extract fileName from query string parameters
    const fileName = event.queryStringParameters?.fileName;

    // Validate fileName parameter
    if (!fileName) {
      return BadRequestResponse('Missing required parameter: fileName');
    }

    // Validate bucket name is configured
    if (!BUCKET_NAME) {
      console.error('S3_BUCKET_NAME environment variable is not set');
      return InternalServerErrorResponse('Server configuration error');
    }

    // Validate file extension (optional - ensure it's a CSV)
    if (!fileName.toLowerCase().endsWith('.csv')) {
      return BadRequestResponse(
        'Invalid file type. Only CSV files are allowed',
      );
    }

    // Create the S3 key with the specified pattern
    const s3Key = `uploaded/${fileName}`;

    // Create the PutObject command
    const putObjectCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: 'text/csv',
    });

    // Generate pre-signed URL
    const signedUrl = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: URL_EXPIRATION,
    });

    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        url: signedUrl,
      }),
    };
  } catch (error) {
    console.error('Error generating signed URL:', error);

    return InternalServerErrorResponse('Failed to generate upload URL');
  }
};
