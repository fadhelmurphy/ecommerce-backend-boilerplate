export default () => ({
  port: Number.parseInt(process.env.PORT, 10) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",

  database: {
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    synchronize: process.env.NODE_ENV !== "production",
    ssl: process.env.DB_SSL === "true",
  },

  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || "http://localhost:9200",
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
    queues: {
      orders: "orders_queue",
      notifications: "notifications_queue",
    },
  },
})
