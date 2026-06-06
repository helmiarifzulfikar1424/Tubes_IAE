<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ReportController extends Controller
{
    public function health()
    {
        return response()->json([
            'service' => 'report-service',
            'database' => 'sqlite',
            'status' => 'running'
        ]);
    }

    public function getReport()
    {
        try {
            // Ambil data dari transaction-service
            $response = Http::get('http://transaction-service:3002/transactions');
            $transactions = $response->json()['data'] ?? [];
            
            // Hitung total pendapatan dan total transaksi
            $total_pendapatan = 0;
            foreach ($transactions as $t) {
                $total_pendapatan += $t['total_harga'] ?? 0;
            }

            return response()->json([
                'service' => 'report-service',
                'data' => [
                    'total_transaksi' => count($transactions),
                    'total_pendapatan' => $total_pendapatan,
                    'keterangan' => 'Laporan Keuangan Laundry (Via Controller)'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat laporan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
