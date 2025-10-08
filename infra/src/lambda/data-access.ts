/** ES6 Data access layer for interacting with DynamoDB products and stock tables 
 * Abstracted to its own module for easier testing and reuse.
 * 
 * @module data-access
 * 
 * */ 
import {
  DynamoDBClient,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Product, Stock } from '../domain/product';

// DynamoDB client and Document client initialization Only available for functions in this module
const dynamoDb = new DynamoDBClient();
const documentClient = DynamoDBDocumentClient.from(dynamoDb);

const productsTable = process.env.PRODUCTS_TABLE_NAME || 'products';
const stockTable = process.env.STOCKS_TABLE_NAME || 'stock';

/**
 * Fetches a product by its ID from the products table.
 * 
 * @param id The ID of the product to fetch
 * @returns The product if found, otherwise an error
 */
export async function fetchProductById(
  id: string,
): Promise<{ product?: Product; error?: Error }> {
  const command = new GetCommand({
    TableName: productsTable,
    Key: { id },
  });

  try {
    const result = await documentClient.send(command);
    if (result.Item === undefined) {
      console.log(`Product with ID ${id} not found.`);
      return { error: new Error('Product not found') };
    }
    return { product: unmarshall(result.Item) as Product };
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return { error: new Error('Could not fetch product') };
  }
}

/**
 * Fetches a list of products from the products table and merges in their stock counts from the stocks table.
 * 
 * @returns A list of products with their stock counts merged in
 */
export async function fetchProducts(): Promise<{
  products: Product[];
  error?: Error;
}> {
  const params: ScanCommandInput = {
    TableName: productsTable,
    Limit: 25,
  };

  try {
    const command = new ScanCommand(params);
    const result = await documentClient.send(command);
    const products = (result.Items ?? []).map(
      (item) => unmarshall(item) as Product,
    );

    // Fetch stock data and merge with products
    const { stocks, error: stockError } = await fetchStocks();
    if (stockError) {
      return { products: [], error: stockError };
    }
    // Update product counts based on stock data
    products.forEach((product) => {
      product.count = stocks[product.id] ?? 0;
    });

    return { products };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [], error: new Error('Could not fetch products') };
  }
}

/**
 * Fetches stock data from the stocks table and returns a map of product_id to count. 
 * This allows efficient lookup of stock counts when merging with product data.
 * 
 * @returns returns a map of product_id to count
 */
export async function fetchStocks(): Promise<{
  stocks: Record<string,number>;
  error?: Error;
}> {
  const params: ScanCommandInput = {
    TableName: stockTable,
    Limit: 25,
  };

  try {
    const command = new ScanCommand(params);
    const result = await documentClient.send(command);
    const stocks = (result.Items ?? []).map(
      (item) => unmarshall(item) as Stock,
    ).reduce(
      (acc, stock) => ((acc[stock.product_id] = stock.count), acc),
      {} as Record<string, number>,
    );
    return { stocks };
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return { stocks: {}, error: new Error('Could not fetch stocks') };
  }
}
