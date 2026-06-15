require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.set("io", io);
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth",               require("./routes/auth"));
app.use("/api/hospitals",          require("./routes/hospitals"));
app.use("/api/organ-listings",     require("./routes/organListings"));
app.use("/api/organ-requests",     require("./routes/organRequests"));
app.use("/api/organ-applications", require("./routes/organApplications"));
app.use("/api/blockchain",         require("./routes/blockchain"));
app.use("/api/allocations",        require("./routes/allocations"));
app.use("/api/donors",             require("./routes/donors"));
app.use("/api/recipients",         require("./routes/recipients"));
app.use("/api/match",              require("./routes/match"));

app.get("/", (req, res) => res.json({ message: "OrganChain API running" }));

io.on("connection", (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);
  socket.on("disconnect", () => console.log(`[Socket] Disconnected: ${socket.id}`));
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => { console.error("MongoDB error:", err.message); process.exit(1); });
