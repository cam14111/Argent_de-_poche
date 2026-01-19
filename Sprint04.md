# Sprint 4 : Google Drive Basic

## Objectif
Intégrer Google Drive pour le backup cloud des données.

## Livrable
Backup Google Drive fonctionnel (mono-utilisateur)

---

## User Stories

### US-4.1 : Service d'authentification Google
**Priorité:** Must | **Effort:** L

**En tant que** parent,
**Je veux** me connecter avec mon compte Google,
**Afin d'** accéder à Google Drive pour les backups.

**Critères d'acceptation:**
- [ ] GoogleAuthService créé
- [ ] Intégration OAuth 2.0 avec Google Identity Services
- [ ] Scopes limités (drive.file uniquement)
- [ ] Gestion du token (stockage sécurisé, refresh)
- [ ] Gestion des erreurs d'authentification
- [ ] Tests unitaires (mocks)

---

### US-4.2 : Service Google Drive
**Priorité:** Must | **Effort:** L

**En tant que** développeur,
**Je veux** un service pour interagir avec l'API Google Drive v3,
**Afin de** gérer les fichiers de backup.

**Critères d'acceptation:**
- [ ] GoogleDriveService créé
- [ ] Méthodes: uploadFile, downloadFile, listFiles, deleteFile
- [ ] Création automatique du dossier "ArgentDePoche"
- [ ] Gestion des métadonnées (nom, date, version)
- [ ] Gestion des erreurs API (quota, permissions)
- [ ] Tests unitaires (mocks)

---

### US-4.3 : BackupManager
**Priorité:** Must | **Effort:** M

**En tant que** développeur,
**Je veux** un gestionnaire de backup centralisé,
**Afin de** coordonner les opérations d'upload et download.

**Critères d'acceptation:**
- [ ] BackupManager créé
- [ ] Méthodes: backup, restore, listBackups
- [ ] Utilisation de JsonExporter/Importer
- [ ] Gestion de l'état (en cours, succès, erreur)
- [ ] Retry automatique en cas d'erreur réseau

---

### US-4.4 : Interface de connexion Google
**Priorité:** Must | **Effort:** M

**En tant que** parent,
**Je veux** une interface pour me connecter/déconnecter de Google,
**Afin de** gérer mon compte Google dans l'app.

**Critères d'acceptation:**
- [ ] Bouton "Connexion Google" dans les paramètres
- [ ] Affichage du compte connecté (email)
- [ ] Bouton de déconnexion
- [ ] Gestion du statut de connexion
- [ ] Accessible uniquement en mode parent

---

### US-4.5 : Backup manuel vers Drive
**Priorité:** Must | **Effort:** M

**En tant que** parent,
**Je veux** sauvegarder mes données sur Google Drive manuellement,
**Afin de** créer un backup cloud à la demande.

**Critères d'acceptation:**
- [ ] Bouton "Sauvegarder sur Drive" dans les paramètres
- [ ] Indicateur de progression
- [ ] Feedback de succès/erreur
- [ ] Date du dernier backup affichée
- [ ] Gestion du cas "non connecté"

---

### US-4.6 : Liste des backups et restauration
**Priorité:** Must | **Effort:** M

**En tant que** parent,
**Je veux** voir la liste de mes backups Drive et pouvoir en restaurer un,
**Afin de** récupérer une version précédente de mes données.

**Critères d'acceptation:**
- [ ] Liste des backups disponibles sur Drive
- [ ] Affichage: date, taille, version
- [ ] Bouton "Restaurer" pour chaque backup
- [ ] Confirmation avant restauration
- [ ] Preview du contenu avant restore
- [ ] Feedback de succès/erreur

---

### US-4.7 : Tests backup Drive
**Priorité:** Must | **Effort:** M

**En tant que** développeur,
**Je veux** des tests complets pour les fonctionnalités Drive,
**Afin de** garantir la fiabilité des backups cloud.

**Critères d'acceptation:**
- [ ] Tests d'intégration avec mocks Google API
- [ ] Tests scénarios: upload, download, liste
- [ ] Tests erreurs: réseau, quota, permissions
- [ ] Tests refresh token
- [ ] Tests E2E (optionnel, avec compte test)

---

## Prérequis

- [ ] Projet Google Cloud Console créé
- [ ] OAuth credentials configurées
- [ ] Compte Google test disponible

---

## Définition of Done (Sprint)

- [ ] Toutes les US Must marquées comme terminées
- [ ] Backup/restore Drive fonctionnel
- [ ] Tests passants (>70% couverture)
- [ ] Code review effectuée
- [ ] Documentation technique à jour
