// backend/src/database/index.js
const { Pool } = require('pg');
require('dotenv').config();

// Use DATABASE_URL if provided (Supabase connection string), otherwise use individual env vars
// Handle connection pooler issues with timeout and retry
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('supabase.com') || process.env.DATABASE_URL.includes('pooler.supabase.com') 
        ? { rejectUnauthorized: false } 
        : false,
      connectionTimeoutMillis: 10000, // 10 second timeout
      idleTimeoutMillis: 30000,
      max: 20, // Maximum number of clients in the pool
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'Eduhens',
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
      ssl: process.env.DB_HOST?.includes('supabase.com') ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 20,
    };

const pool = new Pool(poolConfig);
pool.on('connect', (client) => {
  client
    .query("SET search_path TO public, auth, pg_catalog")
    .catch((err) => console.error('[DB] Failed to set search_path:', err));
});

// test connect with retry logic and better error handling
const connectDB = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      const res = await client.query('SELECT current_database(), current_user, inet_server_addr() as host, now()');
      const dbInfo = res.rows[0];
      const isSupabase = dbInfo.host && (dbInfo.host.includes('supabase') || dbInfo.host.includes('aws-'));
      console.log(`✅ Connected to database: ${dbInfo.current_database} (${isSupabase ? 'Supabase' : 'Local'})`);
      console.log(`   Host: ${dbInfo.host || 'localhost'}, User: ${dbInfo.current_user}`);
      client.release();
      return true;
    } catch (error) {
      console.error(`❌ Database connection error (attempt ${i + 1}/${retries}):`, error.message);
      if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        console.error(`   DNS resolution failed for database host`);
        if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('pooler')) {
          console.error('💡 Tip: If using Supabase pooler and getting DNS errors, try:');
          console.error('   1. Check your DATABASE_URL is correct');
          console.error('   2. Try using direct connection URL (remove .pooler from hostname)');
          console.error('   3. Verify network connectivity to Supabase');
        }
      }
      if (i < retries - 1) {
        console.log(`   Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.error('❌ Database connection failed after all retries');
        return false;
      }
    }
  }
  return false;
};

// User Model
const userModel = {
  async findByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT * FROM public.users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  },

  async findById(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM public.users WHERE id = $1',
        [userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  },

  async updateUserProfile(userId, { name, picture } = {}) {
    try {
      const fields = [];
      const values = [];
      let idx = 1;
      const pushField = (column, value) => {
        if (value === undefined) return;
        fields.push(`${column} = $${idx++}`);
        values.push(value);
      };
      pushField('name', name);
      pushField('picture', picture);
      if (fields.length === 0) return await this.findById(userId);
      const sql = `UPDATE public.users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`;
      values.push(userId);
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // find user by auth0_id 
  async findByAuth0Id(auth0Id) {
    try {
      const result = await pool.query(
        'SELECT * FROM public.users WHERE auth0_id = $1',
        [auth0Id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by auth0_id:', error);
      throw error;
    }
  },

  async createTraditionalUser(userData) {
    const { email, passwordHash, firstName, lastName, phoneNumber } = userData;
    const displayName = [firstName, lastName].filter(Boolean).join(' ').trim();
    try {
      const result = await pool.query(
        `INSERT INTO public.users (email, password_hash, name, phone_number, auth0_provider) 
         VALUES ($1, $2, $3, $4, 'traditional') 
         RETURNING id, email, name, email_verified, created_at`,
        [email, passwordHash, displayName || email, phoneNumber]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating traditional user:', error);
      throw error;
    }
  },

  // create or update auth0 users
  async createOrUpdateAuth0User(auth0User) {
    const { 
      sub: auth0Id, 
      email, 
      email_verified, 
      given_name, 
      family_name, 
      picture,
      nickname,
      name,
      full_name: fullName
    } = auth0User;
    
    const displayName = (
      name ||
      fullName ||
      [given_name, family_name].filter(Boolean).join(' ') ||
      nickname ||
      email ||
      'User'
    ).toString().trim();
    const normalizedDisplayName = displayName.length ? displayName : 'User';
    
    console.log('Debug: get Auth0 data:', { name, fullName, given_name, family_name, nickname, email }); 
    
    try {
      const existingUser = await this.findByAuth0Id(auth0Id);
      if (existingUser) {
        const result = await pool.query(
          `UPDATE public.users 
           SET 
             email = $1,
             email_verified = $2,
             name = CASE WHEN name IS NULL OR name = '' THEN $3 ELSE name END,
             picture = CASE WHEN picture IS NULL OR picture = '' THEN $4 ELSE picture END,
             updated_at = CURRENT_TIMESTAMP
           WHERE auth0_id = $5 
           RETURNING *`,
          [
            email,
            email_verified,
            normalizedDisplayName,
            picture,
            auth0Id,
          ]
        );
        return result.rows[0];
      }

      // check email 
      const userWithSameEmail = await this.findByEmail(email);      
      if (userWithSameEmail) {
        // if we have email at db, update
        const result = await pool.query(
          `UPDATE public.users 
           SET auth0_id = $1, auth0_provider = $2, email_verified = $3,
               picture = CASE WHEN picture IS NULL OR picture = '' THEN $4 ELSE picture END,
               name = CASE WHEN name IS NULL OR name = '' THEN $5 ELSE name END,
               updated_at = CURRENT_TIMESTAMP
           WHERE email = $6 
           RETURNING *`,
          [auth0Id, this.extractProvider(auth0Id), email_verified, picture, normalizedDisplayName, email]
        );
        return result.rows[0];
      }

      // create new user 
      const result = await pool.query(
        `INSERT INTO public.users (
          email, email_verified, name, picture, 
          auth0_id, auth0_provider, phone_number
        ) VALUES ($1, $2, $3, $4, $5, $6, '')
        RETURNING *`,
        [
          email, 
          email_verified, 
          normalizedDisplayName,  
          picture,
          auth0Id,
          this.extractProvider(auth0Id)
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating/updating Auth0 user:', error);
      throw error;
    }
  },

  // auth0_id provider
  extractProvider(auth0Id) {
    return auth0Id ? auth0Id.split('|')[0] : 'unknown';
  },

  async verifyEmail(userId) {
    try {
      const result = await pool.query(
        'UPDATE public.users SET email_verified = true WHERE id = $1 RETURNING *',
        [userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  },

  async canUserAccessFeature(userId, requireEmailVerification = false) {
    try {
      const user = await this.findById(userId);
      if (!user) return false;
      
      if (requireEmailVerification && !user.email_verified) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking user access:', error);
      return false;
    }
  },

  // assign role to user
  async assignRole(userId, role) {
    try {
      const result = await pool.query(
        `INSERT INTO public.user_roles (user_id, role) 
         VALUES ($1, $2) 
         ON CONFLICT (user_id, role) DO NOTHING
         RETURNING *`,
        [userId, role]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  },

  async removeRole(userId, role) {
    try {
      const result = await pool.query(
        `DELETE FROM public.user_roles WHERE user_id = $1 AND role = $2 RETURNING *`,
        [userId, role]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  },

  async getUserRoles(userId) {
    try {
      const result = await pool.query(
        `SELECT role, created_at 
         FROM public.user_roles 
         WHERE user_id = $1`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting user roles:', error);
      throw error;
    }
  },

  async hasRole(userId, role) {
    try {
      const result = await pool.query(
        `SELECT 1 FROM public.user_roles 
         WHERE user_id = $1 AND role = $2`,
        [userId, role]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking user role:', error);
      throw error;
    }
  },

  async hasAnyRole(userId) {
    try {
      const result = await pool.query(
        `SELECT 1 FROM public.user_roles WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking if user has any role:', error);
      return false;
    }
  },

  async listUsersWithRoles(limit = 200, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT u.id, u.email, u.name, u.picture, u.email_verified, u.created_at,
                COALESCE(json_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), '[]') AS roles
         FROM public.users u
         LEFT JOIN public.user_roles ur ON ur.user_id = u.id
         GROUP BY u.id
         ORDER BY u.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result.rows.map(r => ({
        ...r,
        roles: Array.isArray(r.roles) ? r.roles : []
      }));
    } catch (error) {
      console.error('Error listing users with roles:', error);
      throw error;
    }
  },

  // fetch role
  async getPrimaryRole(userId) {
    try {
      const roles = await this.getUserRoles(userId);
      
      // 優先順序：admin > teacher > student
      if (roles.some(r => r.role === 'admin')) return 'admin';
      if (roles.some(r => r.role === 'teacher')) return 'teacher';
      if (roles.some(r => r.role === 'student')) return 'student';
      
      return null; 
    } catch (error) {
      console.error('Error getting primary role:', error);
      return null;
    }
  },

  async removeRole(userId, role) {
    try {
      const result = await pool.query(
        `DELETE FROM public.user_roles 
         WHERE user_id = $1 AND role = $2
         RETURNING *`,
        [userId, role]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  },

  // admin delete user
  async deleteUser(userId) {
    try {
      // ON DELETE CASCADE，delete user_roles
      const result = await pool.query(
        `DELETE FROM public.users WHERE id = $1 RETURNING *`,
        [userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // 檢查是否為管理員
  async isAdmin(userId) {
    return this.hasRole(userId, 'admin');
  },

  // 檢查是否為教師
  async isTeacher(userId) {
    return this.hasRole(userId, 'teacher');
  }
};

module.exports = {
  pool,
  connectDB,
  userModel
};
