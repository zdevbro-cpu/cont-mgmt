import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        console.log('Testing exact server query...');

        const page = 1;
        const limit = 20;
        const offset = (page - 1) * limit;
        const sortBy = 'created_at';
        const sortOrder = 'desc';

        let query = supabase
            .from('contracts')
            .select(`
        *,
        contract_types (
          name,
          code
        )
      `, { count: 'exact' });

        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
        query = query.range(offset, offset + limit - 1);

        const { data: contracts, error, count } = await query;

        if (error) {
            console.error('Query failed:', error);
        } else {
            console.log('Query successful.');
            console.log('Count:', count);
            console.log('Contracts:', contracts);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

test();
