const AWS = require("aws-sdk");
const { customAlphabet } = require('nanoid');
const validator = require("validator")

const documentClient = new AWS.DynamoDB.DocumentClient();
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwyz', 7)

const tableName = "content";
const defaultTTL = 604800; // Default TTL in seconds (7 days)
const minimumTTL = 3600; // Minum TTL in seconds (1 hour)

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

    const item = {
            id,
            data: body["data"],
            buid: body["buid"],
            isEncrypted: body['isEncrypted'] || false,
            url
    };
    
    // Set TTL based on the "expire" flag in the request
    let ttl;
    if (body.hasOwnProperty('expire') && body['expire'] === false) {
        ttl = null; // No TTL attribute when 'expire' is explicitly false
    } else {
        // Check if a custom TTL is provided and meets the minimum requirement
        if (body.hasOwnProperty('ttl') && body['ttl'] >= minimumTTL) {
            ttl = Math.floor(Date.now() / 1000) + body['ttl'];
        } else {
            // Default to 7 days if no valid custom TTL is provided
            ttl = Math.floor(Date.now() / 1000) + defaultTTL;
        }
    }
    
    if (ttl){
        item.ttl = ttl;
    }
    
    const params = {
        TableName: tableName,
        Item: item,
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
