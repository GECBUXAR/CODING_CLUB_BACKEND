
import connectDB from './db.connect.js';
import app from './app.js'; 

import dotenv from 'dotenv';

dotenv.config({
    path: './.env'
  });
  


connectDB();

const port = 5000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});





