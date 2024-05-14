import { Context, util } from '@aws-appsync/utils'

export function request(ctx: Context) {
    return {
        operation: 'UpdateItem',
        key: util.dynamodb.toMapValues({
            id: ctx.arguments.id
        }),
        update: {
            expression: 'set #name = :name, #handlerLambda = :handlerLambda, #systemPrompt = :systemPrompt, #inputMaxToken = :inputMaxToken, #precedence = :precedence, #modelParams = :modelParams, #knowledgeBaseParams = :knowledgeBaseParams',
            expressionNames: {
                '#name': 'name',
                '#handlerLambda': 'handlerLambda',
                '#systemPrompt': 'systemPrompt',
                '#inputMaxToken': 'inputMaxToken',
                '#precedence': 'precedence',
                '#modelParams': 'modelParams',
                '#knowledgeBaseParams': 'knowledgeBaseParams'
            },
            expressionValues: util.dynamodb.toMapValues({
                ':name': ctx.arguments.config.name,
                ':handlerLambda': ctx.arguments.config.handlerLambda,
                ':systemPrompt': ctx.arguments.config.systemPrompt,
                ':inputMaxToken': ctx.arguments.config.inputMaxToken,
                ':precedence': ctx.arguments.config.precedence,
                ':modelParams': ctx.arguments.config.modelParams,
                ':knowledgeBaseParams': ctx.arguments.config.knowledgeBaseParams
            })
        }
    }
}

export function response(ctx: Context) {
    return ctx.result
}
