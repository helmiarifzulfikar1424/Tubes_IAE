const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
const PORT = 3002;

app.use(express.json());

// Konfigurasi koneksi MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://transaction_user:transaction_password@transaction-db:27017/transaction_db?authSource=admin';

// Definisi Schema & Model MongoDB
const transactionSchema = new mongoose.Schema({
    customer_id: { type: Number, required: true },
    customer_name: { type: String },
    service_id: { type: Number, required: true },
    service_name: { type: String },
    berat_kg: { type: Number, required: true },
    total_harga: { type: Number },
    status: { type: String, default: 'menunggu' },
    created_at: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Koneksi ke MongoDB dengan Retry
async function connectWithRetry(retries = 20, delay = 3000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(MONGO_URI);
            console.log('Transaction Service berhasil terhubung ke MongoDB');
            return;
        } catch (error) {
            console.log(`Menunggu MongoDB siap... percobaan ${attempt}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Tidak dapat terhubung ke MongoDB');
}

// Endpoint cek status
app.get('/health', (req, res) => {
    res.json({ service: 'transaction-service', database: 'mongodb', status: 'running' });
});

// Endpoint ambil semua transaksi
app.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.json({ service: 'transaction-service', data: transactions });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data transaksi', error: error.message });
    }
});

// Endpoint buat transaksi baru (komunikasi antar 3 service!)
app.post('/transactions', async (req, res) => {
    try {
        const { customer_id, service_id, berat_kg } = req.body;

        // 1. Panggil customer-service untuk ambil nama pelanggan
        const customerResponse = await axios.get(`http://customer-service:3003/customers/${customer_id}`);
        const customerData = customerResponse.data.data;

        // 2. Panggil service-package untuk ambil detail paket layanan
        const serviceResponse = await axios.get(`http://service-package:3001/services/${service_id}`);
        const serviceData = serviceResponse.data.data;

        // 3. Hitung total harga
        const total_harga = serviceData.harga_per_kg * berat_kg;

        // 4. Simpan transaksi ke MongoDB
        const transaction = new Transaction({
            customer_id,
            customer_name: customerData.nama,
            service_id,
            service_name: serviceData.name,
            berat_kg,
            total_harga,
            status: 'menunggu'
        });

        await transaction.save();
        res.status(201).json({ message: 'Transaksi berhasil dibuat', data: transaction });

    } catch (error) {
        // Tangkap error jika salah satu service gagal dihubungi
        res.status(500).json({ message: 'Gagal membuat transaksi', error: error.message });
    }
});

// Jalankan server
async function startServer() {
    await connectWithRetry();
    app.listen(PORT, () => {
        console.log(`Transaction Service berjalan pada port ${PORT}`);
    });
}

startServer();
