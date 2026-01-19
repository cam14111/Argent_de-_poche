# Sprint 3 : Backup Export/Import

## Objectif
Permettre l'export et l'import des données en JSON et finaliser la PWA.

## Livrable
MVP complet avec backup local

---

## User Stories

### US-3.1 : Export JSON
**Priorité:** Must | **Effort:** M

**En tant que** parent,
**Je veux** exporter toutes les données en fichier JSON,
**Afin de** sauvegarder mes données localement.

**Critères d'acceptation:**
- [ ] JsonExporter créé
- [ ] Format versionné (schemaVersion dans le fichier)
- [ ] Export de toutes les tables (profiles, transactions, motifs, users, settings)
- [ ] Nom de fichier avec date (argent-de-poche-backup-YYYY-MM-DD.json)
- [ ] Tests unitaires

---

### US-3.2 : Import JSON
**Priorité:** Must | **Effort:** L

**En tant que** parent,
**Je veux** importer un fichier de backup JSON,
**Afin de** restaurer mes données.

**Critères d'acceptation:**
- [ ] JsonImporter créé
- [ ] Validation du format et de la version
- [ ] Mode "Replace" (remplace toutes les données)
- [ ] Mode "Merge" (fusionne avec les données existantes)
- [ ] Gestion des erreurs avec messages clairs
- [ ] Tests unitaires avec fichiers valides et invalides

---

### US-3.3 : Interface d'export
**Priorité:** Must | **Effort:** S

**En tant que** parent,
**Je veux** un bouton pour exporter mes données,
**Afin de** déclencher le téléchargement du backup.

**Critères d'acceptation:**
- [ ] Bouton "Exporter" dans les paramètres
- [ ] Téléchargement automatique du fichier
- [ ] Feedback de succès
- [ ] Accessible uniquement en mode parent

---

### US-3.4 : Interface d'import
**Priorité:** Must | **Effort:** M

**En tant que** parent,
**Je veux** une interface pour importer un fichier de backup,
**Afin de** restaurer mes données facilement.

**Critères d'acceptation:**
- [ ] Bouton "Importer" dans les paramètres
- [ ] Upload de fichier JSON
- [ ] Preview du contenu (nombre de transactions, date du backup)
- [ ] Choix du mode (Replace/Merge)
- [ ] Confirmation avant import
- [ ] Feedback de succès/erreur

---

### US-3.5 : Tests import/export
**Priorité:** Must | **Effort:** M

**En tant que** développeur,
**Je veux** des tests complets pour l'import/export,
**Afin de** garantir la fiabilité des backups.

**Critères d'acceptation:**
- [ ] Tests export: format correct, toutes les données
- [ ] Tests import valide: données restaurées correctement
- [ ] Tests import invalide: erreurs gérées proprement
- [ ] Tests merge: fusion correcte sans doublons
- [ ] Tests de compatibilité de version

---

### US-3.6 : Configuration PWA
**Priorité:** Must | **Effort:** M

**En tant qu'** utilisateur,
**Je veux** installer l'app sur mon téléphone,
**Afin de** l'utiliser comme une application native.

**Critères d'acceptation:**
- [ ] Manifest.json configuré
- [ ] Icônes pour toutes les tailles
- [ ] Service worker avec stratégie cache-first
- [ ] App installable sur Android et iOS
- [ ] Splash screen configuré

---

### US-3.7 : Indicateurs offline
**Priorité:** Should | **Effort:** S

**En tant qu'** utilisateur,
**Je veux** être informé quand je suis hors ligne,
**Afin de** savoir que mes actions seront synchronisées plus tard.

**Critères d'acceptation:**
- [ ] Détection du statut réseau
- [ ] Indicateur visuel (bandeau ou icône)
- [ ] Message explicatif
- [ ] Fonctionnement complet offline

---

## Critères de sortie MVP (fin Sprint 3)

- [ ] 2 profils enfants avec solde calculé
- [ ] Ajout/consultation transactions
- [ ] Correction par contre-écriture
- [ ] Mode PARENT (PIN) et ENFANT (lecture seule)
- [ ] Export/Import JSON fonctionnel
- [ ] PWA installable et fonctionnelle offline
- [ ] Tests unitaires et intégration > 70% couverture

---

## Définition of Done (Sprint)

- [ ] Toutes les US Must marquées comme terminées
- [ ] MVP complet et testable
- [ ] PWA installable et fonctionnelle
- [ ] Tests passants (>70% couverture)
- [ ] Code review effectuée
