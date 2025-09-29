const adminMiddleware = (req, res, next) => {
    // This middleware should always run AFTER the standard authMiddleware,
    // so we can trust that `req.user` already exists.
  
    // 1. Get the user's role ID from the token payload
    const roleId = req.user.roleId;
  
    // 2. Check if the role ID is for an Admin
    // Based on your database, the Admin role has RID = 1
    if (roleId !== 1) {
      // If the user is not an admin, block the request with a "Forbidden" error
      return res.status(403).send('Forbidden: Access is restricted to administrators.');
    }
  
    // 3. If the user is an admin, allow the request to continue
    next();
  };
  
  module.exports = adminMiddleware;