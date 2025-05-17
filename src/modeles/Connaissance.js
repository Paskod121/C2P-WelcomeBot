/**
 * Modèle pour la base de connaissances du langage C
 * Stocke les concepts, définitions et exemples pour les réponses automatiques
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConnaissanceSchema = new Schema({
  concept: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  thematique: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  exemples: [{
    code: String,
    explication: String,
  }],
  motsCles: [{
    type: String,
  }],
  ressources: [{
    titre: String,
    lien: String,
    type: {
      type: String,
      enum: ['article', 'video', 'documentation', 'exercice'],
      default: 'article',
    },
  }],
  difficulte: {
    type: String,
    enum: ['debutant', 'intermediaire', 'avance'],
    default: 'intermediaire',
  },
  dateCreation: {
    type: Date,
    default: Date.now,
  },
  dateModification: {
    type: Date,
    default: Date.now,
  },
});

// Middleware pre-save pour mettre à jour la date de modification
ConnaissanceSchema.pre('save', function(next) {
  this.dateModification = Date.now();
  next();
});

// Méthode pour formater une connaissance pour WhatsApp
ConnaissanceSchema.methods.formatPourWhatsapp = function() {
  // Formater le premier exemple de code (s'il existe)
  const exempleCode = this.exemples && this.exemples.length > 0 
    ? "```c\n" + this.exemples[0].code + "\n```\n" + this.exemples[0].explication
    : "";
  
  // Formater les ressources (max 2)
  const ressourcesFmt = this.ressources
    .slice(0, 2)
    .map(r => `- ${r.titre}`)
    .join('\n');
  
  return {
    concept: this.concept,
    description: this.description,
    exemple: exempleCode,
    ressources: ressourcesFmt ? "\n*Ressources recommandées:*\n" + ressourcesFmt : "",
  };
};

// Index pour la recherche par mots-clés
ConnaissanceSchema.index({ motsCles: 'text', concept: 'text', description: 'text' });

const Connaissance = mongoose.model('Connaissance', ConnaissanceSchema);

module.exports = Connaissance;