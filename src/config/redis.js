/**
 * Configuration de Redis pour le cache
 * Ce fichier gère la connexion à Redis pour les opérations en temps réel
 */

const Redis = require('redis');
const config = require('./config');
const logger = require('../utilitaires/logger');

// Créer le client Redis
const client = Redis.createClient({
  url: config.redis.uri,
});

/**
 * Connecter au serveur Redis
 * @returns {Promise<void>} Promesse résolue lorsque la connexion est établie
 */
const connecterRedis = async () => {
  try {
    await client.connect();
    logger.info('Connexion à Redis établie avec succès');
  } catch (erreur) {
    logger.error(`Erreur de connexion à Redis: ${erreur.message}`);
    // Attendre 5 secondes avant de réessayer
    setTimeout(connecterRedis, 5000);
  }
};

// Gestion des événements
client.on('error', (erreur) => {
  logger.error(`Erreur Redis: ${erreur.message}`);
});

client.on('reconnecting', () => {
  logger.warn('Tentative de reconnexion à Redis...');
});

// Gestion propre de la fermeture
process.on('SIGINT', async () => {
  await client.quit();
  logger.info('Connexion Redis fermée suite à l\'arrêt de l\'application');
});

module.exports = {
  connecterRedis,
  client,
};