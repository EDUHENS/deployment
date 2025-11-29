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

        // Some IdP / token configurations don't include profile claims in the access token.
        // Fall back to /userinfo when email is missing.
        let email = claims.email;
        let given_name = claims.given_name;
        let family_name = claims.family_name;
        let picture = claims.picture;
        let nickname = claims.nickname;

        try {
          if (!email) {
            const authz = req.headers?.authorization || '';
            const m = authz.match(/Bearer\s+(.+)/i);
            const token = m ? m[1] : null;
            const domain = (process.env.AUTH0_DOMAIN || '').trim();
            if (token && domain) {
              const resp = await fetch(`https://${domain}/userinfo`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (resp.ok) {
                const u = await resp.json();
                email = u.email || email;
                given_name = u.given_name || given_name;
                family_name = u.family_name || family_name;
                picture = u.picture || picture;
                nickname = u.nickname || nickname;
                console.log('Fetched userinfo from Auth0 to complete profile');
              } else {
                console.warn('Failed to fetch /userinfo:', resp.status, resp.statusText);
              }
            }
          }
        } catch (e) {
          console.warn('Error fetching /userinfo fallback:', e);
        }

        if (!email) {
          const fallbackEmail = `${claims.sub.replace(/[^a-zA-Z0-9]/g, '_')}@noemail.local`;
          console.warn('Auth0 profile has no email. Using fallback:', fallbackEmail);
          email = fallbackEmail;
        }

        await userModel.createOrUpdateAuth0User({
          sub: claims.sub,
          email,
          email_verified: claims.email_verified || false,
          given_name,
          family_name,
          picture,
          nickname,
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

  // Admin only middleware (role-based or email allowlist for bootstrap)
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const requireAdmin = async (req, res, next) => {
    try {
      const claims = req.auth.payload;
      const user = await userModel.findByAuth0Id(claims.sub);
      if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

      const hasAdminRole = await userModel.hasRole(user.id, 'admin');
      const allowlisted = ADMIN_EMAILS.includes((user.email || '').toLowerCase());
      if (!hasAdminRole && !allowlisted) {
        return res.status(403).json({ ok: false, error: 'Admin access required' });
      }
      next();
    } catch (error) {
      console.error('Error in requireAdmin middleware:', error);
      res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  };

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
      console.log('🔐 [AUTH /me] get request');
      console.log('🔐 [AUTH /me] Headers:', {
      authorization: req.headers.authorization ? '有 token' : '無 token',
      origin: req.headers.origin,
      host: req.headers.host
    });
      const rawAuth = req.headers?.authorization || '';
      console.log('[API /me] Authorization header present:', rawAuth ? 'yes' : 'no');
      if (rawAuth) {
        console.log('[API /me] Authorization (first 16 chars):', rawAuth.substring(0, 16) + '...');
      }
      const claims = req.auth.payload;
      const user = await userModel.findByAuth0Id(claims.sub);
      
      if (!user) {
        return res.status(404).json({ ok: false, error: 'User not found in database' });
      }
      
      // Get user roles
      const roles = await userModel.getUserRoles(user.id);
      const roleNames = roles.map(r => r.role);
      const primaryRole = await userModel.getPrimaryRole(user.id);
      
      const displayName = (user.name || '').trim() || user.email || 'User';
      res.json({ 
        ok: true, 
        user: {
          id: user.id,
          email: user.email,
          name: displayName,
          full_name: displayName,
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

  // Update current user's profile (name, picture)
  router.patch('/me', requireAuth, async (req, res) => {
    try {
      const claims = req.auth.payload;
      const user = await userModel.findByAuth0Id(claims.sub);
      if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

      const { name, full_name, picture } = req.body || {};
      const trimmedName = [name, full_name]
        .find((val) => typeof val === 'string' && val.trim().length > 0);
      const normalizedName = typeof trimmedName === 'string' ? trimmedName.trim() : undefined;

      const updated = await userModel.updateUserProfile(user.id, {
        name: normalizedName,
        picture: typeof picture === 'string' ? picture : undefined,
      });

      // also return roles and primary role to keep caller in sync
      const roles = await userModel.getUserRoles(updated.id);
      const roleNames = roles.map(r => r.role);
      const primaryRole = await userModel.getPrimaryRole(updated.id);

      const displayName = (updated.name || '').trim() || updated.email || 'User';
      res.json({
        ok: true,
        user: {
          id: updated.id,
          email: updated.email,
          name: displayName,
          full_name: displayName,
          email_verified: updated.email_verified,
          picture: updated.picture,
          created_at: updated.created_at,
          roles: roleNames,
          primary_role: primaryRole,
          has_any_role: roleNames.length > 0,
        }
      });
    } catch (error) {
      console.error('Error in PATCH /api/auth/me:', error);
      res.status(500).json({ ok: false, error: 'Failed to update user profile' });
    }
  });

  // Allow authenticated users to self-assign specific roles (educator/student dashboard access)
  router.post('/me/roles', requireAuth, syncAuth0User, async (req, res) => {
    try {
      const { role } = req.body || {};
      console.log('[POST /me/roles] Requested role:', role);
      const allowed = ['student', 'teacher'];
      if (!allowed.includes(role)) {
        console.error('[POST /me/roles] Invalid role requested:', role);
        return res.status(400).json({ ok: false, error: 'Invalid role' });
      }
      const claims = req.auth.payload;
      console.log('[POST /me/roles] Auth0 sub:', claims.sub);
      const user = await userModel.findByAuth0Id(claims.sub);
      if (!user) {
        console.error('[POST /me/roles] User not found in database for sub:', claims.sub);
        return res.status(404).json({ ok: false, error: 'User not found' });
      }
      console.log('[POST /me/roles] User found:', user.id, user.email);
      const assignment = await userModel.assignRole(user.id, role);
      console.log('[POST /me/roles] Role assignment result:', assignment);
      const roles = await userModel.getUserRoles(user.id);
      console.log('[POST /me/roles] User roles after assignment:', roles.map((r) => r.role));
      res.json({
        ok: true,
        role,
        assigned: Boolean(assignment),
        roles: roles.map((r) => r.role),
      });
    } catch (error) {
      console.error('[POST /me/roles] Error assigning self-role:', error);
      res.status(500).json({ ok: false, error: 'Failed to assign role' });
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
          name: user.name
        }
      });
    } catch (error) {
      console.error('Error in /api/auth/sync:', error);
      res.status(500).json({ ok: false, error: 'Failed to sync user' });
    }
  });

  // ===== Admin management APIs =====
  // List users with roles
  router.get('/users', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { limit, offset } = req.query;
      const users = await userModel.listUsersWithRoles(
        Number(limit) || 200,
        Number(offset) || 0
      );
      res.json({ ok: true, users });
    } catch (error) {
      console.error('Error in GET /api/auth/users:', error);
      res.status(500).json({ ok: false, error: 'Failed to list users' });
    }
  });

  // Assign role to user
  router.post('/users/:id/roles', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body || {};
      if (!role) return res.status(400).json({ ok: false, error: 'Missing role' });
      await userModel.assignRole(id, role);
      const roles = await userModel.getUserRoles(id);
      res.json({ ok: true, roles });
    } catch (error) {
      console.error('Error in POST /api/auth/users/:id/roles:', error);
      res.status(500).json({ ok: false, error: 'Failed to assign role' });
    }
  });

  // Remove role from user
  router.delete('/users/:id/roles/:role', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id, role } = req.params;
      await userModel.removeRole(id, role);
      const roles = await userModel.getUserRoles(id);
      res.json({ ok: true, roles });
    } catch (error) {
      console.error('Error in DELETE /api/auth/users/:id/roles/:role:', error);
      res.status(500).json({ ok: false, error: 'Failed to remove role' });
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
          u.id, u.email, u.name, u.email_verified, u.created_at,
          COALESCE(
            json_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), 
            '[]'
          ) as roles
        FROM public.users u
        LEFT JOIN public.user_roles ur ON u.id = ur.user_id
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
