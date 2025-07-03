import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
    console.log('Function invoked at:', new Date().toISOString(), 'Event:', event);

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

        console.log('Event body:', event.body);

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

        const { username, email, password, 'full-name': fullName, dob, details, interests, form_submit_ip, consent } = body;

        if (!username || !email || !password || !fullName || !dob || !consent) {
            console.error('Missing required fields:', { username, email, password, fullName, dob, consent });
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Missing required fields, including consent.' }),
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
            console.log('Attempting database insert');
            await sql`
                INSERT INTO public.submissions (username, email, password, full_name, dob, details, interests, form_submit_ip, submitted_at)
                VALUES (${username}, ${email}, ${password}, ${fullName}, ${dob}, ${details}, ${interests}, ${form_submit_ip}, NOW())
            `;
            console.log('Database insert successful');
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
            body: JSON.stringify({ message: 'Submission saved successfully.' }),
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
