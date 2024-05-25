import { util } from '@aws-appsync/utils';
import { Context } from '@aws-appsync/utils';

/**
 * Update Item Resolver
 * @param ctx - AppSync Context
 * @returns UpdateItem request
 */
export function request(ctx: Context) {
  const { id, config } = ctx.arguments;

  const values = { ...config };

  return dynamodbUpdateRequest({ keys: { id }, values });
}

export function response(ctx: Context) {
  return ctx.result;
}

/**
 * Helper function to create an UpdateItem request
 * @param params - Parameters for the UpdateItem request
 * @returns UpdateItem request
 */
function dynamodbUpdateRequest(params: { keys: any, values: any }) {
  const { keys, values } = params;

  const sets: string[] = [];
  const removes: string[] = [];
  const expressionNames: { [key: string]: string } = {};
  const expValues: { [key: string]: any } = {};

  for (const [key, value] of Object.entries(values)) {
    expressionNames[`#${key}`] = key;
    if (value !== undefined && value !== null) {
      sets.push(`#${key} = :${key}`);
      expValues[`:${key}`] = value;
    } else {
      removes.push(`#${key}`);
    }
  }

  let expression = sets.length ? `SET ${sets.join(', ')}` : '';
  expression += removes.length ? ` REMOVE ${removes.join(', ')}` : '';

  return {
    operation: 'UpdateItem',
    key: util.dynamodb.toMapValues(keys),
    update: {
      expression,
      expressionNames,
      expressionValues: util.dynamodb.toMapValues(expValues),
    },
  };
}
