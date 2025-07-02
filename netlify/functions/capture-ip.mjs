import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
    console.log('Capture IP function invoked at:', new Date().toISOString(), 'Event:', event);

    try {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            console.error('DATABASE_URL is not defined');
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Server configuration error: DATABASE_URL missing.' }),
            };
        }

        if (!event.body) {
            console.error('No request body provided');
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'No data provided in request body.' }),
            };
        }

        let body;
        try {
            body = JSON.parse(event.body);
            console.log('Parsed body:', body);
        } catch (parseError) {
            console.error('JSON parse error:', parseError.message);
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid JSON in request body.' }),
            };
        }

        const { ip } = body;
        if (!ip) {
            console.error('Missing IP address');
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Missing IP address.' }),
            };
        }

        let sql;
        try {
            sql = neon(databaseUrl);
            console.log('Database connection established');
        } catch (dbError) {
            console.error('Database connection error:', dbError.message);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Failed to connect to database.' }),
            };
        }

        try {
            console.log('Attempting database insert for page load IP');
            await sql`
                INSERT INTO public.submissions (page_load_ip, submitted_at)
                VALUES (${ip}, NOW())
            `;
            console.log('Page load IP insert successful');
        } catch (queryError) {
            console.error('Database query error:', queryError.message);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: `Database error: ${queryError.message}` }),
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Page load IP saved successfully.' }),
        };
    } catch (error) {
        console.error('Unexpected error in function:', error.message, error.stack);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: `Unexpected error: ${error.message}` }),
        };
    }
};
