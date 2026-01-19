export interface FaqItem {
  question: string
  answer: string
  category: 'general' | 'transactions' | 'backup' | 'security'
}

export const faqData: FaqItem[] = [
  // General
  {
    category: 'general',
    question: "A quoi sert l'application Argent de Poche ?",
    answer:
      "Argent de Poche est une application familiale pour gerer l'argent de poche des enfants. Elle permet aux parents de suivre les credits et debits de chaque enfant, avec un historique complet des transactions.",
  },
  {
    category: 'general',
    question: "Quelle est la difference entre le mode Parent et le mode Enfant ?",
    answer:
      "Le mode Parent permet de creer des transactions, gerer les profils et les motifs, acceder aux parametres et voir les statistiques. Le mode Enfant offre une vue simplifiee limitee a la consultation du solde et de l'historique.",
  },
  {
    category: 'general',
    question: 'Comment passer en mode Parent ?',
    answer:
      "Touchez longtemps (2 secondes) sur le titre de l'application dans la barre superieure. Si un code PIN est configure, vous devrez le saisir.",
  },
  {
    category: 'general',
    question: "Comment voir les statistiques ?",
    answer:
      "Depuis le tableau de bord, touchez 'Voir les statistiques' sous le solde total. Vous pourrez filtrer par periode et par profil pour voir la repartition des credits et debits.",
  },

  // Transactions
  {
    category: 'transactions',
    question: 'Comment ajouter une transaction ?',
    answer:
      "En mode Parent, touchez le bouton + en bas a droite du tableau de bord. Remplissez le formulaire avec le profil, le montant (positif pour credit, negatif pour debit), le motif et une description optionnelle.",
  },
  {
    category: 'transactions',
    question: "Quelle est la difference entre Credit et Debit ?",
    answer:
      "Un Credit augmente le solde de l'enfant (argent de poche, cadeau, etc.). Un Debit diminue le solde (achat, depense, etc.).",
  },
  {
    category: 'transactions',
    question: "Puis-je corriger une transaction erronee ?",
    answer:
      "Oui, en mode Parent, ouvrez le detail de la transaction et touchez 'Corriger'. Vous pouvez annuler completement la transaction ou ajuster son montant. L'historique conserve une trace de la correction.",
  },
  {
    category: 'transactions',
    question: 'Comment dupliquer une transaction ?',
    answer:
      "En mode Parent, ouvrez le detail d'une transaction et touchez 'Dupliquer'. Un nouveau formulaire s'ouvre avec les memes valeurs pre-remplies, pret a etre modifie si necessaire.",
  },
  {
    category: 'transactions',
    question: "A quoi sert l'option 'Motif secret' ?",
    answer:
      "L'option 'Motif secret' masque le motif de la transaction pour les enfants. Utile pour des surprises ou des transactions que vous ne souhaitez pas detailler.",
  },

  // Backup
  {
    category: 'backup',
    question: 'Comment sauvegarder mes donnees ?',
    answer:
      "Allez dans Parametres > Exporter les donnees pour telecharger un fichier JSON. Vous pouvez aussi connecter votre compte Google pour des sauvegardes automatiques sur Google Drive.",
  },
  {
    category: 'backup',
    question: 'Comment restaurer une sauvegarde ?',
    answer:
      "Depuis Parametres, vous pouvez importer un fichier JSON local ou restaurer une sauvegarde depuis Google Drive. Attention, le mode 'Remplacer' efface les donnees actuelles.",
  },
  {
    category: 'backup',
    question: "Quelle est la difference entre 'Remplacer' et 'Fusionner' ?",
    answer:
      "'Remplacer' efface toutes les donnees locales et les remplace par celles du backup. 'Fusionner' ajoute les nouvelles donnees sans supprimer l'existant, utile pour combiner des donnees de plusieurs appareils.",
  },
  {
    category: 'backup',
    question: 'Mes donnees sont-elles securisees ?',
    answer:
      "Les donnees sont stockees localement sur votre appareil. Les sauvegardes Google Drive sont stockees dans votre espace personnel. L'application ne partage aucune donnee avec des tiers.",
  },

  // Security
  {
    category: 'security',
    question: 'Comment configurer un code PIN ?',
    answer:
      "Le code PIN est demande automatiquement lors de votre premier passage en mode Parent. Vous pouvez le reinitialiser depuis Parametres > Code PIN parent.",
  },
  {
    category: 'security',
    question: "J'ai oublie mon code PIN, que faire ?",
    answer:
      "En mode Parent depuis Parametres, vous pouvez reinitialiser le code PIN. Un nouveau code sera demande au prochain acces.",
  },
  {
    category: 'security',
    question: 'Comment archiver un profil ?',
    answer:
      "Allez dans Parametres > Gerer les profils. Vous pouvez archiver un profil pour le masquer du tableau de bord tout en conservant son historique. Vous pourrez le restaurer a tout moment.",
  },
]

export const categoryLabels: Record<FaqItem['category'], string> = {
  general: 'Questions generales',
  transactions: 'Transactions',
  backup: 'Sauvegarde et restauration',
  security: 'Securite et profils',
}
