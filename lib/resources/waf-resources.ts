import { aws_wafv2 as waf } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * WAF that can be attached to the ALB of the scanner agent
 */
export class WafResources extends Construct {
    public webACL: waf.CfnWebACL;

    constructor(scope: Construct, id: string, props: any) {
        super(scope, id);

        this.webACL = new waf.CfnWebACL(this, 'av-scanner-waf', {
            defaultAction: {
                allow: {
                  customRequestHandling: {
                    insertHeaders: [{
                      name: 'x-top-scanner-agent',
                      value: 'debugging-mode',
                    }],
                  },
                },
              },
              scope: 'REGIONAL',
              visibilityConfig: {
                cloudWatchMetricsEnabled: false,
                metricName: 'av-scanner-waf-metric',
                sampledRequestsEnabled: false,
              },
          
              description: 'AV scanner agent WAF',
              name: 'av-scanner-agent-WAF'
        })
    }
}

