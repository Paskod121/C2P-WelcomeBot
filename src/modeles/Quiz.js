/**
 * Modèle pour les quiz du bot C2P
 * Stocke les questions, réponses et autres informations des quiz
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
  texte: {
    type: String,
    required: true,
  },
  options: [{
    texte: String,
    estCorrecte: Boolean,
  }],
  explication: {
    type: String,
  },
  difficulte: {
    type: String,
    enum: ['facile', 'moyen', 'difficile'],
    default: 'moyen',
  },
  thematique: {
    type: String,
    required: true,
  },
});

const QuizSchema = new Schema({
  titre: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  thematique: {
    type: String,
    required: true,
  },
  questions: [QuestionSchema],
  dateCreation: {
    type: Date,
    default: Date.now,
  },
  dureeEstimee: {
    type: Number, // En minutes
    default: 10,
  },
  publieAutomatiquement: {
    type: Boolean,
    default: false,
  },
  datePublication: {
    type: Date,
  },
  publiePar: {
    type: Schema.Types.ObjectId,
    ref: 'Membre',
  },
  actif: {
    type: Boolean,
    default: true,
  },
  seanceAssociee: {
    type: Schema.Types.ObjectId,
    ref: 'Seance',
  },
}, {
  timestamps: true,
});

// Méthode pour obtenir un quiz au format prêt à l'envoi
QuizSchema.methods.formatPourWhatsapp = function() {
  const questions = this.questions.map((q, index) => {
    return {
      numero: index + 1,
      texte: q.texte,
      options: q.options.map((opt, i) => {
        return {
          lettre: String.fromCharCode(65 + i), // A, B, C, D...
          texte: opt.texte,
        };
      }),
    };
  });

  return {
    titre: this.titre,
    description: this.description,
    questions: questions,
    dureeEstimee: this.dureeEstimee,
  };
};

// Méthode pour vérifier les réponses d'un quiz
QuizSchema.methods.verifierReponses = function(reponses) {
  // reponses est un tableau d'indices (ou lettres A, B, C, D converties en indices 0, 1, 2, 3)
  let score = 0;
  let resultats = [];

  // Vérifier chaque réponse
  for (let i = 0; i < Math.min(this.questions.length, reponses.length); i++) {
    const question = this.questions[i];
    let reponse;
    
    // Convertir la lettre en indice si nécessaire (A->0, B->1, etc.)
    if (typeof reponses[i] === 'string' && reponses[i].length === 1) {
      const code = reponses[i].toUpperCase().charCodeAt(0) - 65; // A=0, B=1, etc.
      if (code >= 0 && code < question.options.length) {
        reponse = code;
      }
    } else if (typeof reponses[i] === 'number') {
      reponse = reponses[i];
    }

    // Vérifier si la réponse est correcte
    const estCorrecte = question.options[reponse]?.estCorrecte || false;
    if (estCorrecte) score++;
    
    resultats.push({
      question: question.texte,
      reponseChoisie: question.options[reponse]?.texte || "Réponse non fournie",
      estCorrecte: estCorrecte,
      explication: question.explication,
    });
  }

  // Calculer le score en pourcentage
  const scoreTotal = score / this.questions.length * 100;
  
  return {
    score: scoreTotal,
    nombreCorrect: score,
    nombreTotal: this.questions.length,
    resultats: resultats,
  };
};

const Quiz = mongoose.model('Quiz', QuizSchema);

module.exports = Quiz;