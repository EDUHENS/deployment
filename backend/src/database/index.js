// backend/src/database/index.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER|| 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'Eduhens',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT|| 5432,
  ssl: false
});

// test connect
const connectDB = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT current_database(), now()');
    console.log('Connected to database:', res.rows[0]);
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

// User Model
const userModel = {
  async findByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
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
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  },

  async updateUserProfile(userId, { first_name, last_name, picture }) {
    try {
      const fields = [];
      const values = [];
      let idx = 1;
      if (typeof first_name === 'string') { fields.push(`first_name = $${idx++}`); values.push(first_name); }
      if (typeof last_name === 'string')  { fields.push(`last_name  = $${idx++}`); values.push(last_name); }
      if (typeof picture === 'string')    { fields.push(`picture    = $${idx++}`); values.push(picture); }
      if (fields.length === 0) return await this.findById(userId);
      const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`;
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
        'SELECT * FROM users WHERE auth0_id = $1',
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
    try {
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone_number, auth0_provider) 
         VALUES ($1, $2, $3, $4, $5, 'traditional') 
         RETURNING id, email, first_name, last_name, email_verified, created_at`,
        [email, passwordHash, firstName, lastName, phoneNumber]
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
      nickname 
    } = auth0User;
    
    console.log('Debug: get Auth0 data:', { given_name, family_name, nickname,email }); 
    
    try {
      const existingUser = await this.findByAuth0Id(auth0Id);
      if (existingUser) {
        const result = await pool.query(
          `UPDATE users 
           SET 
             email = $1,
             email_verified = $2,
             first_name = CASE WHEN first_name IS NULL OR first_name = '' THEN $3 ELSE first_name END,
             last_name  = CASE WHEN last_name  IS NULL OR last_name  = '' THEN $4 ELSE last_name  END,
             picture = $5,
             updated_at = CURRENT_TIMESTAMP
           WHERE auth0_id = $6 
           RETURNING *`,
          [
            email,
            email_verified,
            given_name || nickname || '',
            family_name || '',
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
          `UPDATE users 
           SET auth0_id = $1, auth0_provider = $2, email_verified = $3, picture = $4, updated_at = CURRENT_TIMESTAMP
           WHERE email = $5 
           RETURNING *`,
          [auth0Id, this.extractProvider(auth0Id), email_verified, picture, email]
        );
        return result.rows[0];
      }

      // create new user 
      const result = await pool.query(
        `INSERT INTO users (
          email, email_verified, first_name, last_name, picture, 
          auth0_id, auth0_provider, phone_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, '')
        RETURNING *`,
        [
          email, 
          email_verified, 
          given_name || nickname || '',  
          family_name || '',    
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
        'UPDATE users SET email_verified = true WHERE id = $1 RETURNING *',
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
        `INSERT INTO user_roles (user_id, role) 
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
        `DELETE FROM user_roles WHERE user_id = $1 AND role = $2 RETURNING *`,
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
         FROM user_roles 
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
        `SELECT 1 FROM user_roles 
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
        `SELECT 1 FROM user_roles WHERE user_id = $1 LIMIT 1`,
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
        `SELECT u.id, u.email, u.first_name, u.last_name, u.picture, u.email_verified, u.created_at,
                COALESCE(json_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), '[]') AS roles
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id
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
        `DELETE FROM user_roles 
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
        `DELETE FROM users WHERE id = $1 RETURNING *`,
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
