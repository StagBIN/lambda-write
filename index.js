const AWS = require("aws-sdk");
const { customAlphabet } = require('nanoid');
const validator = require("validator")

const documentClient = new AWS.DynamoDB.DocumentClient();
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwyz', 7)

const tableName = "content";

exports.handler = async(event) => {
    const body = JSON.parse(event['body']);
    var id = "";
    var url = validator.isURL(body.data);
    
    if (!body.data) {
        return {
            statusCode: 400,
            body: JSON.stringify({error: "Empty data"})
        };
    }

    !body["id"] ?
        id = nanoid() : id = body["id"];

    const params = {
        TableName: tableName,
        Item: {
            id,
            data: body["data"],
            buid: body["buid"],
            isEncrypted: body['isEncrypted'] || false,
            url
        },
        ConditionExpression: "#id <> :id",
        ExpressionAttributeNames: {
            "#id": "id"
        },
        ExpressionAttributeValues: {
            ":id": id
        }
    };

    try {
        await documentClient.put(params).promise();
    }
    catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: e })
        };
    }

    const response = {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(params.Item),
    };
    return response;
};
