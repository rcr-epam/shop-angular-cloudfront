import { S3Event, S3EventRecord } from 'aws-lambda';
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
});

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

export const handler = async (event: S3Event): Promise<void> => {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));

  // Process records concurrently (In parallel)
  const promises = event.Records.map((record) => processS3Object(record));

  try {
    await Promise.all(promises);
    console.log('Successfully processed all files');
  } catch (error) {
    console.error('Error processing files:', error);
    throw error;
  }
};

// Process individual S3 object
async function processS3Object(record: S3EventRecord): Promise<void> {
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

  console.log(`Processing file: s3://${bucket}/${key}`);

  try {
    // Get the object from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(getObjectCommand);

    if (!response.Body) {
      throw new Error('Empty file body');
    }

    // Convert stream to string
    const csvContent = await streamToString(response.Body as Readable);

    // Parse CSV
    const products = parseCSV(csvContent);
    console.log(`Parsed ${products.length} products from ${key}`);

    products.forEach((product) => {
      console.log('Product:', JSON.stringify(product));
      // TODO: Persist or process product
    });

    // Optional: Move processed file to a different folder
    const processedKey = key.replace('uploaded/', 'processed/');

    // Copy to processed folder
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${key}`,
        Key: processedKey,
      }),
    );

    // Delete from uploaded folder
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    console.log(
      `Successfully processed and moved file to: s3://${bucket}/${processedKey}`,
    );
  } catch (error) {
    console.error(`Error processing file ${key}:`, error);

    // Optional: Move failed files to an error folder
    const errorKey = key.replace('uploaded/', 'error/');

    try {
      await s3Client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${key}`,
          Key: errorKey,
        }),
      );

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );

      console.log(`Moved failed file to: s3://${bucket}/${errorKey}`);
    } catch (moveError) {
      console.error('Failed to move file to error folder:', moveError);
    }

    throw error;
  }
}
// Helper function to convert stream to string
async function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

// Simple CSV parser
function parseCSV(csvContent: string): Product[] {
  const lines = csvContent.split('\n').filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  // First line is header
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const products: Product[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());

    if (values.length !== headers.length) {
      console.warn(`Skipping line ${i + 1}: column count mismatch`);
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product: any = {};
    headers.forEach((header, index) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = values[index];
      // Convert numeric fields
      if (header === 'price' || header === 'count') {
        value = parseFloat(value) || 0;
      }

      product[header] = value;
    });

    // Validate required fields
    if (product.id && product.title) {
      products.push(product as Product);
    } else {
      console.warn(
        `Skipping line ${i + 1}: missing required fields (id or title)`,
      );
    }
  }
  return products;
}
