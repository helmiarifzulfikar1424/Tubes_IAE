const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const axios = require('axios');

// Definisi URL Service (Docker container names)
const SERVICES = {
    servicePackage: 'http://service-package:3001',
    transaction:    'http://transaction-service:3002',
    customer:       'http://customer-service:3003',
    report:         'http://report-service:8000'
};

// Type Definitions (Schema)
const typeDefs = `#graphql
  type Package {
    id: Int!
    name: String!
    harga_per_kg: Int!
  }

  type Customer {
    id: Int!
    nama: String!
    nomor_hp: String!
    alamat: String!
  }

  type Transaction {
    id: String!
    customer_id: Int
    customer: Customer
    service_id: Int
    package: Package
    service_name: String
    berat_kg: Float!
    total_harga: Int!
    status: String!
  }

  type ReportData {
    total_transaksi: Int!
    total_pendapatan: Int!
    keterangan: String
  }

  type Report {
    service: String!
    data: ReportData!
  }

  type Query {
    packages: [Package]
    package(id: Int!): Package
    customers: [Customer]
    customer(id: Int!): Customer
    transactions: [Transaction]
    report: Report
  }

  type Mutation {
    addCustomer(nama: String!, nomor_hp: String!, alamat: String!): Customer
    addTransaction(customer_id: Int!, service_id: Int!, berat_kg: Float!): Transaction
  }
`;

// Resolvers
const resolvers = {
    Query: {
        packages: async () => {
            const res = await axios.get(`${SERVICES.servicePackage}/services`);
            return res.data.data;
        },
        package: async (_, { id }) => {
            const res = await axios.get(`${SERVICES.servicePackage}/services/${id}`);
            return res.data.data;
        },
        customers: async () => {
            const res = await axios.get(`${SERVICES.customer}/customers`);
            return res.data.data;
        },
        customer: async (_, { id }) => {
            const res = await axios.get(`${SERVICES.customer}/customers/${id}`);
            return res.data.data;
        },
        transactions: async () => {
            const res = await axios.get(`${SERVICES.transaction}/transactions`);
            return res.data.data;
        },
        report: async () => {
            const res = await axios.get(`${SERVICES.report}/reports`);
            return res.data;
        }
    },
    Transaction: {
        id: (parent) => parent._id || parent.id,
        customer: async (parent) => {
            try {
                const res = await axios.get(`${SERVICES.customer}/customers/${parent.customer_id}`);
                return res.data.data;
            } catch (e) {
                return null;
            }
        },
        package: async (parent) => {
            try {
                const res = await axios.get(`${SERVICES.servicePackage}/services/${parent.service_id}`);
                return res.data.data;
            } catch (e) {
                return null;
            }
        }
    },
    Mutation: {
        addCustomer: async (_, { nama, nomor_hp, alamat }) => {
            const res = await axios.post(`${SERVICES.customer}/customers`, { nama, nomor_hp, alamat });
            // API Flask return {"message": ..., "id": ...}
            return { id: res.data.id, nama, nomor_hp, alamat };
        },
        addTransaction: async (_, { customer_id, service_id, berat_kg }) => {
            const res = await axios.post(`${SERVICES.transaction}/transactions`, { customer_id, service_id, berat_kg });
            return res.data.data;
        }
    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

startStandaloneServer(server, {
    listen: { port: 4000 },
}).then(({ url }) => {
    console.log(`GraphQL Gateway siap di: ${url}`);
});
