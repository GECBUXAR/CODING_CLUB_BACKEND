import jwt from 'jsonwebtoken';

export const generateAccessToken = (user) => {
    const token = jwt.sign(
        {id: user._id },
         process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
   return token;
}
export const generateRefreshToken = (user) => {
    const token = jwt.sign(
        {id: user._id },
         process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }); 
   return token;
}
