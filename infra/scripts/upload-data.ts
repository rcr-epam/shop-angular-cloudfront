/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import * as path from 'path';
import { readFileSync } from 'fs';


// Load JSON data files
function loadTestData() {
  const productsData = JSON.parse(
    readFileSync(path.join(__dirname, 'products-data.json'), 'utf8')
  );
  const stockData = JSON.parse(
    readFileSync(path.join(__dirname, 'stock-data.json'), 'utf8')
  );
  
  return { productsData, stockData };
}

// Upload function 
async function batchUpload(docClient: DynamoDBDocumentClient, tableName: string, items: any[]) {
  console.log(`📦 Uploading ${items.length} items to ${tableName}...`);
  
  // Split into chunks
  // DynamoDB batch write limit is 25 items
  const chunks = [];
  for (let i = 0; i < items.length; i += 25) {
    chunks.push(items.slice(i, i + 25));
  }

  let totalUploaded = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const putRequests = chunk.map(item => ({
      PutRequest: { Item: item }
    }));

    try {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: putRequests
        }
      }));
      totalUploaded += chunk.length;
      
    } catch (error: Error | any) {
      console.error(`   ❌ Error uploading batch ${i + 1}:`, error.message);
      throw error;
    }
  }

  console.log(`✅  Successfully uploaded ${totalUploaded} items to ${tableName}\n`);
  return totalUploaded;
}

async function uploadTestData() {
  try {
    
    console.log('🚀 Starting test data upload...\n');
    
    const { productsData, stockData } = loadTestData();

    // Configure AWS region (change as needed)
    const client = new DynamoDBClient({ region: 'us-east-2' });
    const docClient = DynamoDBDocumentClient.from(client);

    
    // Insert products first
    await batchUpload(docClient, 'products', productsData);
    // Instert stock data
    await batchUpload(docClient, 'stock', stockData);
    
    console.log(`   - Products: ${productsData.length} items`);
    console.log(`   - Stock: ${stockData.length} items`);
    
  } catch (error) {
    console.error('💥 Upload failed:', error);
    process.exit(1);
  } 
}

// Run the upload
uploadTestData().catch(console.error);