/**
 * Service pour la gestion des membres
 * Gère les opérations liées aux membres de la communauté C2P
 */

const Membre = require('../modeles/Membre');
const logger = require('../utilitaires/logger');
const serviceWhatsApp = require('./serviceWhatsApp');

/**
 * Service pour gérer les opérations liées aux membres
 */
class ServiceMembre {
  /**
   * Crée un nouveau membre dans la base de données
   * @param {object} donneesMembre - Données du nouveau membre
   * @returns {Promise<object>} Le membre créé
   */
  async creerMembre(donneesMembre) {
    try {
      // Vérifier si le membre existe déjà
      const membreExistant = await Membre.findOne({ numeroWhatsApp: donneesMembre.numeroWhatsApp });
      
      if (membreExistant) {
        logger.info(`Le membre avec le numéro ${donneesMembre.numeroWhatsApp} existe déjà`);
        return membreExistant;
      }
      
      // Créer un nouveau membre
      const nouveauMembre = new Membre(donneesMembre);
      await nouveauMembre.save();
      
      logger.info(`Nouveau membre créé: ${nouveauMembre.nom} (${nouveauMembre.numeroWhatsApp})`);
      return nouveauMembre;
    } catch (erreur) {
      logger.error(`Erreur lors de la création du membre: ${erreur.message}`);
      throw erreur;
    }
  }

  /**
   * Récupère un membre par son numéro WhatsApp
   * @param {string} numeroWhatsApp - Numéro WhatsApp du membre
   * @returns {Promise<object|null>} Le membre trouvé ou null
   */
  async trouverMembreParNumero(numeroWhatsApp) {
    try {
      // Normaliser le numéro (supprimer le préfixe "whatsapp:" s'il existe)
      const numeroNormalise = numeroWhatsApp.replace('whatsapp:', '');
      
      // Chercher le membre
      const membre = await Membre.findOne({ 
        numeroWhatsApp: { $in: [numeroWhatsApp, numeroNormalise] } 
      });
      
      return membre;
    } catch (erreur) {
      logger.error(`Erreur lors de la recherche du membre: ${erreur.message}`);
      throw erreur;
    }
  }

  /**
   * Vérifie si un numéro WhatsApp correspond à un membre existant
   * @param {string} numeroWhatsApp - Numéro WhatsApp à vérifier
   * @returns {Promise<boolean>} True si le membre existe, false sinon
   */
  async estMembreExistant(numeroWhatsApp) {
    const membre = await this.trouverMembreParNumero(numeroWhatsApp);
    return !!membre;
  }

  /**
   * Met à jour les informations d'un membre
   * @param {string} numeroWhatsApp - Numéro WhatsApp du membre
   * @param {object} miseAJour - Données à mettre à jour
   * @returns {Promise<object|null>} Le membre mis à jour ou null
   */
  async mettreAJourMembre(numeroWhatsApp, miseAJour) {
    try {
      const membreModifie = await Membre.findOneAndUpdate(
        { numeroWhatsApp: numeroWhatsApp },
        { $set: miseAJour },
        { new: true }
      );
      
      if (membreModifie) {
        logger.info(`Membre mis à jour: ${membreModifie.nom} (${membreModifie.numeroWhatsApp})`);
      } else {
        logger.warn(`Tentative de mise à jour d'un membre inexistant: ${numeroWhatsApp}`);
      }
      
      return membreModifie;
    } catch (erreur) {
      logger.error(`Erreur lors de la mise à jour du membre: ${erreur.message}`);
      throw erreur;
    }
  }

  /**
   * Met à jour la progression d'un membre sur une thématique
   * @param {string} numeroWhatsApp - Numéro WhatsApp du membre
   * @param {string} thematique - Thématique du langage C
   * @param {number} progression - Valeur de progression (pourcentage)
   * @returns {Promise<object|null>} Le membre mis à jour ou null
   */
  async mettreAJourProgression(numeroWhatsApp, thematique, progression) {
    try {
      const membre = await this.trouverMembreParNumero(numeroWhatsApp);
      
      if (!membre) {
        logger.warn(`Membre non trouvé: ${numeroWhatsApp}`);
        return null;
      }
      
      // Mettre à jour la progression
      const miseAJour = {};
      miseAJour[`progressionLanguageC.${thematique}`] = progression;
      
      const membreModifie = await Membre.findByIdAndUpdate(
        membre._id,
        { $set: miseAJour },
        { new: true }
      );
      
      logger.info(`Progression mise à jour pour ${membre.nom}: ${thematique} = ${progression}%`);
      return membreModifie;
    } catch (erreur) {
      logger.error(`Erreur lors de la mise à jour de la progression: ${erreur.message}`);
      throw erreur;
    }
  }

