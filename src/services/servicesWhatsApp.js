/**
 * Service WhatsApp
 * Gère l'interaction avec l'API WhatsApp Business via Twilio
 */

const twilio = require('twilio');
const config = require('../config/config');
const logger = require('../utilitaires/logger');

// Initialiser le client Twilio
const client = twilio(config.twilio.accountSid, config.twilio.authToken);

/**
 * Service pour gérer les interactions WhatsApp
 */
class ServiceWhatsApp {
  /**
   * Envoie un message WhatsApp à un destinataire
   * @param {string} destinataire - Numéro WhatsApp du destinataire (format: whatsapp:+33600000000)
   * @param {string} message - Contenu du message à envoyer
   * @returns {Promise<object>} Réponse de l'API Twilio
   */
  async envoyerMessage(destinataire, message) {
    try {
      // Vérifier si le numéro commence par "whatsapp:"
      const numeroFormatte = destinataire.startsWith('whatsapp:') 
        ? destinataire 
        : `whatsapp:${destinataire}`;
      
      // Envoyer le message via Twilio
      const messageEnvoye = await client.messages.create({
        body: message,
        from: `whatsapp:${config.twilio.whatsappNumber}`,
        to: numeroFormatte
      });
      
      logger.info(`Message envoyé à ${destinataire}: ${messageEnvoye.sid}`);
      return messageEnvoye;
    } catch (erreur) {
      logger.error(`Erreur lors de l'envoi du message WhatsApp: ${erreur.message}`);
      throw erreur;
    }
  }

  /**
   * Envoie un message avec médias (image, document, etc.)
   * @param {string} destinataire - Numéro WhatsApp du destinataire
   * @param {string} message - Contenu du message
   * @param {string} mediaUrl - URL du média à envoyer
   * @returns {Promise<object>} Réponse de l'API Twilio
   */
  async envoyerMessageAvecMedia(destinataire, message, mediaUrl) {
    try {
      const numeroFormatte = destinataire.startsWith('whatsapp:') 
        ? destinataire 
        : `whatsapp:${destinataire}`;
      
      const messageEnvoye = await client.messages.create({
        body: message,
        from: `whatsapp:${config.twilio.whatsappNumber}`,
        to: numeroFormatte,
        mediaUrl: [mediaUrl]
      });
      
      logger.info(`Message avec média envoyé à ${destinataire}: ${messageEnvoye.sid}`);
      return messageEnvoye;
    } catch (erreur) {
      logger.error(`Erreur lors de l'envoi du message avec média: ${erreur.message}`);
      throw erreur;
    }
  }

  /**
   * Envoie un quiz formaté pour WhatsApp
   * @param {string} destinataire - Numéro WhatsApp du destinataire
   * @param {object} quiz - Objet quiz formaté
   * @returns {Promise<object>} Réponse de l'API Twilio
   */
  async envoyerQuiz(destinataire, quiz) {
    // Formater le quiz pour WhatsApp
    let messageQuiz = `🧠 *QUIZ: ${quiz.titre}* 🧠\n\n`;
    
    if (quiz.description) {
      messageQuiz += `${quiz.description}\n\n`;
    }
    
    // Ajouter chaque question et ses options
    quiz.questions.forEach((question, index) => {
      messageQuiz += `*Q${index + 1}: ${question.texte}*\n`;
      
      question.options.forEach(option => {
        messageQuiz += `${option.lettre}) ${option.texte}\n`;
      });
      
      messageQuiz += '\n';
    });
    
    messageQuiz += `⏱️ Durée estimée: ${quiz.dureeEstimee} minutes\n`;
    messageQuiz += `🕒 Les réponses correctes seront publiées dans 12 heures!\n`;
    messageQuiz += `Répondez en indiquant le numéro de question et votre choix (exemple: Q1-C, Q2-A, Q3-B)`;
    
    return this.envoyerMessage(destinataire, messageQuiz);
  }

