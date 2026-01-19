# Sprint 6 : Stats & Polish (V1)

## Objectif
Ajouter les statistiques, finaliser les fonctionnalités et préparer la V1.

## Livrable
V1 complète

---

## User Stories

### US-6.1 : Mini statistiques
**Priorité:** Should | **Effort:** M

**En tant que** parent,
**Je veux** voir des statistiques simples sur les dépenses par motif,
**Afin de** comprendre comment l'argent de poche est utilisé.

**Critères d'acceptation:**
- [ ] Vue stats accessible depuis le dashboard
- [ ] Dépenses par motif sur les 30 derniers jours
- [ ] Graphique simple (barres ou camembert)
- [ ] Filtre par enfant
- [ ] Total des entrées/sorties

---

### US-6.2 : Gestion complète des motifs
**Priorité:** Should | **Effort:** M

**En tant que** parent,
**Je veux** pouvoir renommer et archiver des motifs,
**Afin de** gérer les catégories selon mes besoins.

**Critères d'acceptation:**
- [ ] Renommer un motif existant
- [ ] Archiver un motif (ne plus apparaître dans la sélection)
- [ ] Voir les motifs archivés
- [ ] Restaurer un motif archivé
- [ ] Protection des motifs système

---

### US-6.3 : Duplication de transaction
**Priorité:** Should | **Effort:** S

**En tant que** parent,
**Je veux** pouvoir dupliquer une transaction,
**Afin de** créer rapidement une transaction similaire.

**Critères d'acceptation:**
- [ ] Bouton "Dupliquer" sur une transaction
- [ ] Formulaire pré-rempli avec les données
- [ ] Date mise à aujourd'hui
- [ ] Possibilité de modifier avant validation

---

### US-6.4 : Archivage de profil
**Priorité:** Could | **Effort:** M

**En tant que** parent,
**Je veux** pouvoir archiver un profil enfant,
**Afin de** le masquer si l'enfant n'utilise plus l'app.

**Critères d'acceptation:**
- [ ] Bouton "Archiver" sur un profil
- [ ] Profil archivé non visible par défaut
- [ ] Historique conservé
- [ ] Possibilité de restaurer
- [ ] Confirmation avant archivage

---

### US-6.5 : Chiffrement backup (optionnel)
**Priorité:** Could | **Effort:** L

**En tant que** parent,
**Je veux** pouvoir chiffrer mes backups avec un mot de passe,
**Afin de** protéger mes données sur Google Drive.

**Critères d'acceptation:**
- [ ] Option de chiffrement dans les paramètres
- [ ] Saisie et confirmation du mot de passe
- [ ] Chiffrement AES-256 des backups
- [ ] Avertissement sur le risque de perte si mot de passe oublié
- [ ] Déchiffrement à la restauration

---

### US-6.6 : Optimisations performance
**Priorité:** Should | **Effort:** M

**En tant qu'** utilisateur,
**Je veux** que l'app soit rapide et fluide,
**Afin d'** avoir une bonne expérience utilisateur.

**Critères d'acceptation:**
- [ ] TTI (Time To Interactive) < 3 secondes
- [ ] Index Dexie optimisés
- [ ] Lazy loading des routes
- [ ] Optimisation des re-renders
- [ ] Bundle size optimisé

---

### US-6.7 : Tests E2E complets
**Priorité:** Must | **Effort:** L

**En tant que** développeur,
**Je veux** des tests end-to-end couvrant les scénarios principaux,
**Afin de** garantir la qualité de la V1.

**Critères d'acceptation:**
- [ ] Setup Playwright ou Cypress
- [ ] Tests parcours utilisateur complets:
  - Installation et premier lancement
  - Création de transactions
  - Export/Import
  - Connexion Google et backup
  - Sync entre appareils (simulé)
- [ ] Tests sur mobile (viewport)
- [ ] CI/CD intégration

---

### US-6.8 : Documentation utilisateur
**Priorité:** Should | **Effort:** M

**En tant qu'** utilisateur,
**Je veux** une documentation claire sur l'utilisation de l'app,
**Afin de** comprendre toutes les fonctionnalités.

**Critères d'acceptation:**
- [ ] Guide de démarrage rapide
- [ ] FAQ
- [ ] Explications des fonctionnalités clés
- [ ] Accessible depuis l'app (section Aide)
- [ ] Screenshots/illustrations

---

### US-6.9 : Bug fixes & polish
**Priorité:** Must | **Effort:** L

**En tant que** développeur,
**Je veux** corriger les bugs restants et peaufiner l'UX,
**Afin de** livrer une V1 de qualité.

**Critères d'acceptation:**
- [ ] Tous les bugs connus corrigés
- [ ] Revue UX complète
- [ ] Animations et transitions fluides
- [ ] Messages d'erreur clairs
- [ ] Accessibilité vérifiée (WCAG 2.1 AA)
- [ ] Tests sur différents navigateurs/devices

---

## Critères de sortie V1 (fin Sprint 6)

- [ ] Tous critères MVP
- [ ] Backup/restore Google Drive
- [ ] Sync entre 2 comptes parents
- [ ] Gestion conflits offline automatique
- [ ] Stats basiques
- [ ] Tests E2E passants
- [ ] Performance < 3s TTI

---

## Définition of Done (Sprint)

- [ ] Toutes les US Must et Should marquées comme terminées
- [ ] V1 complète et testée
- [ ] Tests E2E passants
- [ ] Performance validée
- [ ] Code review effectuée
- [ ] Documentation utilisateur disponible
- [ ] Prêt pour release
