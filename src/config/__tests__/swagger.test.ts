import request from 'supertest';
import express from 'express';
import { setupSwagger } from '../swagger';

describe('Swagger Configuration', () => {
    let app: express.Express;

    beforeAll(() => {
        app = express();
        setupSwagger(app);
    });

    describe('Swagger UI endpoint', () => {
        it('should serve Swagger UI at /api-docs', async () => {
            const response = await request(app)
                .get('/api-docs/')
                .expect(200);

            expect(response.text).toContain('swagger-ui');
            expect(response.headers['content-type']).toMatch(/text\/html/);
        });

        it('should redirect /api-docs to /api-docs/', async () => {
            const response = await request(app)
                .get('/api-docs')
                .expect(301);

            expect(response.headers['location']).toBe('/api-docs/');
        });
    });

    describe('OpenAPI JSON endpoint', () => {
        it('should serve OpenAPI JSON at /api-docs.json', async () => {
            const response = await request(app)
                .get('/api-docs.json')
                .expect(200);

            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.body).toHaveProperty('openapi', '3.0.0');
            expect(response.body).toHaveProperty('info');
            expect(response.body.info).toHaveProperty('title', 'Node.js TypeScript API Demo');
            expect(response.body.info).toHaveProperty('version', '1.0.0');
        });

        it('should include all required components in OpenAPI spec', async () => {
            const response = await request(app)
                .get('/api-docs.json')
                .expect(200);

            const spec = response.body;

            // Check components
            expect(spec).toHaveProperty('components');
            expect(spec.components).toHaveProperty('securitySchemes');
            expect(spec.components).toHaveProperty('schemas');

            // Check security schemes
            expect(spec.components.securitySchemes).toHaveProperty('bearerAuth');
            expect(spec.components.securitySchemes.bearerAuth).toEqual({
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter JWT token obtained from login endpoint',
            });

            // Check essential schemas
            const schemas = spec.components.schemas;
            expect(schemas).toHaveProperty('User');
            expect(schemas).toHaveProperty('UserRegistrationRequest');
            expect(schemas).toHaveProperty('UserLoginRequest');
            expect(schemas).toHaveProperty('UserUpdateRequest');
            expect(schemas).toHaveProperty('AuthResponse');
            expect(schemas).toHaveProperty('SuccessResponse');
            expect(schemas).toHaveProperty('ErrorResponse');
            expect(schemas).toHaveProperty('ValidationErrorResponse');
        });

        it('should include all required tags', async () => {
            const response = await request(app)
                .get('/api-docs.json')
                .expect(200);

            const spec = response.body;
            expect(spec).toHaveProperty('tags');

            const tagNames = spec.tags.map((tag: any) => tag.name);
            expect(tagNames).toContain('Health');
            expect(tagNames).toContain('Authentication');
            expect(tagNames).toContain('Users');
        });

        it('should include server configuration', async () => {
            const response = await request(app)
                .get('/api-docs.json')
                .expect(200);

            const spec = response.body;
            expect(spec).toHaveProperty('servers');
            expect(Array.isArray(spec.servers)).toBe(true);
            expect(spec.servers.length).toBeGreaterThan(0);

            const devServer = spec.servers.find((server: any) =>
                server.description === 'Development server'
            );
            expect(devServer).toBeDefined();
            expect(devServer.url).toMatch(/http:\/\/localhost:\d+/);
        });
    });

    describe('Schema validation', () => {
        let openApiSpec: any;

        beforeAll(async () => {
            const response = await request(app).get('/api-docs.json');
            openApiSpec = response.body;
        });

        it('should have valid User schema', () => {
            const userSchema = openApiSpec.components.schemas.User;

            expect(userSchema.type).toBe('object');
            expect(userSchema.properties).toHaveProperty('id');
            expect(userSchema.properties).toHaveProperty('name');
            expect(userSchema.properties).toHaveProperty('email');
            expect(userSchema.properties).toHaveProperty('createdAt');
            expect(userSchema.properties).toHaveProperty('updatedAt');
            expect(userSchema.required).toEqual(['id', 'name', 'email', 'createdAt', 'updatedAt']);
        });

        it('should have valid UserRegistrationRequest schema', () => {
            const schema = openApiSpec.components.schemas.UserRegistrationRequest;

            expect(schema.type).toBe('object');
            expect(schema.properties).toHaveProperty('name');
            expect(schema.properties).toHaveProperty('email');
            expect(schema.properties).toHaveProperty('password');
            expect(schema.required).toEqual(['name', 'email', 'password']);

            // Check password validation pattern
            expect(schema.properties.password.pattern).toBe('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$');
            expect(schema.properties.password.minLength).toBe(8);
        });

        it('should have valid AuthResponse schema', () => {
            const schema = openApiSpec.components.schemas.AuthResponse;

            expect(schema.type).toBe('object');
            expect(schema.properties).toHaveProperty('token');
            expect(schema.properties).toHaveProperty('user');
            expect(schema.properties.user.$ref).toBe('#/components/schemas/User');
            expect(schema.required).toEqual(['token', 'user']);
        });

        it('should have valid ErrorResponse schema', () => {
            const schema = openApiSpec.components.schemas.ErrorResponse;

            expect(schema.type).toBe('object');
            expect(schema.properties).toHaveProperty('success');
            expect(schema.properties).toHaveProperty('error');
            expect(schema.properties).toHaveProperty('timestamp');
            expect(schema.properties).toHaveProperty('path');
            expect(schema.required).toEqual(['success', 'error', 'timestamp', 'path']);

            // Check error object structure
            expect(schema.properties.error.properties).toHaveProperty('code');
            expect(schema.properties.error.properties).toHaveProperty('message');
            expect(schema.properties.error.required).toEqual(['code', 'message']);
        });
    });
});