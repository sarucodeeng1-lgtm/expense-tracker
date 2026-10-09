require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const Transaction = require("./models/Transaction");

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully!");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error.message);
    });

// Test route
app.get("/", (req, res) => {
    res.send("Expense Tracker API is running!");
});

// Get all transactions
app.get("/api/transactions", async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch transactions" });
    }
});

// Add a transaction
app.post("/api/transactions", async (req, res) => {
    try {
        const { title, amount, type } = req.body;

        if (
            typeof title !== "string" ||
            !title.trim() ||
            amount === undefined ||
            amount === null ||
            amount === "" ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0 ||
            !["income", "expense"].includes(type)
        ) {
            return res.status(400).json({
                message: "Please provide a valid title, amount and type"
            });
        }

        const transaction = await Transaction.create({
            title: title.trim(),
            amount: Number(amount),
            type
        });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: "Failed to add transaction" });
    }
});

// Delete a transaction
app.delete("/api/transactions/:id", async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndDelete(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        res.json({
            message: "Transaction deleted successfully"
        });

    } catch (error) {
        console.error("Delete error:", error);

        res.status(500).json({
            message: error.message
        });
    }
});
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});