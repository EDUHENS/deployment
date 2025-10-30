// backend/src/routes/auth0Route.js
const express = require('express');
const router = express.Router();
const { userModel, pool } = require('../database/index.js');

module.exports = (requireAuth) => {
  // Sync Auth0 user middleware
  const syncAuth0User = async (req, res, next) => {
    if (req.auth && req.auth.payload) {
      try {
        const claims = req.auth.payload;
        console.log('Auth0 claims received:', {
          sub: claims.sub,
          email: claims.email,
          given_name: claims.given_name,
          family_name: claims.family_name,
          nickname: claims.nickname
        });
        
        // Use structure from database/index.js
        await userModel.createOrUpdateAuth0User({
          sub: claims.sub,
          email: claims.email,
          email_verified: claims.email_verified || false,
          given_name: claims.given_name,      // Will map to first_name
          family_name: claims.family_name,    // Will map to last_name
          picture: claims.picture,
          nickname: claims.nickname
        });
        console.log('User synced to database successfully');
      } catch (error) {
        console.error('Error syncing Auth0 user:', error);
      }
    }
    next();
  };

  // Role checking middleware
  const requireRole = (role) => {
    return async (req, res, next) => {
      try {
        const claims = req.auth.payload;
        const user = await userModel.findByAuth0Id(claims.sub);
        
        if (!user) {
          return res.status(404).json({ ok: false, error: 'User not found' });
        }
        
        const hasRole = await userModel.hasRole(user.id, role);
        if (!hasRole) {
          return res.status(403).json({ 
            ok: false, 
            error: `Access denied. Required role: ${role}` 
          });
        }
        
        next();
      } catch (error) {
        console.error('Error in requireRole middleware:', error);
        res.status(500).json({ ok: false, error: 'Internal server error' });
      }
    };
  };

  // Check multiple roles middleware
  const requireAnyRole = (roles) => {
    return async (req, res, next) => {
      try {
        const claims = req.auth.payload;
        const user = await userModel.findByAuth0Id(claims.sub);
        
        if (!user) {
          return res.status(404).json({ ok: false, error: 'User not found' });
        }
        
        let hasAnyRole = false;
        for (const role of roles) {
          if (await userModel.hasRole(user.id, role)) {
            hasAnyRole = true;
            break;
          }
        }
        
        if (!hasAnyRole) {
          return res.status(403).json({ 
            ok: false, 
            error: `Access denied. Required one of roles: ${roles.join(', ')}` 
          });
        }
        
        next();
      } catch (error) {
        console.error('Error in requireAnyRole middleware:', error);
        res.status(500).json({ ok: false, error: 'Internal server error' });
      }
    };
  };

  // Admin only middleware
  const requireAdmin = requireRole('admin');

  // Check if user has permission to access any dashboard
  const requireAnyDashboardAccess = async (req, res, next) => {
    try {
      const claims = req.auth.payload;
      const user = await userModel.findByAuth0Id(claims.sub);
      
      if (!user) {
        return res.status(404).json({ ok: false, error: 'User not found' });
      }
      
      const hasAnyRole = await userModel.hasAnyRole(user.id);
      if (!hasAnyRole) {
        return res.status(403).json({ 
          ok: false, 
          error: 'No dashboard access. Please contact administrator to assign roles.' 
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in requireAnyDashboardAccess middleware:', error);
      res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  };

  // ========== ROUTES ==========

  // Get current user profile (with role information)
  router.get('/me', requireAuth, syncAuth0User, async (req, res) => {
    try {
      const claims = req.auth.payload;
      const user = await userModel.findByAuth0Id(claims.sub);
      
      if (!user) {
        return res.status(404).json({ ok: false, error: 'User not found in database' });
      }
      
      // Get user roles
      const roles = await userModel.getUserRoles(user.id);
      const roleNames = roles.map(r => r.role);
      const primaryRole = await userModel.getPrimaryRole(user.id);
      
      res.json({ 
        ok: true, 
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          email_verified: user.email_verified,
          picture: user.picture,
          created_at: user.created_at,
          roles: roleNames,
          primary_role: primaryRole,
          has_any_role: roleNames.length > 0
        }
      });
    } catch (error) {
      console.error('Error in /api/auth/me:', error);
      res.status(500).json({ ok: false, error: 'Failed to get user profile' });
    }
  });

  // Secure endpoint example
  router.get('/secure', requireAuth, syncAuth0User, (req, res) => {
    res.json({ 
      ok: true, 
      sub: req.auth.payload.sub,
      message: 'User authenticated and synced to database'
    });
  });

  // Manual user sync endpoint
  router.post('/sync', requireAuth, async (req, res) => {
    try {
      const claims = req.auth.payload;
      const user = await userModel.createOrUpdateAuth0User({
        sub: claims.sub,
        email: claims.email,
        email_verified: claims.email_verified || false,
        given_name: claims.given_name,
        family_name: claims.family_name,
        picture: claims.picture,
        nickname: claims.nickname
      });
      
      res.json({ 
        ok: true, 
        message: 'User synced successfully',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,  
          last_name: user.last_name     
        }
      });
    } catch (error) {
      console.error('Error in /api/auth/sync:', error);
      res.status(500).json({ ok: false, error: 'Failed to sync user' });
    }
  });

  // Main dashboard entry - redirect based on primary role
  router.get('/dashboard', requireAuth, requireAnyDashboardAccess, async (req, res) => {
    try {
      const claims = req.auth.payload;
      const user = await userModel.findByAuth0Id(claims.sub);
      const primaryRole = await userModel.getPrimaryRole(user.id);
      
      // Redirect to appropriate dashboard based on primary role
      switch (primaryRole) {
        case 'admin':
          return res.json({ 
            ok: true, 
            redirect_to: '/api/auth/admin-dashboard',
            role: 'admin',
            message: 'Redirecting to admin dashboard'
          });
        case 'teacher':
          return res.json({ 
            ok: true, 
            redirect_to: '/api/auth/teacher-dashboard',
            role: 'teacher', 
            message: 'Redirecting to teacher dashboard'
          });
        case 'student':
          return res.json({ 
            ok: true, 
            redirect_to: '/api/auth/student-dashboard',
            role: 'student',
            message: 'Redirecting to student dashboard'
          });
        default:
          return res.status(403).json({ 
            ok: false, 
            error: 'No valid role assigned' 
          });
      }
    } catch (error) {
      console.error('Error in /api/auth/dashboard:', error);
      res.status(500).json({ ok: false, error: 'Failed to determine dashboard' });
    }
  });

  // Role-specific dashboards
  router.get('/admin-dashboard', requireAuth, requireRole('admin'), (req, res) => {
    res.json({ 
      ok: true, 
      message: 'Welcome to admin dashboard',
      access: 'Full system access including user management'
    });
  });

  router.get('/teacher-dashboard', requireAuth, requireRole('teacher'), (req, res) => {
    res.json({ 
      ok: true, 
      message: 'Welcome to teacher dashboard',
      access: 'Teaching materials and student management'
    });
  });

  router.get('/student-dashboard', requireAuth, requireRole('student'), (req, res) => {
    res.json({ 
      ok: true, 
      message: 'Welcome to student dashboard',
      access: 'Course materials and assignments'
    });
  });

  // ========== ADMIN ONLY: USER ROLE MANAGEMENT ==========

  // Get all users list (with role information)
  router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.email_verified, u.created_at,
          COALESCE(
            json_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), 
            '[]'
          ) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `);
      
      res.json({ 
        ok: true, 
        users: result.rows 
      });
    } catch (error) {
      console.error('Error getting users list:', error);
      res.status(500).json({ ok: false, error: 'Failed to get users list' });
    }
  });

  // Assign role to user
  router.post('/admin/assign-role', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId, role } = req.body;
      
      if (!['student', 'teacher', 'admin'].includes(role)) {
        return res.status(400).json({ ok: false, error: 'Invalid role' });
      }
      
      const result = await userModel.assignRole(userId, role);
      res.json({ 
        ok: true, 
        message: `Role ${role} assigned successfully`,
        assignment: result 
      });
    } catch (error) {
      console.error('Error assigning role:', error);
      res.status(500).json({ ok: false, error: 'Failed to assign role' });
    }
  });

  // Remove specific role from user
  router.post('/admin/remove-role', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId, role } = req.body;
      
      if (!['student', 'teacher', 'admin'].includes(role)) {
        return res.status(400).json({ ok: false, error: 'Invalid role' });
      }
      
      const result = await userModel.removeRole(userId, role);
      
      if (!result) {
        return res.status(404).json({ 
          ok: false, 
          error: 'Role assignment not found' 
        });
      }
      
      res.json({ 
        ok: true, 
        message: `Role ${role} removed successfully`,
        removed: result 
      });
    } catch (error) {
      console.error('Error removing role:', error);
      res.status(500).json({ ok: false, error: 'Failed to remove role' });
    }
  });

  // Delete user (admin only)
  router.delete('/admin/users/:userId', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      const deletedUser = await userModel.deleteUser(userId);
      
      if (!deletedUser) {
        return res.status(404).json({ 
          ok: false, 
          error: 'User not found' 
        });
      }
      
      res.json({ 
        ok: true, 
        message: 'User deleted successfully',
        deleted_user: deletedUser 
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ ok: false, error: 'Failed to delete user' });
    }
  });

  // Get user details (with all roles)
  router.get('/admin/users/:userId', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user basic info
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ ok: false, error: 'User not found' });
      }
      
      // Get user roles
      const roles = await userModel.getUserRoles(userId);
      
      res.json({ 
        ok: true, 
        user: {
          ...user,
          roles: roles
        }
      });
    } catch (error) {
      console.error('Error getting user details:', error);
      res.status(500).json({ ok: false, error: 'Failed to get user details' });
    }
  });

  return router;
};