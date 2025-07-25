// Basic test to verify Jest setup without TypeScript annotations
describe('Basic Jest Setup', () => {
  it('should run basic JavaScript tests', () => {
    const testValue = 'Jest works';
    expect(testValue).toBe('Jest works');
  });

  it('should have test environment configured', () => {
    expect(process.env['NODE_ENV']).toBe('test');
  });

  it('should load environment variables', () => {
    // Load test environment manually for this test
    require('dotenv').config({ path: '.env.test' });
    expect(process.env['JWT_SECRET']).toBeDefined();
  });

  it('should support async/await', async () => {
    const promise = Promise.resolve('async works');
    const result = await promise;
    expect(result).toBe('async works');
  });
});