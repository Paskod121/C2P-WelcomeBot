/**
 * Configuration de la base de données MongoDB
 * Ce fichier gère la connexion à MongoDB pour stocker les profils et les données
 */

const mongoose = require('mongoose');
const config = require('./config');
const logger = require('../utilitaires/logger');

// Options de connexion MongoDB
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

/**
 * Connexion à la base de données MongoDB
 * @returns {Promise<void>} Promesse résolue lorsque la connexion est établie
 */
const connecterBaseDeDonnees = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, options);
    logger.info('Connexion à MongoDB établie avec succès');
  } catch (erreur) {
    logger.error(`Erreur de connexion à MongoDB: ${erreur.message}`);
    // Attendre 5 secondes avant de réessayer
    setTimeout(connecterBaseDeDonnees, 5000);
  }
};

// Gestion des événements de connexion
mongoose.connection.on('error', (erreur) => {
  logger.error(`Erreur MongoDB: ${erreur.message}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Déconnexion de MongoDB, tentative de reconnexion...');
  connecterBaseDeDonnees();
});

// Gestion propre de la fermeture
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('Connexion MongoDB fermée suite à l\'arrêt de l\'application');
  process.exit(0);
});

module.exports = {
  connecterBaseDeDonnees,
  mongoose,
};