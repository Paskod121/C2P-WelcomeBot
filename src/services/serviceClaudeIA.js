/**
 * Service pour l'intégration avec Claude IA d'Anthropic
 * Gère les requêtes à l'API Claude pour la génération de réponses pertinentes
 */

const axios = require('axios');
const config = require('../config/config');
const logger = require('../utilitaires/logger');

/**
 * Service pour interagir avec l'API Claude d'Anthropic
 */
class ServiceClaudeIA {
  constructor() {
    this.apiKey = config.claude.apiKey;
    this.apiUrl = 'https://api.anthropic.com/v1/messages';
    this.modele = 'claude-3-opus-20240229'; // Modèle par défaut
  }

  /**
   * Envoie une requête à Claude IA et récupère la réponse
   * @param {string} message - Message de l'utilisateur
   * @param {object} contexte - Contexte additionnel pour la requête
   * @returns {Promise<string>} Réponse générée par Claude
   */
  async genererReponse(message, contexte = {}) {
    try {
      // Préparer le contexte du système
      let contexteSysteme = `
        Tu es un assistant spécialisé dans l'enseignement du langage C pour la communauté C2P (C 1er Pas).
        Ton objectif est d'aider les membres à comprendre les concepts de programmation en C de manière claire et pédagogique.
        
        - Réponds avec des explications précises et concises
        - Utilise des exemples de code simples et bien commentés quand c'est pertinent
        - Adapte tes réponses au niveau du membre (débutant, intermédiaire, avancé)
        - Fournis des références vers des ressources utiles quand c'est approprié
        - Reste toujours pédagogique et encourageant
      `;
      
      // Ajouter des informations contextuelles si disponibles
      if (contexte.niveau) {
        contexteSysteme += `\nLe niveau de l'utilisateur est: ${contexte.niveau}`;
      }
      
      if (contexte.historique && contexte.historique.length > 0) {
        contexteSysteme += `\nVoici les dernières questions posées par l'utilisateur: ${contexte.historique.join(", ")}`;
      }
      
      // Configurer la requête à l'API Claude
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.modele,
          messages: [
            {
              role: "user",
              content: message
            }
          ],
          system: contexteSysteme,
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      // Extraire la réponse
      const reponse = response.data.content[0].text;
      logger.info(`Réponse générée par Claude IA pour la question: "${message.substring(0, 50)}..."`);
      
      return reponse;
      
    } catch (erreur) {
      logger.error(`Erreur lors de la génération de réponse par Claude IA: ${erreur.message}`);
      if (erreur.response) {
        logger.error(`Statut: ${erreur.response.status}, Données: ${JSON.stringify(erreur.response.data)}`);
      }
      throw new Error(`Erreur lors de la génération de réponse: ${erreur.message}`);
    }
  }

  /**
   * Génère une réponse spécifique pour les questions sur le langage C
   * @param {string} question - Question sur le langage C
   * @param {string} niveau - Niveau de l'utilisateur (débutant, intermédiaire, avancé)
   * @returns {Promise<string>} Réponse générée
   */
  async repondreQuestionC(question, niveau = 'débutant') {
    // Créer un prompt spécifique pour les questions de programmation C
    const prompt = `
      Question sur le langage C: "${question}"
      
      Réponds de manière pédagogique à cette question sur le langage C. 
      Explique clairement les concepts, utilise des exemples de code bien commentés si nécessaire.
      Adapte ta réponse pour un niveau ${niveau}.
    `;
    
    return this.genererReponse(prompt, { niveau });
  }

  /**
   * Génère un quiz sur une thématique du langage C
   * @param {string} thematique - Thématique du quiz (pointeurs, structures, etc.)
   * @param {number} nombreQuestions - Nombre de questions à générer (défaut: 3)
   * @param {string} niveau - Niveau de difficulté (défaut: 'intermédiaire')
   * @returns {Promise<object>} Quiz généré
   */
  async genererQuiz(thematique, nombreQuestions = 3, niveau = 'intermédiaire') {
    try {
      const prompt = `
        Génère un quiz de ${nombreQuestions} questions à choix multiples (4 options) sur la thématique "${thematique}" en langage C.
        Le niveau de difficulté est: ${niveau}.
        
        Pour chaque question:
        1. Fournis l'énoncé de la question
        2. Propose 4 options de réponse (A, B, C, D)
        3. Indique quelle option est correcte
        4. Fournir une brève explication pour la réponse correcte
        
        Retourne les données au format JSON avec cette structure:
        {
          "titre": "Quiz sur [thematique]",
          "description": "Description du quiz",
          "questions": [
            {
              "texte": "Énoncé de la question",
              "options": [
                {"texte": "Option A", "estCorrecte": true/false},
                {"texte": "Option B", "estCorrecte": true/false},
                ...
              ],
              "explication": "Explication de la réponse correcte"
            },
            ...
          ]
        }
      `;
      
      const reponse = await this.genererReponse(prompt);
      
      // Extraire le JSON de la réponse
      const jsonMatch = reponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                        reponse.match(/{[\s\S]*}/);
                        
      if (!jsonMatch) {
        throw new Error("Impossible d'extraire le format JSON de la réponse");
      }
      
      const jsonStr = jsonMatch[0].replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
      
    } catch (erreur) {
      logger.error(`Erreur lors de la génération du quiz: ${erreur.message}`);
      throw erreur;
    }
  }
}

// Exporter une instance unique du service
module.exports = new ServiceClaudeIA();