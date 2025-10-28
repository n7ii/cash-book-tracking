require('dotenv').config();

const express = require('express');
const db = require('./db');
const cors = require('cors');


const userRoutes = require('./routes/userRoutes');
const collectionsRoutes = require('./routes/collectionsRoutes')
const expensesRoutes = require('./routes/expensesRoutes')
const adminRoutes = require('./routes/adminRoutes')
const loansRoutes = require('./routes/loansRoutes');
const customersRoutes = require('./routes/customersRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const marketsRoutes = require('./routes/marketsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const addressRoutes = require('./routes/addressRoutes');
const transactionsRoutes = require('./routes/transactionsRoutes');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json()); //this one called middleware to parse incoming Json data
app.use(express.static('public'));

app.get('/', (req, res)=>{
    res.send("Hello, Cash Book Tracking API");
})

app.use('/api/users', userRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/admin', adminRoutes)
app.use('/api/loans', loansRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/admin/reports', reportsRoutes);
app.use('/api/markets', marketsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/transactions', transactionsRoutes);

app.listen(port, () =>{
    console.log(`Server is running on http://localhost:${port}`);
})