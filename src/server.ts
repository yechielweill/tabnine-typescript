// src/server.ts
import express from 'express';
import bodyParser from 'body-parser';
import { IQueue } from './IQueue';
import { StandardQueue } from './StandardQueue';
import { DEFAULT_TIMEOUT } from './config';

const app = express();
const port = process.env.PORT || 3000;  // Use PORT from environment or default to 3000
const queues: Map<string, IQueue<any>> = new Map();

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Welcome to the Queue Management API. Use /api/:queue_name to interact with queues.');
});

// POST /api/:queue_name
app.post('/api/:queue_name', (req, res) => {
    const { queue_name } = req.params;
    const message = req.body;
    const priority = req.body.priority || 0;

    if (!queues.has(queue_name)) {
        queues.set(queue_name, new StandardQueue<any>());
    }

    queues.get(queue_name)!.enqueue(message, priority);
    res.status(200).send('Message added to queue');
});

// GET /api/:queue_name?timeout=ms
app.get('/api/:queue_name', async (req, res) => {
    const { queue_name } = req.params;
    const timeout = parseInt(req.query.timeout as string) || DEFAULT_TIMEOUT;

    if (!queues.has(queue_name)) {
        return res.status(204).send();
    }

    const queue = queues.get(queue_name)!;
    if (!queue.isEmpty()) {
        const message = queue.dequeue();
        return res.status(200).json(message);
    }

    // If queue is empty, wait for messages up to timeout
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (!queue.isEmpty()) {
            const message = queue.dequeue();
            return res.status(200).json(message);
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100ms
    }

    res.status(204).send();
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
