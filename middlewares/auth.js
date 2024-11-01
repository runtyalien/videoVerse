require('dotenv').config();

const STATIC_API_TOKEN = process.env.STATIC_API_TOKEN;

const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    
    if (!token) {
        return res.status(403).json({ message: 'Forbidden: No token provided' });
    }

    if (token !== `Bearer ${STATIC_API_TOKEN}`) {
        return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }

    next();
};

module.exports = authenticate;