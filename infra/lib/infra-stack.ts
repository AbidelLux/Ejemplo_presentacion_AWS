import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    const securityGroup = new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.allTraffic());
    securityGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.allTraffic());

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'dnf update -y',
      'dnf install -y git docker',
      'systemctl enable --now docker',
      'usermod -aG docker ec2-user',
    );

    const instance = new ec2.Instance(this, 'DemoInstance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup,
      keyName: process.env.EC2_KEY_NAME,
      userData,
    });

    const bucket = new s3.Bucket(this, 'UploadBucket', {
      bucketName: process.env.S3_BUCKET_NAME,
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new cdk.CfnOutput(this, 'InstancePublicIp', { value: instance.instancePublicIp });
    new cdk.CfnOutput(this, 'BucketWebsiteUrl', { value: bucket.bucketWebsiteUrl });
    new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
  }
}
