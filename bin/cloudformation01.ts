#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Cloudformation01Stack } from "../lib/cloudformation01-stack";

const app = new cdk.App();
new Cloudformation01Stack(app, "Cloudformation01Stack", {
  env: {
    account: "381492260472",
    region: "us-east-1",
  },
});
const props = {
  name: app.node.tryGetContext("name"),
  domainName: app.node.tryGetContext("domainName"),
  applicationTag: app.node.tryGetContext("applicationTag"),
  hostedZoneName: app.node.tryGetContext("hostedZone"),
  sourcePath: app.node.tryGetContext("sourcePath"),
  env: {
    account: app.node.tryGetContext("accountId"),
    region: app.node.tryGetContext("region"),
  },
  crossRegionReferences: true,
};

new Cloudformation01Stack(app, props.applicationTag, {
  ...props,
});

app.synth();
