import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export class SampleCdkApigatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // API Gatewayの作成
    const api = new apigateway.RestApi(this, "SampleMockApi", {
      restApiName: "Sample Mock API with API Key",
      description: "API Gateway with Mock Integration and API Key",
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      deployOptions: {
        stageName: "prod",
      },
    });

    // Mockインテグレーションの設定
    const mockIntegration = new apigateway.MockIntegration({
      integrationResponses: [
        {
          statusCode: "200",
          responseTemplates: {
            "application/json": JSON.stringify({
              message: "Hello from Mock API!",
              timestamp: "$context.requestTime",
              status: "success",
            }),
          },
        },
      ],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": '{"statusCode": 200}',
      },
    });

    // リソースとメソッドの追加
    const helloResource = api.root.addResource("crews");
    helloResource.addMethod("GET", mockIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: "200",
          responseModels: {
            "application/json": apigateway.Model.EMPTY_MODEL,
          },
        },
      ],
    });

    // APIキーの作成
    const apiKey = new apigateway.ApiKey(this, "SampleApiKey", {
      apiKeyName: "SampleMockApiKey",
      description: "API Key for Sample Mock API",
      enabled: true,
    });

    // 使用量プランの作成
    const usagePlan = api.addUsagePlan("SampleUsagePlan", {
      name: "SampleUsagePlan",
      description: "Usage plan for Sample Mock API",
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.MONTH,
      },
    });

    // 使用量プランにAPIキーを追加
    usagePlan.addApiKey(apiKey);

    // 使用量プランにAPIステージを関連付け
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // 出力
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway URL",
    });

    new cdk.CfnOutput(this, "ApiKeyId", {
      value: apiKey.keyId,
      description: "API Key ID",
    });
  }
}
