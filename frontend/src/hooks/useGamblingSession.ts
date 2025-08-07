import { useState, useEffect, useCallback, useRef } from 'react';
import { GamblingSession, GamblingAlert, GamblingLimits } from '../types/gambling';

interface UseGamblingSessionOptions {
  limits: GamblingLimits;
  onAlert?: (alert: GamblingAlert) => void;
}

export const useGamblingSession = ({ limits, onAlert }: UseGamblingSessionOptions) => {
  const [session, setSession] = useState<GamblingSession | null>(null);
  const [alerts, setAlerts] = useState<GamblingAlert[]>([]);
  const [isBreakTime, setIsBreakTime] = useState(false);
  
  const sessionStartTime = useRef<Date | null>(null);
  const lastBreakReminder = useRef<Date | null>(null);
  const activityCount = useRef(0);

  // Initialize session
  const startSession = useCallback(() => {
    const now = new Date();
    sessionStartTime.current = now;
    lastBreakReminder.current = now;
    activityCount.current = 0;

    const newSession: GamblingSession = {
      sessionId: `session-${now.getTime()}`,
      startTime: now.toISOString(),
      duration: 0,
      activityCount: 0,
      lastActivity: now.toISOString()
    };

    setSession(newSession);
    setIsBreakTime(false);
  }, []);

  // Track user activity
  const trackActivity = useCallback(() => {
    if (!session || !limits.enabled) return;

    const now = new Date();
    activityCount.current++;

    setSession(prev => prev ? {
      ...prev,
      activityCount: activityCount.current,
      lastActivity: now.toISOString()
    } : null);

    // Check daily activity limit
    if (activityCount.current >= limits.dailyActivityLimit) {
      const alert: GamblingAlert = {
        id: `alert-${now.getTime()}`,
        type: 'ACTIVITY_LIMIT',
        severity: 'WARNING',
        title: 'Daily Activity Limit Reached',
        message: `You've reached your daily activity limit of ${limits.dailyActivityLimit} interactions. Consider taking a break.`,
        timestamp: now.toISOString(),
        acknowledged: false
      };

      setAlerts(prev => [...prev, alert]);
      onAlert?.(alert);
    }
  }, [session, limits, onAlert]);

  // Create alert
  const createAlert = useCallback((
    type: GamblingAlert['type'],
    severity: GamblingAlert['severity'],
    title: string,
    message: string
  ) => {
    const alert: GamblingAlert = {
      id: `alert-${Date.now()}`,
      type,
      severity,
      title,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    setAlerts(prev => [...prev, alert]);
    onAlert?.(alert);
    return alert;
  }, [onAlert]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  // Take a break
  const takeBreak = useCallback(() => {
    setIsBreakTime(true);
    createAlert(
      'BREAK_REMINDER',
      'INFO',
      'Break Time',
      'Taking a break is a healthy gambling habit. Use this time to reflect on your activity.'
    );
  }, [createAlert]);

  // End break
  const endBreak = useCallback(() => {
    setIsBreakTime(false);
    lastBreakReminder.current = new Date();
  }, []);

  // End session
  const endSession = useCallback(() => {
    if (session && sessionStartTime.current) {
      const duration = Math.floor((Date.now() - sessionStartTime.current.getTime()) / 60000);
      
      setSession(prev => prev ? { ...prev, duration } : null);
      
      // Create session summary alert
      createAlert(
        'BREAK_REMINDER',
        'INFO',
        'Session Ended',
        `Session lasted ${duration} minutes with ${activityCount.current} activities. Remember to gamble responsibly.`
      );
    }

    sessionStartTime.current = null;
    activityCount.current = 0;
    setSession(null);
  }, [session, createAlert]);

  // Monitor session time and break reminders
  useEffect(() => {
    if (!session || !limits.enabled || isBreakTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      
      if (sessionStartTime.current) {
        const sessionDuration = Math.floor((now.getTime() - sessionStartTime.current.getTime()) / 60000);
        
        // Update session duration
        setSession(prev => prev ? { ...prev, duration: sessionDuration } : null);

        // Check session time limit
        if (sessionDuration >= limits.sessionTimeLimit) {
          createAlert(
            'TIME_LIMIT',
            'CRITICAL',
            'Session Time Limit Reached',
            `You've been active for ${sessionDuration} minutes. It's time to take a break for your wellbeing.`
          );
          takeBreak();
          return;
        }

        // Check break reminder
        if (lastBreakReminder.current) {
          const timeSinceLastReminder = Math.floor((now.getTime() - lastBreakReminder.current.getTime()) / 60000);
          
          if (timeSinceLastReminder >= limits.breakReminderInterval) {
            createAlert(
              'BREAK_REMINDER',
              'WARNING',
              'Break Reminder',
              `You've been active for ${timeSinceLastReminder} minutes since your last break. Consider taking a short break.`
            );
            lastBreakReminder.current = now;
          }
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [session, limits, isBreakTime, createAlert, takeBreak]);

  // Auto-start session on mount if limits are enabled
  useEffect(() => {
    if (limits.enabled && !session) {
      startSession();
    }
  }, [limits.enabled, session, startSession]);

  return {
    session,
    alerts: alerts.filter(alert => !alert.acknowledged),
    allAlerts: alerts,
    isBreakTime,
    startSession,
    endSession,
    trackActivity,
    acknowledgeAlert,
    takeBreak,
    endBreak,
    createAlert
  };
};