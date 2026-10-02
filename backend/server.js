const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

app.get('/api/expenses', async (req, res) => {
    try {
        const result = await pool.query("SELECT id, title, amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date FROM expenses");
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong' });
    }
});

app.get('/api/expenses/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query("SELECT id, title, amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date FROM expenses WHERE id = $1", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong' });
    }
});

app.post('/api/expenses', async (req, res) => {
    try {
        const title = req.body.title;
        const amount = req.body.amount;
        const category = req.body.category;
        const date = req.body.date;

        if (!title || !amount || !category || !date) {
            return res.status(400).json({ error: 'please fill all fields' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'amount must be more than 0' });
        }

        const result = await pool.query(
            "INSERT INTO expenses (title, amount, category, date) VALUES ($1, $2, $3, $4) RETURNING id, title, amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date",
            [title, amount, category, date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong' });
    }
});

app.put('/api/expenses/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const title = req.body.title;
        const amount = req.body.amount;
        const category = req.body.category;
        const date = req.body.date;

        if (!title || !amount || !category || !date) {
            return res.status(400).json({ error: 'please fill all fields' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'amount must be more than 0' });
        }

        const result = await pool.query(
            "UPDATE expenses SET title = $1, amount = $2, category = $3, date = $4 WHERE id = $5 RETURNING id, title, amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date",
            [title, amount, category, date, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong' });
    }
});

app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query("DELETE FROM expenses WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'not found' });
        }
        res.json({ message: 'deleted' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'something went wrong' });
    }
});

app.listen(port, () => {
    console.log('server started on port ' + port);
});