  /**
   * Envoie les résultats d'un quiz
   * @param {string} destinataire - Numéro WhatsApp du destinataire
   * @param {object} resultats - Résultats du quiz
   * @returns {Promise<object>} Réponse de l'API Twilio
   */
  async envoyerResultatsQuiz(destinataire, resultats) {
    let messageResultats = `📊 *RÉSULTATS DU QUIZ* 📊\n\n`;
    messageResultats += `Score: ${resultats.score.toFixed(0)}% (${resultats.nombreCorrect}/${resultats.nombreTotal})\n\n`;
    
    // Ajouter le détail des réponses
    resultats.resultats.forEach((res, index) => {
      messageResultats += `*Q${index + 1}: ${res.question}*\n`;
      messageResultats += `Votre réponse: ${res.reponseChoisie}\n`;
      messageResultats += `${res.estCorrecte ? '✅ Correct' : '❌ Incorrect'}\n`;
      
      if (!res.estCorrecte && res.explication) {
        messageResultats += `📝 ${res.explication}\n`;
      }
      
      messageResultats += '\n';
    });
    
    // Ajouter un message d'encouragement basé sur le score
    if (resultats.score >= 80) {
      messageResultats += `🌟 Excellent travail! Continue comme ça!`;
    } else if (resultats.score >= 60) {
      messageResultats += `👍 Bon travail! Continue à pratiquer.`;
    } else {
      messageResultats += `💪 Continue tes efforts! N'hésite pas à revoir les concepts.`;
    }
    
    return this.envoyerMessage(destinataire, messageResultats);
  }

  /**
   * Envoie un rappel de séance formaté
   * @param {string} destinataire - Numéro WhatsApp du destinataire
   * @param {object} seance - Objet séance formaté
   * @returns {Promise<object>} Réponse de l'API Twilio
   */
  async envoyerRappelSeance(destinataire, seance) {
    // Formater la date de la séance
    const dateSeance = new Date(seance.date);
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit' 
    };
    const dateFormatee = dateSeance.toLocaleDateString('fr-FR', options);
    
    // Construire le message
    let messageRappel = `🗓️ *RAPPEL: PROCHAINE SÉANCE - ${seance.titre}* 🗓️\n\n`;
    messageRappel += `📆 Date et heure: ${dateFormatee}\n`;
    messageRappel += `⏱️ Durée: ${seance.duree} minutes\n\n`;
    
    // Ajouter les points abordés
    if (seance.pointsAbordes && seance.pointsAbordes.length > 0) {
      messageRappel += `🔍 *Points qui seront abordés:*\n`;
      seance.pointsAbordes.forEach(point => {
        messageRappel += `• ${point}\n`;
      });
      messageRappel += '\n';
    }
    
    // Ajouter les exercices préparatoires
    if (seance.exercicesPreparatoires && seance.exercicesPreparatoires.length > 0) {
      messageRappel += `📝 *Exercices préparatoires:*\n`;
      seance.exercicesPreparatoires.forEach((exercice, index) => {
        messageRappel += `${index + 1}. ${exercice.titre}\n   ${exercice.description}\n`;
        if (exercice.lien) {
          messageRappel += `   Lien: ${exercice.lien}\n`;
        }
      });
    }
    
    messageRappel += `\nN'oubliez pas d'apporter vos questions! À demain! 🚀`;
    
    return this.envoyerMessage(destinataire, messageRappel);
  }

  /**
   * Traite un message reçu
   * @param {string} expediteur - Numéro WhatsApp de l'expéditeur
   * @param {string} message - Contenu du message reçu
   * @returns {Promise<string>} Identifiant du message
   */
  async recevoirMessage(expediteur, message) {
    logger.info(`Message reçu de ${expediteur}: ${message}`);
    return {
      expediteur,
      message,
      timestamp: new Date(),
    };
  }
}

// Exporter une instance unique du service
module.exports = new ServiceWhatsApp();