import { 
  EmailNotificationChannel, 
  SlackNotificationChannel, 
  PagerDutyNotificationChannel,
  NotificationManager,
  EmailConfig,
  SlackConfig,
  PagerDutyConfig
} from '../../core/notification-channels';
import { Alert } from '../../core/alerting-service';
import nodemailer from 'nodemailer';
import axios from 'axios';

// Mock dependencies
jest.mock('nodemailer');
jest.mock('axios');

describe('Notification Channels', () => {
  let mockAlert: Alert;

  beforeEach(() => {
    mockAlert = {
      id: 'test_alert_123',
      ruleId: 'test_rule',
      name: 'Test Alert',
      description: 'This is a test alert',
      severity: 'warning',
      status: 'firing',
      timestamp: new Date('2024-01-01T12:00:00Z'),
      value: 85,
      threshold: 80,
      labels: {
        service: 'api',
        instance: 'main'
      },
      annotations: {
        summary: 'Test alert summary',
        description: 'Test alert description',
        runbook_url: 'https://docs.example.com/runbooks/test'
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('EmailNotificationChannel', () => {
    let emailChannel: EmailNotificationChannel;
    let mockTransporter: any;
    let emailConfig: EmailConfig;

    beforeEach(() => {
      emailConfig = {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'alerts@example.com',
          pass: 'password123'
        },
        from: 'alerts@example.com',
        to: ['admin@example.com', 'ops@example.com']
      };

      mockTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
        verify: jest.fn().mockResolvedValue(true)
      };

      (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
      
      emailChannel = new EmailNotificationChannel(emailConfig);
    });

    it('should send email alerts successfully', async () => {
      const result = await emailChannel.send(mockAlert);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: emailConfig.from,
        to: emailConfig.to.join(', '),
        subject: expect.stringContaining('Test Alert'),
        html: expect.stringContaining('Test Alert')
      });
    });

    it('should format email subject correctly', async () => {
      await emailChannel.send(mockAlert);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.subject).toBe('⚠️ [WARNING] Test Alert');
    });

    it('should include alert details in email body', async () => {
      await emailChannel.send(mockAlert);

      const sentEmail = mockTransporter.sendMail.mock.calls[0][0];
      expect(sentEmail.html).toContain('Test Alert');
      expect(sentEmail.html).toContain('This is a test alert');
      expect(sentEmail.html).toContain('85');
      expect(sentEmail.html).toContain('80');
      expect(sentEmail.html).toContain('2024-01-01T12:00:00.000Z');
    });

    it('should handle email sending errors', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await emailChannel.send(mockAlert);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send email alert:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should test email configuration', async () => {
      const result = await emailChannel.test();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle email configuration test failures', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await emailChannel.test();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Email configuration test failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('SlackNotificationChannel', () => {
    let slackChannel: SlackNotificationChannel;
    let slackConfig: SlackConfig;

    beforeEach(() => {
      slackConfig = {
        webhookUrl: 'https://hooks.slack.com/services/TEST/WEBHOOK/URL',
        channel: '#alerts',
        username: 'Football Analytics Bot',
        iconEmoji: ':warning:'
      };

      slackChannel = new SlackNotificationChannel(slackConfig);
      (axios.post as jest.Mock).mockResolvedValue({ status: 200 });
    });

    it('should send Slack alerts successfully', async () => {
      const result = await slackChannel.send(mockAlert);

      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        slackConfig.webhookUrl,
        expect.objectContaining({
          channel: '#alerts',
          username: 'Football Analytics Bot',
          icon_emoji: ':warning:',
          text: expect.stringContaining('WARNING Alert')
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    });

    it('should format Slack message correctly', async () => {
      await slackChannel.send(mockAlert);

      const sentMessage = (axios.post as jest.Mock).mock.calls[0][1];
      expect(sentMessage.attachments).toHaveLength(1);
      
      const attachment = sentMessage.attachments[0];
      expect(attachment.title).toBe('Test Alert');
      expect(attachment.text).toBe('This is a test alert');
      expect(attachment.color).toBe('warning');
      expect(attachment.fields).toContainEqual({
        title: 'Current Value',
        value: '85',
        short: true
      });
    });

    it('should handle Slack sending errors', async () => {
      (axios.post as jest.Mock).mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await slackChannel.send(mockAlert);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send Slack alert:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should test Slack configuration', async () => {
      const result = await slackChannel.test();

      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        slackConfig.webhookUrl,
        expect.objectContaining({
          text: 'Test notification from Football Analytics System'
        })
      );
    });
  });

  describe('PagerDutyNotificationChannel', () => {
    let pagerDutyChannel: PagerDutyNotificationChannel;
    let pagerDutyConfig: PagerDutyConfig;

    beforeEach(() => {
      pagerDutyConfig = {
        integrationKey: 'test-integration-key-123'
      };

      pagerDutyChannel = new PagerDutyNotificationChannel(pagerDutyConfig);
      (axios.post as jest.Mock).mockResolvedValue({ status: 202 });
    });

    it('should send critical alerts to PagerDuty', async () => {
      const criticalAlert = { ...mockAlert, severity: 'critical' as const };
      
      const result = await pagerDutyChannel.send(criticalAlert);

      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://events.pagerduty.com/v2/enqueue',
        expect.objectContaining({
          routing_key: 'test-integration-key-123',
          event_action: 'trigger',
          payload: expect.objectContaining({
            summary: expect.stringContaining('Test Alert'),
            severity: 'critical'
          })
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    });

    it('should skip non-critical alerts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const result = await pagerDutyChannel.send(mockAlert); // warning severity

      expect(result).toBe(true);
      expect(axios.post).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Skipping PagerDuty notification for warning alert'
      );

      consoleSpy.mockRestore();
    });

    it('should format PagerDuty event correctly', async () => {
      const criticalAlert = { ...mockAlert, severity: 'critical' as const };
      
      await pagerDutyChannel.send(criticalAlert);

      const sentEvent = (axios.post as jest.Mock).mock.calls[0][1];
      expect(sentEvent.payload.custom_details).toEqual({
        alert_id: mockAlert.id,
        current_value: mockAlert.value,
        threshold: mockAlert.threshold,
        labels: mockAlert.labels,
        annotations: mockAlert.annotations
      });
    });

    it('should handle PagerDuty sending errors', async () => {
      const criticalAlert = { ...mockAlert, severity: 'critical' as const };
      (axios.post as jest.Mock).mockRejectedValue(new Error('API error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await pagerDutyChannel.send(criticalAlert);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send PagerDuty alert:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should test PagerDuty configuration', async () => {
      const result = await pagerDutyChannel.test();

      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://events.pagerduty.com/v2/enqueue',
        expect.objectContaining({
          routing_key: 'test-integration-key-123',
          payload: expect.objectContaining({
            summary: 'Test alert from Football Analytics System'
          })
        })
      );
    });
  });

  describe('NotificationManager', () => {
    let notificationManager: NotificationManager;
    let mockEmailChannel: any;
    let mockSlackChannel: any;

    beforeEach(() => {
      notificationManager = new NotificationManager();
      
      mockEmailChannel = {
        name: 'email',
        send: jest.fn().mockResolvedValue(true),
        test: jest.fn().mockResolvedValue(true)
      };

      mockSlackChannel = {
        name: 'slack',
        send: jest.fn().mockResolvedValue(true),
        test: jest.fn().mockResolvedValue(true)
      };

      notificationManager.registerChannel(mockEmailChannel);
      notificationManager.registerChannel(mockSlackChannel);
    });

    it('should register notification channels', () => {
      const channelNames = notificationManager.getChannelNames();
      expect(channelNames).toContain('email');
      expect(channelNames).toContain('slack');
    });

    it('should send alerts to multiple channels', async () => {
      await notificationManager.sendAlert(mockAlert, ['email', 'slack']);

      expect(mockEmailChannel.send).toHaveBeenCalledWith(mockAlert);
      expect(mockSlackChannel.send).toHaveBeenCalledWith(mockAlert);
    });

    it('should handle non-existent channels gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await notificationManager.sendAlert(mockAlert, ['email', 'nonexistent']);

      expect(mockEmailChannel.send).toHaveBeenCalledWith(mockAlert);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Notification channel not found: nonexistent'
      );

      consoleSpy.mockRestore();
    });

    it('should test all channels', async () => {
      const results = await notificationManager.testAllChannels();

      expect(results).toEqual({
        email: true,
        slack: true
      });
      expect(mockEmailChannel.test).toHaveBeenCalled();
      expect(mockSlackChannel.test).toHaveBeenCalled();
    });

    it('should handle channel test failures', async () => {
      mockSlackChannel.test.mockRejectedValue(new Error('Test failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const results = await notificationManager.testAllChannels();

      expect(results).toEqual({
        email: true,
        slack: false
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Test failed for channel slack:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});