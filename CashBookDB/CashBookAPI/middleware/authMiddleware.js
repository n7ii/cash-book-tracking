// This is a security check point. before request can get to its final destination it must pass this check point first
// the middleware's only job is check if the user has a valid ID 

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next)=>{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null){
        return res.status(401).send('Authentication token required.');
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, userPayload)=>{
        if (err){
            return res.status(403).send('Invalid or expired token.');
        }

        req.user = userPayload;
        next();
    });

};

module.exports = authMiddleware;