  /**
   * Ajoute un quiz complété au profil du membre
   * @param {string} numeroWhatsApp - Numéro WhatsApp du membre
   * @param {string} quizId - ID du quiz complété
   * @param {number} score - Score obtenu au quiz
   * @returns {Promise<object|null>} Le membre mis à jour ou null
   */
  async ajouterQuizComplete(numeroWhatsApp, quizId, score) {
    try {
      const membre = await this.trouverMembreParNumero(numeroWhatsApp);
      
      if (!membre) {
        logger.warn(`Membre non trouvé: ${numeroWhatsApp}`);
        return null;
      }
      
      // Ajouter le quiz complété
      membre.quizCompletes.push({
        quizId,
        score,
        date: new Date()
      });
      
      await membre.save();
      logger.info(`Quiz complété ajouté pour ${membre.nom}: ${quizId} avec score ${score}%`);
      
      return membre;
    } catch (erreur) {
      logger.error(`Erreur lors de l'ajout du quiz complété: ${erreur.message}`);
      throw erreur;
    }
  }

  /**
   * Envoie un message de bienvenue à un nouveau membre
   * @param {string} numeroWhatsApp - Numéro WhatsApp du membre
   * @returns {Promise<object>} Résultat de l'envoi du message
   */
  async envoyerMessageBienvenue(numeroWhatsApp) {
    try {
      const messageBienvenue = `👋 *Bienvenue dans la communauté C2P (C 1er Pas)* ! Je suis le bot assistant du groupe. Pour mieux te connaître et personnaliser ton expérience, merci de te présenter en répondant aux questions suivantes :

1️⃣ Ton nom et prénom :
2️⃣ Ton pays :
3️⃣ Ton école/université :
4️⃣ Ta faculté/domaine d'études :
5️⃣ Ton niveau d'étude actuel :
6️⃣ Ta motivation pour rejoindre C2P et ce que tu souhaites apprendre :

Une fois ta présentation complétée, je t'enverrai des ressources pour démarrer avec le langage C et te tiendrai informé(e) des prochaines séances ! 🚀`;

      return serviceWhatsApp.envoyerMessage(numeroWhatsApp, messageBienvenue);
    } catch (erreur) {
      logger.error(`Erreur lors de l'envoi du message de bienvenue: ${erreur.message}`);
      throw erreur;
    }
  }

  /**
   * Enregistre une question posée par un membre
   * @param {string} numeroWhatsApp - Numéro WhatsApp du membre
   * @param {string} question - Question posée
   * @returns {Promise<object|null>} Le membre mis à jour ou null
   */
  async enregistrerQuestion(numeroWhatsApp, question) {
    try {
      const membre = await this.trouverMembreParNumero(numeroWhatsApp);
      
      if (!membre) {
        logger.warn(`Membre non trouvé: ${numeroWhatsApp}`);
        return null;
      }
      
      // Ajouter la question à l'historique
      membre.questionsRecentes.push({
        texte: question,
        date: new Date(),
        repondue: false
      });
      
      // Ne garder que les 10 questions les plus récentes
      if (membre.questionsRecentes.length > 10) {
        membre.questionsRecentes = membre.questionsRecentes.slice(-10);
      }
      
      // Mettre à jour la date de dernière activité
      membre.derniereActivite = new Date();
      
      await membre.save();
      logger.info(`Question enregistrée pour ${membre.nom}: "${question.substring(0, 50)}..."`);
      
      return membre;
    } catch (erreur) {
      logger.error(`Erreur lors de l'enregistrement de la question: ${erreur.message}`);
      throw erreur;
    }
  }

  /**
   * Récupère les membres inactifs depuis une certaine période
   * @param {number} joursInactivite - Nombre de jours d'inactivité
   * @returns {Promise<Array>} Liste des membres inactifs
   */
  async trouverMembresInactifs(joursInactivite = 30) {
    try {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - joursInactivite);
      
      const membresInactifs = await Membre.find({
        derniereActivite: { $lt: dateLimit },
        actif: true
      });
      
      logger.info(`${membresInactifs.length} membres inactifs depuis plus de ${joursInactivite} jours trouvés`);
      return membresInactifs;
    } catch (erreur) {
      logger.error(`Erreur lors de la recherche des membres inactifs: ${erreur.message}`);
      throw erreur;
    }
  }
}

// Exporter une instance unique du service
module.exports = new ServiceMembre();