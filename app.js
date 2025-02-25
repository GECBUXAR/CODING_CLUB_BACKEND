import express from 'express';
import router from './routes/admin.route.js';
import eventRoutes from './routes/event.route.js';
import userRoutes from './routes/user.route.js';

const app = express();

app.use(express.json());

app.use('/admin', router);
app.use('/events', eventRoutes);
app.use('/users', userRoutes);

app.listen(4100, () => {
    console.log('Server is running on port 4100');
});
 export default app;