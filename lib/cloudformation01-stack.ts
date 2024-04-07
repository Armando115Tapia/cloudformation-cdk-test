import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CfnDistribution,
  CfnOriginAccessControl,
  CloudFrontAllowedCachedMethods,
  CloudFrontAllowedMethods,
  CloudFrontWebDistribution,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { BlockPublicAccess, Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";

export interface InfraStackProps extends cdk.StackProps {
  name: string;
  domainName: string;
  sourcePath: string;
}

export class Cloudformation01Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    const bucketName = `${props.name}-bucket`;
    const contentBucket = new Bucket(this, "StaticWebsiteBucket", {
      bucketName: bucketName,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    if (props.sourcePath !== undefined) {
      new BucketDeployment(this, "UploadContent", {
        sources: [Source.asset(props.sourcePath)],
        destinationBucket: contentBucket,
      });
    }

    const oac = new CfnOriginAccessControl(this, "OAC", {
      originAccessControlConfig: {
        name: `${props.name}-oac`,
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      },
    });

    const cloudFrontDistribution = new CloudFrontWebDistribution(this, "StaticWebsiteDistribution", {
      originConfigs: [
        {
          s3OriginSource: { s3BucketSource: contentBucket },
          behaviors: [
            {
              isDefaultBehavior: true,
              allowedMethods: CloudFrontAllowedMethods.ALL,
              compress: true,
              cachedMethods: CloudFrontAllowedCachedMethods.GET_HEAD,
              viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
              minTtl: cdk.Duration.seconds(0),
              maxTtl: cdk.Duration.seconds(86400),
              defaultTtl: cdk.Duration.seconds(3600),
            },
          ],
        },
      ],
    });

    const cfnDistribution = cloudFrontDistribution.node.defaultChild as CfnDistribution;
    cfnDistribution.addPropertyOverride("DistributionConfig.Origins.0.OriginAccessControlId", oac.getAtt("Id"));
  }
}
