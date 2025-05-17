/**
 * Modèle pour les séances de la communauté C2P
 * Stocke les informations sur les séances d'apprentissage programmées
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SeanceSchema = new Schema({
  titre: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  duree: {
    type: Number, // En minutes
    default: 120,
  },
  thematiques: [{
    type: String,
  }],
  pointsAbordes: [{
    type: String,
  }],
  exercicesPreparatoires: [{
    titre: String,
    description: String,
    lien: String,
  }],
  ressources: [{
    titre: String,
    description: String,
    lien: String,
    type: {
      type: String,
      enum: ['article', 'video', 'exercice', 'documentation'],
      default: 'article',
    },
  }],
  quizAssocies: [{
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
  }],
  responsable: {
    type: Schema.Types.ObjectId,
    ref: 'Membre',
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'Membre',
  }],
  rappelsEnvoyes: [{
    type: Date,
  }],
  statut: {
    type: String,
    enum: ['planifiee', 'en_cours', 'terminee', 'annulee'],
    default: 'planifiee',
  },
}, {
  timestamps: true,
});

// Méthode pour obtenir une séance au format prêt à l'envoi
SeanceSchema.methods.formatPourWhatsapp = function() {
  return {
    titre: this.titre,
    date: this.date,
    duree: this.duree,
    pointsAbordes: this.pointsAbordes,
    exercicesPreparatoires: this.exercicesPreparatoires,
  };
};

// Méthode pour ajouter un participant
SeanceSchema.methods.ajouterParticipant = function(membreId) {
  if (!this.participants.includes(membreId)) {
    this.participants.push(membreId);
  }
  return this.save();
};

// Méthode pour enregistrer un rappel envoyé
SeanceSchema.methods.enregistrerRappelEnvoye = function() {
  this.rappelsEnvoyes.push(new Date());
  return this.save();
};

const Seance = mongoose.model('Seance', SeanceSchema);

module.exports = Seance;