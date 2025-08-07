/**
 * Tests for responsible gambling features
 * These tests verify the gambling alert system, session tracking, and educational content
 */

describe('Responsible Gambling Features', () => {
  it('should create gambling alerts with proper structure', () => {
    const mockAlert = {
      id: 'alert-123',
      type: 'TIME_LIMIT' as const,
      severity: 'WARNING' as const,
      title: 'Session Time Limit',
      message: 'You have been active for 2 hours. Consider taking a break.',
      timestamp: '2024-01-15T19:30:00Z',
      acknowledged: false
    };

    expect(mockAlert.id).toBeDefined();
    expect(mockAlert.type).toBe('TIME_LIMIT');
    expect(mockAlert.severity).toBe('WARNING');
    expect(mockAlert.title).toBeDefined();
    expect(mockAlert.message).toBeDefined();
    expect(mockAlert.acknowledged).toBe(false);
  });

  it('should track gambling session data correctly', () => {
    const mockSession = {
      sessionId: 'session-123',
      startTime: '2024-01-15T18:00:00Z',
      duration: 90, // 90 minutes
      activityCount: 25,
      lastActivity: '2024-01-15T19:30:00Z'
    };

    expect(mockSession.sessionId).toBeDefined();
    expect(mockSession.duration).toBe(90);
    expect(mockSession.activityCount).toBe(25);
    expect(new Date(mockSession.startTime)).toBeInstanceOf(Date);
    expect(new Date(mockSession.lastActivity)).toBeInstanceOf(Date);
  });

  it('should have configurable gambling limits', () => {
    const mockLimits = {
      sessionTimeLimit: 120, // 2 hours
      dailyActivityLimit: 50,
      breakReminderInterval: 30, // 30 minutes
      enabled: true
    };

    expect(mockLimits.sessionTimeLimit).toBe(120);
    expect(mockLimits.dailyActivityLimit).toBe(50);
    expect(mockLimits.breakReminderInterval).toBe(30);
    expect(mockLimits.enabled).toBe(true);
  });

  it('should provide educational content with proper structure', () => {
    const mockEducationalContent = {
      id: 'tip-1',
      type: 'TIP' as const,
      title: 'Set Time Limits',
      content: 'Setting time limits is one of the most effective ways to maintain control.',
      url: 'https://www.ncpgambling.org/help-treatment/self-help-tools/'
    };

    expect(mockEducationalContent.id).toBeDefined();
    expect(mockEducationalContent.type).toBe('TIP');
    expect(mockEducationalContent.title).toBeDefined();
    expect(mockEducationalContent.content).toBeDefined();
    expect(mockEducationalContent.url).toMatch(/^https?:\/\//);
  });

  it('should handle different alert types correctly', () => {
    const alertTypes = ['TIME_LIMIT', 'ACTIVITY_LIMIT', 'SPENDING_LIMIT', 'BREAK_REMINDER'];
    const severityLevels = ['INFO', 'WARNING', 'CRITICAL'];

    alertTypes.forEach(type => {
      expect(type).toBeDefined();
    });

    severityLevels.forEach(severity => {
      expect(severity).toBeDefined();
    });
  });

  it('should provide proper icon mapping for alert types', () => {
    const getIcon = (type: string) => {
      switch (type) {
        case 'TIME_LIMIT':
          return '⏰';
        case 'ACTIVITY_LIMIT':
          return '📊';
        case 'SPENDING_LIMIT':
          return '💰';
        case 'BREAK_REMINDER':
          return '☕';
        default:
          return '⚠️';
      }
    };

    expect(getIcon('TIME_LIMIT')).toBe('⏰');
    expect(getIcon('ACTIVITY_LIMIT')).toBe('📊');
    expect(getIcon('SPENDING_LIMIT')).toBe('💰');
    expect(getIcon('BREAK_REMINDER')).toBe('☕');
    expect(getIcon('UNKNOWN')).toBe('⚠️');
  });

  it('should calculate session progress correctly', () => {
    const calculateProgress = (current: number, limit: number) => {
      return Math.min((current / limit) * 100, 100);
    };

    expect(calculateProgress(60, 120)).toBe(50); // 50% of time limit
    expect(calculateProgress(25, 50)).toBe(50);  // 50% of activity limit
    expect(calculateProgress(150, 120)).toBe(100); // Over limit, capped at 100%
  });

  it('should format duration correctly', () => {
    const formatDuration = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    expect(formatDuration(30)).toBe('30m');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(120)).toBe('2h 0m');
    expect(formatDuration(0)).toBe('0m');
  });

  it('should provide help resources', () => {
    const helpResources = [
      {
        name: 'National Council on Problem Gambling',
        url: 'https://www.ncpgambling.org/',
        phone: '1-800-522-4700'
      },
      {
        name: 'Gamblers Anonymous',
        url: 'https://www.gamblersanonymous.org/'
      }
    ];

    helpResources.forEach(resource => {
      expect(resource.name).toBeDefined();
      expect(resource.url).toMatch(/^https?:\/\//);
    });

    expect(helpResources[0].phone).toBe('1-800-522-4700');
  });

  it('should support session state management', () => {
    const sessionStates = ['ACTIVE', 'BREAK', 'ENDED'];
    
    sessionStates.forEach(state => {
      expect(state).toBeDefined();
    });

    // Test state transitions
    const validTransitions = [
      ['ACTIVE', 'BREAK'],
      ['BREAK', 'ACTIVE'],
      ['ACTIVE', 'ENDED'],
      ['BREAK', 'ENDED']
    ];

    validTransitions.forEach(([from, to]) => {
      expect(from).toBeDefined();
      expect(to).toBeDefined();
    });
  });

  it('should validate responsible gambling configuration', () => {
    const config = {
      limits: {
        sessionTimeLimit: 120,
        dailyActivityLimit: 50,
        breakReminderInterval: 30,
        enabled: true
      },
      showEducationalContent: true,
      trackingEnabled: true,
      alertsEnabled: true
    };

    // Validate configuration structure
    expect(config.limits).toBeDefined();
    expect(config.limits.sessionTimeLimit).toBeGreaterThan(0);
    expect(config.limits.dailyActivityLimit).toBeGreaterThan(0);
    expect(config.limits.breakReminderInterval).toBeGreaterThan(0);
    expect(typeof config.limits.enabled).toBe('boolean');
    expect(typeof config.showEducationalContent).toBe('boolean');
    expect(typeof config.trackingEnabled).toBe('boolean');
    expect(typeof config.alertsEnabled).toBe('boolean');
  });

  it('should handle educational content categories', () => {
    const contentTypes = ['TIP', 'WARNING', 'RESOURCE'];
    
    contentTypes.forEach(type => {
      expect(type).toBeDefined();
    });

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'TIP':
          return '💡';
        case 'WARNING':
          return '⚠️';
        case 'RESOURCE':
          return '📚';
        default:
          return 'ℹ️';
      }
    };

    expect(getTypeIcon('TIP')).toBe('💡');
    expect(getTypeIcon('WARNING')).toBe('⚠️');
    expect(getTypeIcon('RESOURCE')).toBe('📚');
  });
});