import { InfluxDBManager, defaultInfluxDBConfig, MetricPoint } from '../../core/influxdb-config';

// Mock the InfluxDB client
jest.mock('@influxdata/influxdb-client', () => ({
  InfluxDB: jest.fn().mockImplementation(() => ({
    getWriteApi: jest.fn().mockReturnValue({
      writePoint: jest.fn(),
      writePoints: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
      flush: jest.fn().mockResolvedValue(undefined)
    }),
    getQueryApi: jest.fn().mockReturnValue({
      queryRaw: jest.fn().mockResolvedValue('mock query result'),
      queryRows: jest.fn()
    })
  })),
  Point: jest.fn().mockImplementation((measurement) => ({
    tag: jest.fn().mockReturnThis(),
    floatField: jest.fn().mockReturnThis(),
    stringField: jest.fn().mockReturnThis(),
    booleanField: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis(),
    measurement
  }))
}));

describe('InfluxDBManager', () => {
  let influxDBManager: InfluxDBManager;
  const mockConfig = {
    ...defaultInfluxDBConfig,
    url: 'http://test-influx:8086',
    token: 'test-token',
    org: 'test-org',
    bucket: 'test-bucket'
  };

  beforeEach(() => {
    influxDBManager = new InfluxDBManager(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should use default configuration values', () => {
      expect(defaultInfluxDBConfig.url).toBe('http://localhost:8086');
      expect(defaultInfluxDBConfig.org).toBe('football-analytics');
      expect(defaultInfluxDBConfig.bucket).toBe('metrics');
      expect(defaultInfluxDBConfig.timeout).toBe(30000);
      expect(defaultInfluxDBConfig.batchSize).toBe(1000);
      expect(defaultInfluxDBConfig.flushInterval).toBe(5000);
    });

    it('should create InfluxDBManager with custom config', () => {
      const customConfig = {
        ...mockConfig,
        timeout: 60000,
        batchSize: 2000
      };

      const manager = new InfluxDBManager(customConfig);
      expect(manager).toBeInstanceOf(InfluxDBManager);
    });
  });

  describe('Connection Management', () => {
    it('should initialize connection successfully', async () => {
      const mockQueryApi = {
        queryRaw: jest.fn().mockResolvedValue('success')
      };
      
      influxDBManager['queryApi'] = mockQueryApi as any;

      await influxDBManager.initialize();
      
      expect(mockQueryApi.queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('from(bucket: "test-bucket")')
      );
    });

    it('should handle initialization failure', async () => {
      const mockQueryApi = {
        queryRaw: jest.fn().mockRejectedValue(new Error('Connection failed'))
      };
      
      influxDBManager['queryApi'] = mockQueryApi as any;

      await expect(influxDBManager.initialize()).rejects.toThrow('Connection failed');
    });

    it('should close connection properly', async () => {
      const mockWriteApi = {
        close: jest.fn().mockResolvedValue(undefined)
      };
      
      influxDBManager['writeApi'] = mockWriteApi as any;
      influxDBManager['isConnected'] = true;

      await influxDBManager.close();
      
      expect(mockWriteApi.close).toHaveBeenCalled();
    });

    it('should check health status', async () => {
      const mockQueryApi = {
        queryRaw: jest.fn().mockResolvedValue('healthy')
      };
      
      influxDBManager['queryApi'] = mockQueryApi as any;
      influxDBManager['isConnected'] = true;

      const isHealthy = await influxDBManager.isHealthy();
      
      expect(isHealthy).toBe(true);
      expect(mockQueryApi.queryRaw).toHaveBeenCalled();
    });

    it('should return false for health check when not connected', async () => {
      influxDBManager['isConnected'] = false;

      const isHealthy = await influxDBManager.isHealthy();
      
      expect(isHealthy).toBe(false);
    });
  });

  describe('Data Writing', () => {
    beforeEach(() => {
      influxDBManager['isConnected'] = true;
    });

    it('should write single point', async () => {
      const mockWriteApi = {
        writePoint: jest.fn()
      };
      const mockPoint = {
        tag: jest.fn().mockReturnThis(),
        floatField: jest.fn().mockReturnThis(),
        stringField: jest.fn().mockReturnThis(),
        booleanField: jest.fn().mockReturnThis(),
        timestamp: jest.fn().mockReturnThis()
      };

      influxDBManager['writeApi'] = mockWriteApi as any;
      
      // Mock Point constructor
      const { Point } = require('@influxdata/influxdb-client');
      Point.mockReturnValue(mockPoint);

      const testPoint: MetricPoint = {
        measurement: 'test_metric',
        tags: { tag1: 'value1' },
        fields: { 
          numField: 42.5, 
          strField: 'test', 
          boolField: true 
        },
        timestamp: new Date()
      };

      await influxDBManager.writePoint(testPoint);

      expect(Point).toHaveBeenCalledWith('test_metric');
      expect(mockPoint.tag).toHaveBeenCalledWith('tag1', 'value1');
      expect(mockPoint.floatField).toHaveBeenCalledWith('numField', 42.5);
      expect(mockPoint.stringField).toHaveBeenCalledWith('strField', 'test');
      expect(mockPoint.booleanField).toHaveBeenCalledWith('boolField', true);
      expect(mockPoint.timestamp).toHaveBeenCalled();
      expect(mockWriteApi.writePoint).toHaveBeenCalledWith(mockPoint);
    });

    it('should write multiple points', async () => {
      const mockWriteApi = {
        writePoints: jest.fn()
      };
      const mockPoint = {
        tag: jest.fn().mockReturnThis(),
        floatField: jest.fn().mockReturnThis(),
        stringField: jest.fn().mockReturnThis(),
        timestamp: jest.fn().mockReturnThis()
      };

      influxDBManager['writeApi'] = mockWriteApi as any;
      
      const { Point } = require('@influxdata/influxdb-client');
      Point.mockReturnValue(mockPoint);

      const testPoints: MetricPoint[] = [
        {
          measurement: 'test1',
          tags: { tag1: 'value1' },
          fields: { field1: 10 }
        },
        {
          measurement: 'test2',
          tags: { tag2: 'value2' },
          fields: { field2: 20 }
        }
      ];

      await influxDBManager.writePoints(testPoints);

      expect(Point).toHaveBeenCalledTimes(2);
      expect(mockWriteApi.writePoints).toHaveBeenCalledWith([mockPoint, mockPoint]);
    });

    it('should throw error when writing without connection', async () => {
      influxDBManager['isConnected'] = false;

      const testPoint: MetricPoint = {
        measurement: 'test',
        tags: {},
        fields: { value: 1 }
      };

      await expect(influxDBManager.writePoint(testPoint)).rejects.toThrow(
        'InfluxDB not connected. Call initialize() first.'
      );
    });

    it('should flush write buffer', async () => {
      const mockWriteApi = {
        flush: jest.fn().mockResolvedValue(undefined)
      };
      
      influxDBManager['writeApi'] = mockWriteApi as any;

      await influxDBManager.flush();
      
      expect(mockWriteApi.flush).toHaveBeenCalled();
    });
  });

  describe('Data Querying', () => {
    beforeEach(() => {
      influxDBManager['isConnected'] = true;
    });

    it('should execute query and return results', async () => {
      const mockResults = [
        { _time: '2024-01-01T00:00:00Z', _value: 10 },
        { _time: '2024-01-01T00:01:00Z', _value: 20 }
      ];

      const mockQueryApi = {
        queryRows: jest.fn().mockImplementation((query, callbacks) => {
          mockResults.forEach(result => {
            callbacks.next(result, { toObject: (row: any) => row });
          });
          callbacks.complete();
        })
      };
      
      influxDBManager['queryApi'] = mockQueryApi as any;

      const testQuery = 'from(bucket: "test") |> range(start: -1h)';
      const results = await influxDBManager.query(testQuery);

      expect(results).toEqual(mockResults);
      expect(mockQueryApi.queryRows).toHaveBeenCalledWith(
        testQuery,
        expect.objectContaining({
          next: expect.any(Function),
          error: expect.any(Function),
          complete: expect.any(Function)
        })
      );
    });

    it('should handle query errors', async () => {
      const mockQueryApi = {
        queryRows: jest.fn().mockImplementation((query, callbacks) => {
          callbacks.error(new Error('Query failed'));
        })
      };
      
      influxDBManager['queryApi'] = mockQueryApi as any;

      const testQuery = 'invalid query';
      
      await expect(influxDBManager.query(testQuery)).rejects.toThrow('Query failed');
    });

    it('should execute raw query', async () => {
      const mockQueryApi = {
        queryRaw: jest.fn().mockResolvedValue('raw result')
      };
      
      influxDBManager['queryApi'] = mockQueryApi as any;

      const testQuery = 'from(bucket: "test") |> range(start: -1h)';
      const result = await influxDBManager.queryRaw(testQuery);

      expect(result).toBe('raw result');
      expect(mockQueryApi.queryRaw).toHaveBeenCalledWith(testQuery);
    });

    it('should throw error when querying without connection', async () => {
      influxDBManager['isConnected'] = false;

      await expect(influxDBManager.query('test query')).rejects.toThrow(
        'InfluxDB not connected'
      );
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      influxDBManager['isConnected'] = true;
    });

    it('should get bucket information', async () => {
      const mockBucketInfo = [{ name: 'test-bucket', id: 'bucket-id' }];
      
      const mockQueryApi = {
        queryRows: jest.fn().mockImplementation((query, callbacks) => {
          mockBucketInfo.forEach(info => {
            callbacks.next(info, { toObject: (row: any) => row });
          });
          callbacks.complete();
        })
      };
      
      influxDBManager['queryApi'] = mockQueryApi as any;

      const bucketInfo = await influxDBManager.getBucketInfo();
      
      expect(bucketInfo).toEqual(mockBucketInfo);
    });

    it('should delete old data', async () => {
      const mockQueryApi = {
        queryRaw: jest.fn().mockResolvedValue('delete result')
      };
      
      influxDBManager['queryApi'] = mockQueryApi as any;

      await influxDBManager.deleteOldData('test_measurement', '2024-01-01T00:00:00Z');
      
      expect(mockQueryApi.queryRaw).toHaveBeenCalledWith(
        expect.stringContaining('test_measurement')
      );
    });

    it('should provide access to write and query APIs', () => {
      const writeApi = influxDBManager.getWriteApi();
      const queryApi = influxDBManager.getQueryApi();
      
      expect(writeApi).toBeDefined();
      expect(queryApi).toBeDefined();
    });
  });
});