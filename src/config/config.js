/**
 * Configuration de l'application
 * Ce fichier charge les variables d'environnement et définit les paramètres de l'application
 */

const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config();

// Configuration pour différents environnements
const env = process.env.NODE_ENV || 'development';

// Configuration commune à tous les environnements
const baseConfig = {
  app: {
    port: process.env.PORT || 3000,
    env: env,
  },
  whatsapp: {
    apiToken: process.env.WHATSAPP_API_TOKEN,
    numeroTelephone: process.env.WHATSAPP_NUMERO_TELEPHONE,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bot-c2p',
  },
  redis: {
    uri: process.env.REDIS_URI || 'redis://localhost:6379',
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'eu-west-3',
    s3Bucket: process.env.AWS_S3_BUCKET || 'bot-c2p-ressources',
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook',
  },
  langageC: {
    // Définir les thématiques du langage C pour les quiz et les connaissances
    thematiques: [
      'bases',
      'variables',
      'pointeurs',
      'structures',
      'fonctions',
      'allocation-memoire',
      'tableaux',
      'chaines',
      'fichiers',
      'preprocesseur',
    ],
  },
};

// Configurations spécifiques selon l'environnement
const envConfig = {
  development: {
    app: {
      logger: {
        level: 'debug',
      },
    },
  },
  production: {
    app: {
      logger: {
        level: 'info',
      },
    },
  },
  test: {
    app: {
      logger: {
        level: 'error',
      },
    },
    mongodb: {
      uri: 'mongodb://localhost:27017/bot-c2p-test',
    },
  },
};

// Fusionner les configurations
const config = {
  ...baseConfig,
  ...envConfig[env] || {},
};

module.exports = config;