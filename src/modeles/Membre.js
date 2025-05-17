/**
 * Modèle pour les membres de la communauté C2P
 * Stocke les informations des membres pour personnaliser les interactions
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MembreSchema = new Schema({
  // Informations personnelles
  nom: {
    type: String,
    required: true,
    trim: true,
  },
  numeroWhatsApp: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  pays: {
    type: String,
    trim: true,
  },
  ecoleUniversite: {
    type: String,
    trim: true,
  },
  faculteDomaine: {
    type: String,
    trim: true,
  },
  niveauEtude: {
    type: String,
    trim: true,
  },
  motivation: {
    type: String,
  },
  
  // Statut dans la communauté
  dateInscription: {
    type: Date,
    default: Date.now,
  },
  actif: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    enum: ['membre', 'administrateur', 'moderateur'],
    default: 'membre',
  },
  
  // Suivi de l'apprentissage
  progressionLanguageC: {
    type: Map,
    of: Number, // Pourcentage de progression par thématique
    default: {},
  },
  quizCompletes: [{
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
    },
  }],
  
  // Préférences et paramètres
  notificationsActives: {
    type: Boolean,
    default: true,
  },
  languePreferee: {
    type: String,
    default: 'fr',
  },
  
  // Suivi des interactions
  derniereActivite: {
    type: Date,
    default: Date.now,
  },
  questionsRecentes: [{
    texte: String,
    date: {
      type: Date,
      default: Date.now,
    },
    repondue: {
      type: Boolean,
      default: false,
    },
  }],
}, {
  timestamps: true,
});

// Méthode pour mettre à jour la date de dernière activité
MembreSchema.methods.actualiserActivite = function() {
  this.derniereActivite = Date.now();
  return this.save();
};

// Méthode pour ajouter un quiz complété
MembreSchema.methods.ajouterQuizComplete = function(quizId, score) {
  this.quizCompletes.push({
    quizId,
    score,
    date: Date.now(),
  });
  return this.save();
};

// Méthodes virtuelles (exemple: calcul du score moyen aux quiz)
MembreSchema.virtual('scoreMoyenQuiz').get(function() {
  if (this.quizCompletes.length === 0) return 0;
  
  const sommeScores = this.quizCompletes.reduce(
    (total, quiz) => total + quiz.score, 0
  );
  return sommeScores / this.quizCompletes.length;
});

const Membre = mongoose.model('Membre', MembreSchema);

module.exports = Membre;