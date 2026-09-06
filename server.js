require("dotenv").config();

const express = require("express");
// const http = require('http');
// const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./src/config/database');

const app = express();
// const server = http.createServer(app);

const startAuctionLifecycle = require("./src/jobs/auctionLifeCycle");

app.use(cors());
app.use(express.json());

const authRoute= require('./src/routes/authRoute');
const auctionRoute=require('./src/routes/auctionRoute');
const bidRoute=require('./src/routes/bidRoutes');

app.use('/api/auth',authRoute);
app.use('/api/auction',auctionRoute);
app.use('/api/bid',bidRoute);

connectDB()
.then(()=>{
    startAuctionLifecycle();
    app.listen(3000,()=>{
        console.log('listing at port 3000');
    })
})
.catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
});