import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://expense-tracker-backend-vrd8.onrender.com/api/transactions";

function App() {
    const [transactions, setTransactions] = useState([]);
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("expense");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Fetch all transactions from MongoDB through the backend
    const fetchTransactions = async () => {
        try {
            setError("");

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Unable to load transactions.");
            }

            const data = await response.json();

            setTransactions(data);
        } catch (err) {
            console.error("Fetch error:", err);
            setError(
                "Unable to connect to the backend. Please check your server."
            );
        } finally {
            setLoading(false);
        }
    };

    // Load transactions when the page opens
    useEffect(() => {
        fetchTransactions();
    }, []);

    // Calculate total income
    const totalIncome = transactions
        .filter((transaction) => transaction.type === "income")
        .reduce(
            (total, transaction) => total + Number(transaction.amount),
            0
        );

    // Calculate total expenses
    const totalExpenses = transactions
        .filter((transaction) => transaction.type === "expense")
        .reduce(
            (total, transaction) => total + Number(transaction.amount),
            0
        );

    // Calculate balance
    const balance = totalIncome - totalExpenses;

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    // Add a new transaction
    const handleAddTransaction = async (event) => {
        event.preventDefault();

        setError("");

        if (!title.trim()) {
            setError("Please enter a transaction name.");
            return;
        }

        if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
            setError("Please enter a valid amount greater than zero.");
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: title.trim(),
                    amount: Number(amount),
                    type: type,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to add transaction."
                );
            }

            // Clear form
            setTitle("");
            setAmount("");
            setType("expense");

            // Reload saved transactions
            await fetchTransactions();
        } catch (err) {
            console.error("Add transaction error:", err);
            setError(err.message || "Failed to add transaction.");
        } finally {
            setSaving(false);
        }
    };

    // Delete a transaction using its MongoDB _id
    const handleDelete = async (transactionId) => {
        if (!transactionId) {
            setError("Transaction ID is missing. Please refresh the page.");
            return;
        }

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this transaction?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setError("");

            const response = await fetch(
                `${API_URL}/${encodeURIComponent(transactionId)}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to delete transaction."
                );
            }

            // Reload transactions after deletion
            await fetchTransactions();
        } catch (err) {
            console.error("Delete transaction error:", err);
            setError(err.message || "Failed to delete transaction.");
        }
    };

    return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
                <div>
                    <h1>Expense Tracker</h1>
                    <p>Track your money. Make smarter decisions.</p>
                </div>
            </header>

            {/* Dashboard Summary */}
            <section className="summary-cards">
                <div className="summary-card balance-card">
                    <h3>Total Balance</h3>
                    <h2>{formatCurrency(balance)}</h2>
                    <p>Your available balance</p>
                </div>

                <div className="summary-card income-card">
                    <h3>Total Income</h3>
                    <h2>{formatCurrency(totalIncome)}</h2>
                    <p>Money received</p>
                </div>

                <div className="summary-card expense-card">
                    <h3>Total Expenses</h3>
                    <h2>{formatCurrency(totalExpenses)}</h2>
                    <p>Money spent</p>
                </div>
            </section>

            {/* Main Content */}
            <main className="content-grid">
                {/* Add Transaction Form */}
                <section className="transaction-form-card">
                    <h2>Add Transaction</h2>
                    <p>Enter your income or expense details.</p>

                    <form onSubmit={handleAddTransaction}>
                        <div className="form-group">
                            <label htmlFor="title">
                                Transaction Name
                            </label>

                            <input
                                id="title"
                                type="text"
                                placeholder="e.g. Salary, Groceries"
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="amount">Amount (₹)</label>

                            <input
                                id="amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(event) =>
                                    setAmount(event.target.value)
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="type">Transaction Type</label>

                            <select
                                id="type"
                                value={type}
                                onChange={(event) =>
                                    setType(event.target.value)
                                }
                            >
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="add-transaction-btn"
                            disabled={saving}
                        >
                            {saving ? "Adding..." : "+ Add Transaction"}
                        </button>
                    </form>
                </section>

                {/* Recent Transactions */}
                <section className="recent-transactions-card">
                    <div className="transactions-header">
                        <div>
                            <h2>Recent Transactions</h2>
                            <p>Your latest money activity</p>
                        </div>

                        <span className="transaction-count">
                            {transactions.length}
                        </span>
                    </div>

                    {loading ? (
                        <p className="empty-message">
                            Loading transactions...
                        </p>
                    ) : transactions.length === 0 ? (
                        <p className="empty-message">
                            No transactions yet. Add your first transaction!
                        </p>
                    ) : (
                        <div className="transactions-list">
                            {transactions.map((transaction) => (
                                <div
                                    className="transaction-item"
                                    key={transaction._id}
                                >
                                    <div
                                        className={`transaction-icon ${
                                            transaction.type === "income"
                                                ? "income-icon"
                                                : "expense-icon"
                                        }`}
                                    >
                                        {transaction.type === "income"
                                            ? "↙"
                                            : "↗"}
                                    </div>

                                    <div className="transaction-info">
                                        <h3>{transaction.title}</h3>

                                        <p>
                                            {transaction.type === "income"
                                                ? "Income"
                                                : "Expense"}
                                        </p>
                                    </div>

                                    <div className="transaction-actions">
                                        <span
                                            className={`transaction-amount ${
                                                transaction.type === "income"
                                                    ? "positive-amount"
                                                    : "negative-amount"
                                            }`}
                                        >
                                            {transaction.type === "income"
                                                ? "+"
                                                : "-"}
                                            {formatCurrency(
                                                Number(transaction.amount)
                                            )}
                                        </span>

                                        <button
                                            type="button"
                                            className="delete-btn"
                                            onClick={() =>
                                                handleDelete(transaction._id)
                                            }
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Error Message */}
            {error && (
                <div className="error-message" role="alert">
                    {error}
                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Close error message"
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;