import { Alert } from './alerting-service';
import nodemailer from 'nodemailer';
import axios from 'axios';

export interface NotificationChannel {
  name: string;
  send(alert: Alert): Promise<boolean>;
  test(): Promise<boolean>;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  to: string[];
}

export interface SlackConfig {
  webhookUrl: string;
  channel: string;
  username?: string;
  iconEmoji?: string;
}

export interface PagerDutyConfig {
  integrationKey: string;
  apiUrl?: string;
}

/**
 * Email notification channel using SMTP
 */
export class EmailNotificationChannel implements NotificationChannel {
  public readonly name = 'email';
  private transporter: nodemailer.Transporter;

  constructor(private config: EmailConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth
    });
  }

  async send(alert: Alert): Promise<boolean> {
    try {
      const subject = this.formatEmailSubject(alert);
      const html = this.formatEmailBody(alert);

      await this.transporter.sendMail({
        from: this.config.from,
        to: this.config.to.join(', '),
        subject,
        html
      });

      console.log(`📧 Email alert sent: ${alert.name}`);
      return true;
    } catch (error) {
      console.error('Failed to send email alert:', error);
      return false;
    }
  }

  async test(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }

  private formatEmailSubject(alert: Alert): string {
    const severityEmoji = this.getSeverityEmoji(alert.severity);
    return `${severityEmoji} [${alert.severity.toUpperCase()}] ${alert.name}`;
  }

  private formatEmailBody(alert: Alert): string {
    const severityColor = this.getSeverityColor(alert.severity);
    
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: ${severityColor}; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 24px;">
                ${this.getSeverityEmoji(alert.severity)} Alert: ${alert.name}
              </h2>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">
                Severity: ${alert.severity.toUpperCase()} | Status: ${alert.status.toUpperCase()}
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #495057;">Alert Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 30%;">Description:</td>
                  <td style="padding: 8px 0;">${alert.description}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Timestamp:</td>
                  <td style="padding: 8px 0;">${alert.timestamp.toISOString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Current Value:</td>
                  <td style="padding: 8px 0;">${alert.value}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Threshold:</td>
                  <td style="padding: 8px 0;">${alert.threshold}</td>
                </tr>
              </table>
            </div>

            ${Object.keys(alert.labels).length > 0 ? `
            <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #495057;">Labels</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${Object.entries(alert.labels).map(([key, value]) => `
                  <tr>
                    <td style="padding: 4px 0; font-weight: bold; width: 30%;">${key}:</td>
                    <td style="padding: 4px 0;">${value}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
            ` : ''}

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #856404;">Next Steps</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Check the system dashboard for more details</li>
                <li>Review recent deployments or configuration changes</li>
                <li>Escalate to on-call engineer if critical</li>
                ${alert.annotations.runbook_url ? `<li><a href="${alert.annotations.runbook_url}" style="color: #007bff;">View runbook</a></li>` : ''}
              </ul>
            </div>

            <div style="text-align: center; padding: 20px; border-top: 1px solid #dee2e6; margin-top: 30px;">
              <p style="margin: 0; color: #6c757d; font-size: 12px;">
                Football Analytics System Alert | Alert ID: ${alert.id}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'warning': return '#fd7e14';
      case 'info': return '#17a2b8';
      default: return '#6c757d';
    }
  }
}

/**
 * Slack notification channel using webhooks
 */
export class SlackNotificationChannel implements NotificationChannel {
  public readonly name = 'slack';

  constructor(private config: SlackConfig) {}

  async send(alert: Alert): Promise<boolean> {
    try {
      const payload = this.formatSlackMessage(alert);
      
      await axios.post(this.config.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`💬 Slack alert sent: ${alert.name}`);
      return true;
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
      return false;
    }
  }

  async test(): Promise<boolean> {
    try {
      const testPayload = {
        channel: this.config.channel,
        username: this.config.username || 'Football Analytics Bot',
        icon_emoji: this.config.iconEmoji || ':warning:',
        text: 'Test notification from Football Analytics System',
        attachments: [{
          color: 'good',
          text: 'If you see this message, the Slack integration is working correctly.'
        }]
      };

      await axios.post(this.config.webhookUrl, testPayload);
      return true;
    } catch (error) {
      console.error('Slack configuration test failed:', error);
      return false;
    }
  }

  private formatSlackMessage(alert: Alert) {
    const color = this.getSeverityColor(alert.severity);
    const emoji = this.getSeverityEmoji(alert.severity);
    
    return {
      channel: this.config.channel,
      username: this.config.username || 'Football Analytics Bot',
      icon_emoji: this.config.iconEmoji || emoji,
      text: `${emoji} *${alert.severity.toUpperCase()} Alert*`,
      attachments: [
        {
          color,
          title: alert.name,
          text: alert.description,
          fields: [
            {
              title: 'Current Value',
              value: alert.value.toString(),
              short: true
            },
            {
              title: 'Threshold',
              value: alert.threshold.toString(),
              short: true
            },
            {
              title: 'Timestamp',
              value: alert.timestamp.toISOString(),
              short: false
            },
            ...Object.entries(alert.labels).map(([key, value]) => ({
              title: key,
              value: value,
              short: true
            }))
          ],
          footer: 'Football Analytics System',
          footer_icon: 'https://example.com/icon.png',
          ts: Math.floor(alert.timestamp.getTime() / 1000)
        }
      ]
    };
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return ':rotating_light:';
      case 'warning': return ':warning:';
      case 'info': return ':information_source:';
      default: return ':loudspeaker:';
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'good';
      default: return '#36a64f';
    }
  }
}

/**
 * PagerDuty notification channel for critical alerts
 */
export class PagerDutyNotificationChannel implements NotificationChannel {
  public readonly name = 'pagerduty';
  private readonly apiUrl: string;

  constructor(private config: PagerDutyConfig) {
    this.apiUrl = config.apiUrl || 'https://events.pagerduty.com/v2/enqueue';
  }

  async send(alert: Alert): Promise<boolean> {
    try {
      // Only send critical alerts to PagerDuty
      if (alert.severity !== 'critical') {
        console.log(`Skipping PagerDuty notification for ${alert.severity} alert`);
        return true;
      }

      const payload = this.formatPagerDutyEvent(alert);
      
      await axios.post(this.apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`📟 PagerDuty alert sent: ${alert.name}`);
      return true;
    } catch (error) {
      console.error('Failed to send PagerDuty alert:', error);
      return false;
    }
  }

  async test(): Promise<boolean> {
    try {
      const testPayload = {
        routing_key: this.config.integrationKey,
        event_action: 'trigger',
        dedup_key: 'test_alert_' + Date.now(),
        payload: {
          summary: 'Test alert from Football Analytics System',
          source: 'football-analytics-test',
          severity: 'info',
          component: 'alerting-system',
          group: 'test'
        }
      };

      await axios.post(this.apiUrl, testPayload);
      return true;
    } catch (error) {
      console.error('PagerDuty configuration test failed:', error);
      return false;
    }
  }

  private formatPagerDutyEvent(alert: Alert) {
    return {
      routing_key: this.config.integrationKey,
      event_action: alert.status === 'firing' ? 'trigger' : 'resolve',
      dedup_key: `alert_${alert.ruleId}`,
      payload: {
        summary: `${alert.name}: ${alert.description}`,
        source: 'football-analytics-system',
        severity: alert.severity,
        timestamp: alert.timestamp.toISOString(),
        component: alert.labels.service || 'unknown',
        group: 'football-analytics',
        class: alert.ruleId,
        custom_details: {
          alert_id: alert.id,
          current_value: alert.value,
          threshold: alert.threshold,
          labels: alert.labels,
          annotations: alert.annotations
        }
      },
      links: [
        {
          href: 'https://dashboard.example.com/alerts',
          text: 'View Dashboard'
        }
      ]
    };
  }
}

/**
 * Notification manager that handles multiple channels
 */
export class NotificationManager {
  private channels: Map<string, NotificationChannel> = new Map();

  /**
   * Register a notification channel
   */
  public registerChannel(channel: NotificationChannel): void {
    this.channels.set(channel.name, channel);
    console.log(`Registered notification channel: ${channel.name}`);
  }

  /**
   * Send alert to specified channels
   */
  public async sendAlert(alert: Alert, channelNames: string[]): Promise<void> {
    const promises = channelNames.map(async (channelName) => {
      const channel = this.channels.get(channelName);
      if (!channel) {
        console.error(`Notification channel not found: ${channelName}`);
        return false;
      }

      try {
        return await channel.send(alert);
      } catch (error) {
        console.error(`Failed to send alert via ${channelName}:`, error);
        return false;
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(Boolean).length;
    
    console.log(`Alert sent via ${successCount}/${channelNames.length} channels`);
  }

  /**
   * Test all registered channels
   */
  public async testAllChannels(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name, channel] of this.channels) {
      try {
        results[name] = await channel.test();
      } catch (error) {
        console.error(`Test failed for channel ${name}:`, error);
        results[name] = false;
      }
    }

    return results;
  }

  /**
   * Get all registered channel names
   */
  public getChannelNames(): string[] {
    return Array.from(this.channels.keys());
  }
}