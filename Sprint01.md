# Sprint 1 : Setup & Core UI (Fondations)

## Objectif
Mettre en place les fondations techniques de l'application et les composants UI de base.

## Livrable
App installable, navigation, bascule modes, PIN fonctionnel

---

## User Stories

### US-1.1 : Setup projet
**Priorité:** Must | **Effort:** S

**En tant que** développeur,
**Je veux** un projet configuré avec Vite, React, TypeScript et Tailwind,
**Afin de** disposer d'une base technique moderne et performante.

**Critères d'acceptation:**
- [ ] Projet initialisé avec Vite + React + TypeScript
- [ ] Tailwind CSS configuré et fonctionnel
- [ ] ESLint et Prettier configurés
- [ ] Scripts npm fonctionnels (dev, build, preview)

---

### US-1.2 : Configuration base de données
**Priorité:** Must | **Effort:** M

**En tant que** développeur,
**Je veux** Dexie configuré avec le schéma de base de données v1,
**Afin de** pouvoir stocker les données localement dans IndexedDB.

**Critères d'acceptation:**
- [ ] Dexie.js installé et configuré
- [ ] Schéma DB v1 défini (tables: profiles, transactions, motifs, users, settings)
- [ ] Repositories de base créés
- [ ] Tests unitaires des repositories

---

### US-1.3 : Composants UI de base
**Priorité:** Must | **Effort:** M

**En tant que** développeur,
**Je veux** des composants UI réutilisables (Button, Card, Input, Dialog),
**Afin de** construire l'interface de manière cohérente.

**Critères d'acceptation:**
- [ ] Composant Button avec variantes (primary, secondary, danger)
- [ ] Composant Card pour afficher les contenus
- [ ] Composant Input avec gestion des erreurs
- [ ] Composant Dialog/Modal pour les confirmations
- [ ] Composants accessibles (ARIA)

---

### US-1.4 : Layout et navigation
**Priorité:** Must | **Effort:** M

**En tant qu'** utilisateur,
**Je veux** une interface avec une barre de navigation,
**Afin de** pouvoir naviguer entre les différentes sections de l'app.

**Critères d'acceptation:**
- [ ] AppShell avec structure responsive
- [ ] TopBar avec titre et actions contextuelles
- [ ] Navigation entre les écrans principaux
- [ ] TanStack Router configuré

---

### US-1.5 : Contexte d'authentification
**Priorité:** Must | **Effort:** M

**En tant qu'** utilisateur,
**Je veux** pouvoir basculer entre le mode PARENT et le mode ENFANT,
**Afin d'** accéder aux fonctionnalités appropriées selon mon rôle.

**Critères d'acceptation:**
- [ ] Context Auth créé avec état du mode (PARENT/ENFANT)
- [ ] Mode PARENT déverrouillé par PIN
- [ ] Mode ENFANT en lecture seule
- [ ] Persistance du mode entre sessions (optionnel)

---

### US-1.6 : Composant PinPad
**Priorité:** Must | **Effort:** M

**En tant que** parent,
**Je veux** saisir un code PIN pour accéder au mode parent,
**Afin de** protéger les fonctionnalités d'édition.

**Critères d'acceptation:**
- [ ] PinPad avec clavier numérique
- [ ] Hash du PIN (pas stocké en clair)
- [ ] Vérification du PIN
- [ ] Feedback visuel (erreur, succès)
- [ ] Option pour masquer/afficher les chiffres saisis

---

### US-1.7 : Dashboard squelette
**Priorité:** Must | **Effort:** S

**En tant qu'** utilisateur,
**Je veux** voir un tableau de bord avec les cartes de solde (vides pour l'instant),
**Afin d'** avoir un aperçu de la structure de l'app.

**Critères d'acceptation:**
- [ ] Page Dashboard créée
- [ ] Cartes de solde placeholder pour chaque enfant
- [ ] Layout responsive (mobile-first)

---

### US-1.8 : Initialisation des données
**Priorité:** Must | **Effort:** S

**En tant que** développeur,
**Je veux** que l'app initialise les données de base au premier lancement,
**Afin de** disposer des profils et motifs par défaut.

**Critères d'acceptation:**
- [ ] Création des profils enfants (Enora, Martin)
- [ ] Création des utilisateurs (Camille, Emeline, Enora, Martin)
- [ ] Création des motifs par défaut (Argent de poche, Cadeau, Dépense, etc.)
- [ ] Détection du premier lancement

---

## Définition of Done (Sprint)

- [ ] Toutes les US marquées comme terminées
- [ ] Code review effectuée
- [ ] Tests unitaires passants (>70% couverture)
- [ ] App déployable et installable en PWA
- [ ] Documentation technique à jour
