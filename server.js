require("dotenv").config();

const express = require("express");
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./src/config/database');
const startAuctionLifecycle = require("./src/jobs/auctionLifeCycle");
const socketHandler = require("./src/socket/socketHandler");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.set("io", io);

app.use(cors());
app.use(express.json());

const authRoute= require('./src/routes/authRoute');
const auctionRoute=require('./src/routes/auctionRoute');
const bidRoute=require('./src/routes/bidRoutes');

app.use('/api/auth',authRoute);
app.use('/api/auction',auctionRoute);
app.use('/api/bid',bidRoute);

socketHandler(io);

const PORT = process.env.PORT || 3000;

connectDB()
.then(()=>{
    startAuctionLifecycle();
    server.listen(PORT,()=>{
        console.log(`Server listening on port ${PORT}`);
    })
})
.catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
});