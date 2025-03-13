// After successful login/authentication, make sure the response is setting proper cookies

// Find the login function and ensure it's setting the cookie correctly
// For example, it might look something like this:

res.cookie("auth_token", generatedToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax", // Use 'none' if frontend and backend are on different domains in production
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: "/",
});

// Also make sure there's proper CORS configuration in the main server file
