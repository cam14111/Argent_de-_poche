# PRD - Application "Argent de Poche"
## Gestion du coffre-fort familial

**Version:** 1.0
**Date:** 17 janvier 2026
**Auteur:** PRD généré pour développement
**Statut:** Draft pour validation

---

## Table des matières

1. [Résumé exécutif](#1-résumé-exécutif)
2. [Problème, objectifs et non-objectifs](#2-problème-objectifs-et-non-objectifs)
3. [Personas et User Stories](#3-personas-et-user-stories)
4. [Parcours utilisateurs (User Flows)](#4-parcours-utilisateurs-user-flows)
5. [Exigences fonctionnelles](#5-exigences-fonctionnelles)
6. [Exigences non fonctionnelles](#6-exigences-non-fonctionnelles)
7. [Modèle de données](#7-modèle-de-données)
8. [Architecture technique](#8-architecture-technique)
9. [UX/UI](#9-uxui)
10. [Edge cases](#10-edge-cases)
11. [Plan de tests](#11-plan-de-tests)
12. [Plan de livraison](#12-plan-de-livraison)
13. [Risques et mitigations](#13-risques-et-mitigations)
14. [Questions ouvertes et hypothèses](#14-questions-ouvertes-et-hypothèses)

---

## 1. Résumé exécutif

### Vision produit

**Argent de Poche** est une application PWA mobile-first servant de registre numérique pour gérer l'argent liquide de deux enfants (Enora et Martin) stocké dans un coffre-fort physique familial.

### Proposition de valeur

- **Pour les parents** : saisie rapide des entrées/sorties d'argent, visibilité instantanée sur le solde de chaque enfant, synchronisation entre les deux parents
- **Pour les enfants** : consultation de leur solde et historique en lecture seule, transparence sur leurs finances

### Caractéristiques clés

| Caractéristique | Description |
|-----------------|-------------|
| **Offline-first** | Fonctionne sans connexion, sync ultérieure |
| **Multi-utilisateurs** | 2 parents (éditeurs) + 2 enfants (lecteurs) |
| **Sync Google Drive** | Partage des données entre appareils parents |
| **PWA** | Installable, rapide, mobile-first |
| **Event-sourcing léger** | Transactions immuables, traçabilité complète |

### Stack technique (basée sur le codebase existant)

- **Frontend:** React 18 + TypeScript + Vite
- **Routing:** TanStack Router (lazy loading)
- **Stockage:** Dexie (IndexedDB) + localStorage
- **UI:** Tailwind CSS + composants CVA
- **Backup:** Google Drive API v3 + OAuth 2.0
- **PWA:** vite-plugin-pwa + Workbox

---

## 2. Problème, objectifs et non-objectifs

### 2.1 Problème à résoudre

**Contexte actuel :**
- L'argent liquide des enfants est stocké dans un coffre-fort physique
- Aucun suivi numérique des entrées/sorties
- Difficulté à connaître le solde exact de chaque enfant
- Pas de visibilité pour les enfants sur leur argent
- Les deux parents doivent pouvoir gérer et consulter

**Douleurs identifiées :**
1. "Combien reste-t-il à Enora ?" → Impossible à répondre sans compter
2. "Martin a dépensé combien ce mois-ci ?" → Aucune traçabilité
3. "Ma femme a ajouté de l'argent hier ?" → Pas de visibilité partagée
4. "Les enfants veulent voir leur solde" → Pas d'accès sécurisé pour eux

### 2.2 Objectifs

| # | Objectif | Mesure de succès |
|---|----------|------------------|
| O1 | Connaître le solde de chaque enfant en < 3 secondes | Temps d'affichage dashboard |
| O2 | Saisir une transaction en < 15 secondes | Temps moyen de saisie |
| O3 | Synchroniser les données entre parents | 0 perte de données, sync < 1 min |
| O4 | Permettre aux enfants de consulter sans modifier | 0 modification possible en mode enfant |
| O5 | Fonctionner hors-ligne | 100% des features critiques offline |

### 2.3 Non-objectifs (hors scope)

| # | Non-objectif | Raison |
|---|--------------|--------|
| NO1 | Gestion de comptes bancaires réels | App = registre coffre-fort uniquement |
| NO2 | Paiements ou virements | Argent physique uniquement |
| NO3 | Objectifs d'épargne / tirelire virtuelle | V2 potentielle, pas MVP |
| NO4 | Notifications push | Complexité serveur, pas nécessaire MVP |
| NO5 | Multi-devises | EUR uniquement |
| NO6 | Rapports PDF | Export JSON suffisant |
| NO7 | Mode tablette optimisé | Mobile-first, responsive suffisant |

---

## 3. Personas et User Stories

### 3.1 Personas

#### Persona 1 : Parent Principal (Papa)

| Attribut | Valeur |
|----------|--------|
| **Nom** | Camille |
| **Rôle** | PARENT (admin/éditeur) |
| **Appareils** | Smartphone Android, parfois tablette |
| **Contexte d'usage** | Saisie après retour courses, vérification rapide |
| **Besoins** | Saisie ultra-rapide, fiabilité, sync avec sa femme |
| **Frustrations** | Apps complexes, perte de données, sync qui bug |

#### Persona 2 : Parent Secondaire (Maman)

| Attribut | Valeur |
|----------|--------|
| **Nom** | Emeline |
| **Rôle** | PARENT (admin/éditeur) |
| **Appareils** | iPhone |
| **Contexte d'usage** | Donne l'argent de poche hebdo, vérifie avant sorties |
| **Besoins** | Voir les dernières transactions de son mari, ajouter les siennes |
| **Frustrations** | Ne pas savoir ce que l'autre a fait, conflits de données |

#### Persona 3 : Enfant Lecteur (Enora)

| Attribut | Valeur |
|----------|--------|
| **Nom** | Enora |
| **Âge** | 12 ans (hypothèse) |
| **Rôle** | ENFANT (lecteur) |
| **Appareils** | Tablette familiale, smartphone occasionnel |
| **Contexte d'usage** | Vérifier son solde avant d'acheter quelque chose |
| **Besoins** | Voir son solde, celui de son frère, et les historiques |
| **Frustrations** | Interface trop compliquée |

#### Persona 4 : Enfant Lecteur (Martin)

| Attribut | Valeur |
|----------|--------|
| **Nom** | Martin |
| **Âge** | 9 ans (hypothèse) |
| **Rôle** | ENFANT (lecteur) |
| **Appareils** | Tablette familiale |
| **Contexte d'usage** | Demande à voir combien il a |
| **Besoins** | Interface très simple, gros chiffres, voir aussi le solde de sa sœur |
| **Frustrations** | Trop d'informations, boutons qu'il ne comprend pas |

### 3.2 User Stories

#### Epic 1 : Gestion des transactions (PARENT)

| ID | User Story | Priorité | Critères d'acceptation |
|----|------------|----------|------------------------|
| US1.1 | En tant que parent, je veux ajouter une entrée d'argent pour un enfant afin de créditer son solde | Must | Montant > 0, motif requis, solde mis à jour immédiatement |
| US1.2 | En tant que parent, je veux ajouter une sortie d'argent pour un enfant afin de débiter son solde | Must | Montant > 0, solde peut devenir négatif (avec warning), motif requis |
| US1.3 | En tant que parent, je veux corriger une erreur de saisie via contre-écriture afin de garder l'historique intact | Must | Nouvelle transaction inverse créée, lien vers transaction originale, solde recalculé |
| US1.4 | En tant que parent, je veux voir l'historique des transactions d'un enfant afin de comprendre l'évolution de son solde | Must | Liste triée par date desc, filtrable par période/type/motif |
| US1.5 | En tant que parent, je veux dupliquer une transaction récente afin de saisir plus vite les opérations récurrentes | Should | Pré-remplissage du formulaire, date = maintenant |
| US1.6 | En tant que parent, je veux marquer le motif d'une transaction comme "secret" pour certains profils afin de préparer des surprises (cadeaux) | Must | Cases à cocher par profil (Enora, Martin, Camille, Emeline), motif masqué pour les profils sélectionnés |

#### Epic 2 : Consultation (ENFANT)

| ID | User Story | Priorité | Critères d'acceptation |
|----|------------|----------|------------------------|
| US2.1 | En tant qu'enfant, je veux voir MON solde actuel afin de savoir combien j'ai | Must | Affichage gros chiffre bien visible |
| US2.2 | En tant qu'enfant, je veux voir le solde de mon frère/ma sœur afin de comparer | Must | Affichage des 2 soldes (comme les parents) |
| US2.3 | En tant qu'enfant, je veux voir MES dernières transactions afin de comprendre mes dépenses | Should | Liste simplifiée, sans boutons d'action |
| US2.4 | En tant qu'enfant, je veux voir les transactions de mon frère/ma sœur | Should | Transparence familiale, lecture seule |
| US2.5 | En tant qu'enfant, je ne dois PAS pouvoir modifier quoi que ce soit | Must | Aucun bouton d'édition/suppression visible, actions bloquées côté code |
| US2.6 | En tant qu'enfant, je ne vois pas le motif des transactions marquées "secrètes" pour moi | Must | Motif remplacé par "Secret" ou similaire |

#### Epic 3 : Gestion des profils et motifs (PARENT)

| ID | User Story | Priorité | Critères d'acceptation |
|----|------------|----------|------------------------|
| US3.1 | En tant que parent, je veux créer un nouveau profil enfant afin d'ajouter un 3ème enfant plus tard | Could | Nom unique requis, solde initial = 0 |
| US3.2 | En tant que parent, je veux gérer les motifs/catégories afin de personnaliser les choix | Should | Ajouter, renommer, archiver (pas supprimer si utilisé) |
| US3.3 | En tant que parent, je veux archiver un profil enfant afin de le masquer sans perdre l'historique | Could | Profil masqué des listes, données conservées |

#### Epic 4 : Synchronisation et backup (PARENT)

| ID | User Story | Priorité | Critères d'acceptation |
|----|------------|----------|------------------------|
| US4.1 | En tant que parent, je veux que mes données se synchronisent avec l'appareil de ma femme | Must | Sync via Google Drive partagé, < 1 min de délai |
| US4.2 | En tant que parent, je veux sauvegarder manuellement sur Google Drive | Must | Bouton explicite, confirmation succès |
| US4.3 | En tant que parent, je veux restaurer depuis un backup Drive | Must | Liste des backups, preview avant restore, confirmation |
| US4.4 | En tant que parent, je veux exporter en JSON local | Should | Fichier téléchargeable, format documenté |
| US4.5 | En tant que parent, je veux importer un JSON local | Should | Validation, choix merge/replace, preview |

#### Epic 5 : Accès et authentification

| ID | User Story | Priorité | Critères d'acceptation |
|----|------------|----------|------------------------|
| US5.1 | En tant que parent, je veux me connecter avec Google afin d'activer la sync Drive | Must | OAuth popup, scope drive.file uniquement |
| US5.2 | En tant que parent, je veux définir un code PIN pour le mode enfant | Must | 4 chiffres, stocké localement hashé |
| US5.3 | En tant qu'enfant, je veux accéder à l'app avec un code simple | Must | Saisie PIN, accès lecture seule automatique |
| US5.4 | En tant que parent, je veux basculer entre mode parent et mode enfant | Should | Switch rapide avec re-auth PIN si vers parent |

---

## 4. Parcours utilisateurs (User Flows)

### 4.1 Flow : Ajout d'une transaction (Parent)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AJOUT TRANSACTION (PARENT)                    │
└─────────────────────────────────────────────────────────────────┘

[Dashboard]
    │
    ▼
[Tap FAB "+"] ──────────────────────────────────────────────────┐
    │                                                            │
    ▼                                                            │
[Modal/Page "Nouvelle transaction"]                              │
    │                                                            │
    ├── 1. Sélection enfant (Enora / Martin) ◄── Défaut: dernier│
    │       [Chips sélectionnables]                   utilisé    │
    │                                                            │
    ├── 2. Type (Entrée / Sortie)                                │
    │       [Toggle ou Chips]                                    │
    │       Défaut: Entrée                                       │
    │                                                            │
    ├── 3. Montant                                               │
    │       [Input numérique, clavier natif]                     │
    │       Validation: > 0, max 2 décimales                     │
    │       Focus auto sur ce champ                              │
    │                                                            │
    ├── 4. Motif/Catégorie                                       │
    │       [Dropdown + suggestions récentes]                    │
    │       Requis                                               │
    │                                                            │
    ├── 5. Note (optionnel)                                      │
    │       [Textarea, max 200 chars]                            │
    │                                                            │
    ├── 6. Date/Heure                                            │
    │       [DateTimePicker, défaut: maintenant]                 │
    │       Peut être dans le passé                              │
    │                                                            │
    ▼                                                            │
[Bouton "Enregistrer"]                                           │
    │                                                            │
    ├── Validation OK ──► [Toast "Transaction ajoutée"]          │
    │                          │                                 │
    │                          ▼                                 │
    │                     [Retour Dashboard]                     │
    │                          │                                 │
    │                          ▼                                 │
    │                     [Solde mis à jour]                     │
    │                          │                                 │
    │                          ▼                                 │
    │                     [Dirty flag = true]                    │
    │                          │                                 │
    │                          ▼                                 │
    │                     [Auto-backup déclenché si online]      │
    │                                                            │
    └── Validation KO ──► [Erreurs inline sur champs]            │
                               │                                 │
                               ▼                                 │
                          [Rester sur formulaire]                │
```

**Temps cible:** < 15 secondes pour cas nominal

### 4.2 Flow : Consultation solde (Enfant)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSULTATION (ENFANT)                         │
└─────────────────────────────────────────────────────────────────┘

[Écran d'accueil app]
    │
    ▼
[Mode actuel = ?]
    │
    ├── Mode Parent ──► [Bouton "Mode Enfant"]
    │                        │
    │                        ▼
    │                   [Sélection "Qui es-tu ?"]
    │                   (Enora / Martin)
    │                        │
    │                        ▼
    │                   [Basculement mode lecture seule]
    │                   [currentUserId = enfant sélectionné]
    │
    └── Mode Enfant ──► [Déjà en lecture seule]
                             │
                             ▼
                        [Dashboard Enfant]
                             │
    ┌────────────────────────┼────────────────────────┐
    │                        │                        │
    ▼                        ▼                        ▼
[2 soldes affichés:   [Dernières              [Historique
 Enora + Martin]       transactions            filtrable
                       (5 dernières,           (tous profils)]
                       tous profils)]
    │
    ▼
[Motifs secrets = "Secret"]
(si transaction.hiddenForUsers contient currentUserId)
    │
    ▼
[AUCUN bouton d'action visible]
[Pas de FAB]
[Pas de menu édition]
[Pas d'accès settings/backup]
```

**Note sur les motifs secrets:**
- L'enfant voit TOUTES les transactions des 2 profils
- Si une transaction a `hiddenForUsers: ["enora"]` et qu'Enora consulte :
  - Elle voit : "📤 Martin • Secret • -25,00 €"
  - Elle ne voit PAS : "Cadeau anniversaire Enora"
- Martin voit le vrai motif car il n'est pas dans hiddenForUsers

### 4.3 Flow : Correction d'erreur (Parent)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORRECTION ERREUR (PARENT)                    │
└─────────────────────────────────────────────────────────────────┘

[Historique transactions]
    │
    ▼
[Tap sur transaction erronée]
    │
    ▼
[Détail transaction]
    │
    ▼
[Bouton "Corriger"]
    │
    ▼
[Dialog "Comment corriger ?"]
    │
    ├── Option A: "Annuler cette transaction"
    │       │
    │       ▼
    │   [Créer contre-écriture automatique]
    │   - Type inverse (Entrée→Sortie ou vice-versa)
    │   - Même montant
    │   - Motif: "Correction: [motif original]"
    │   - Note: "Annule transaction du [date]"
    │   - Lien: correctionOf = originalId
    │       │
    │       ▼
    │   [Solde recalculé à l'identique]
    │
    └── Option B: "Corriger le montant"
            │
            ▼
        [Saisir nouveau montant correct]
            │
            ▼
        [Créer contre-écriture de la différence]
        - Montant = nouveau - ancien
        - Si positif: entrée, si négatif: sortie
        - Motif: "Correction montant"
        - Lien: correctionOf = originalId
            │
            ▼
        [Solde ajusté]

Note: On ne modifie JAMAIS une transaction existante.
      On ajoute toujours une nouvelle transaction de correction.
      Cela garantit l'intégrité de l'historique (audit trail).
```

### 4.4 Flow : Export/Import JSON (Parent)

```
┌─────────────────────────────────────────────────────────────────┐
│                         EXPORT JSON                              │
└─────────────────────────────────────────────────────────────────┘

[Menu Settings]
    │
    ▼
[Section "Données"]
    │
    ▼
[Bouton "Exporter JSON"]
    │
    ▼
[Génération fichier]
- Nom: ArgentDePoche_export_YYYYMMDD_HHMMSS.json
- Contenu: voir format section 7
    │
    ▼
[Téléchargement navigateur]
    │
    ▼
[Toast "Export réussi"]


┌─────────────────────────────────────────────────────────────────┐
│                         IMPORT JSON                              │
└─────────────────────────────────────────────────────────────────┘

[Menu Settings]
    │
    ▼
[Section "Données"]
    │
    ▼
[Bouton "Importer JSON"]
    │
    ▼
[Sélecteur fichier]
    │
    ▼
[Validation fichier]
    │
    ├── Invalide ──► [Erreur: "Format non reconnu" / "Version incompatible"]
    │
    └── Valide ──► [Preview import]
                        │
                        ▼
                   [Affichage résumé:]
                   - X profils
                   - Y transactions
                   - Z motifs
                   - Date export: ...
                        │
                        ▼
                   [Choix mode import]
                   ┌─────────────────┬──────────────────┐
                   │ FUSIONNER       │ REMPLACER        │
                   │ (merge)         │ (replace)        │
                   ├─────────────────┼──────────────────┤
                   │ Ajoute les      │ Supprime toutes  │
                   │ nouvelles       │ les données      │
                   │ transactions,   │ locales et       │
                   │ ignore les      │ importe tout     │
                   │ doublons (même  │                  │
                   │ ID)             │                  │
                   └─────────────────┴──────────────────┘
                        │
                        ▼
                   [Confirmation "Êtes-vous sûr ?"]
                        │
                        ▼
                   [Import exécuté]
                        │
                        ▼
                   [Toast "Import réussi: X transactions ajoutées"]
                        │
                        ▼
                   [Dirty flag = true, backup déclenché]
```

### 4.5 Flow : Synchronisation Google Drive (Parents)

```
┌─────────────────────────────────────────────────────────────────┐
│              PREMIÈRE CONNEXION GOOGLE DRIVE                     │
└─────────────────────────────────────────────────────────────────┘

[Menu Settings]
    │
    ▼
[Section "Sauvegarde Cloud"]
    │
    ▼
[Bouton "Connecter Google Drive"]
    │
    ▼
[Popup OAuth Google]
- Scope: drive.file (fichiers créés par l'app uniquement)
    │
    ├── Annulé ──► [Retour settings, pas de changement]
    │
    └── Autorisé ──► [Token stocké localStorage]
                          │
                          ▼
                     [Recherche dossier partagé existant]
                          │
                          ├── Trouvé ──► [Utiliser ce dossier]
                          │                    │
                          │                    ▼
                          │              [Sync initiale: pull]
                          │
                          └── Non trouvé ──► [Créer dossier "ArgentDePoche"]
                                                  │
                                                  ▼
                                             [Instructions partage]
                                             "Partagez ce dossier avec
                                              votre conjoint(e)"


┌─────────────────────────────────────────────────────────────────┐
│              SYNCHRONISATION AUTOMATIQUE                         │
└─────────────────────────────────────────────────────────────────┘

[App ouverte, online, connecté Drive]
    │
    ▼
[Dirty flag = true ?]
    │
    ├── Non ──► [Check dernier backup distant]
    │                │
    │                ▼
    │           [Plus récent que local ?]
    │                │
    │                ├── Oui ──► [Proposer restore ou ignorer]
    │                │
    │                └── Non ──► [Rien à faire]
    │
    └── Oui ──► [Debounce 30 secondes]
                     │
                     ▼
                [Upload backup compressé]
                     │
                     ├── Succès ──► [Dirty = false, toast discret]
                     │
                     └── Échec ──► [Retry avec backoff exponentiel]
                                   [Max 5 tentatives]
                                   [Si échec final: notif utilisateur]


┌─────────────────────────────────────────────────────────────────┐
│              GESTION DES CONFLITS                                │
└─────────────────────────────────────────────────────────────────┘

[Scénario: 2 parents modifient hors-ligne puis sync]

Parent A (offline):                    Parent B (offline):
- Ajoute Tx1 à 10h00                  - Ajoute Tx2 à 10h05
- Ajoute Tx3 à 10h15                  - Ajoute Tx4 à 10h20

[Parent A revient online à 10h30]
    │
    ▼
[Upload backup A]
    │
    ▼
[Fichier Drive: backup_A_10h30.json.gz]

[Parent B revient online à 10h35]
    │
    ▼
[Détection: backup distant plus récent que dernier sync local]
    │
    ▼
[Stratégie: MERGE EVENT-SOURCING]
    │
    ├── 1. Télécharger backup distant (A)
    │
    ├── 2. Comparer les transactions par ID unique
    │
    ├── 3. Fusionner:
    │      - Tx1 (de A): ajoutée
    │      - Tx2 (de B): conservée (locale)
    │      - Tx3 (de A): ajoutée
    │      - Tx4 (de B): conservée (locale)
    │
    ├── 4. Recalculer les soldes
    │
    └── 5. Upload nouveau backup fusionné
            │
            ▼
        [Fichier Drive: backup_merged_10h35.json.gz]

Note: Grâce à l'event-sourcing (transactions immuables avec ID unique),
      le merge est déterministe et sans perte de données.
```

### 4.6 Flow : Restauration depuis backup (Parent)

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESTAURATION BACKUP                           │
└─────────────────────────────────────────────────────────────────┘

[Menu Settings]
    │
    ▼
[Section "Sauvegarde Cloud"]
    │
    ▼
[Bouton "Restaurer"]
    │
    ▼
[Liste des backups disponibles]
┌──────────────────────────────────────────────────────────────┐
│ 📁 Backups Google Drive                                       │
├──────────────────────────────────────────────────────────────┤
│ ○ backup_2026-01-17_10h30.json.gz  (2.3 KB) - Il y a 2h     │
│ ○ backup_2026-01-16_18h00.json.gz  (2.1 KB) - Hier          │
│ ○ backup_2026-01-15_20h45.json.gz  (1.9 KB) - Il y a 2j     │
└──────────────────────────────────────────────────────────────┘
    │
    ▼
[Sélection d'un backup]
    │
    ▼
[Bouton "Prévisualiser"]
    │
    ▼
[Écran Preview]
┌──────────────────────────────────────────────────────────────┐
│ Contenu du backup du 17/01/2026 10:30                        │
├──────────────────────────────────────────────────────────────┤
│ Profils: 2 (Enora, Martin)                                   │
│ Transactions: 47                                             │
│ Motifs: 12                                                   │
│ Dernière transaction: 17/01/2026 10:28                       │
│                                                              │
│ Soldes:                                                      │
│   - Enora: 45,50 €                                           │
│   - Martin: 32,00 €                                          │
├──────────────────────────────────────────────────────────────┤
│ ⚠️  La restauration remplacera toutes vos données actuelles  │
│     Un backup de sécurité sera créé avant.                   │
└──────────────────────────────────────────────────────────────┘
    │
    ▼
[Bouton "Restaurer ce backup"]
    │
    ▼
[Dialog confirmation]
"Êtes-vous sûr ? Vos données actuelles seront sauvegardées puis remplacées."
    │
    ├── Annuler ──► [Retour liste]
    │
    └── Confirmer ──► [1. Créer backup sécurité local]
                           │
                           ▼
                      [2. Télécharger & décompresser]
                           │
                           ▼
                      [3. Valider intégrité (hash)]
                           │
                           ▼
                      [4. Remplacer données IndexedDB]
                           │
                           ▼
                      [5. Recalculer tous les soldes]
                           │
                           ▼
                      [Toast "Restauration réussie"]
                           │
                           ▼
                      [Retour Dashboard]
```

---

## 5. Exigences fonctionnelles

### 5.1 Tableau récapitulatif MVP vs V1

| Fonctionnalité | MVP | V1 | Description |
|----------------|-----|-----|-------------|
| **Profils enfants** | ✅ | ✅ | Enora, Martin pré-créés |
| Ajouter profil | ❌ | ✅ | Extensibilité future |
| Archiver profil | ❌ | ✅ | Masquer sans supprimer |
| **Transactions** | | | |
| Créer entrée/sortie | ✅ | ✅ | Cœur de l'app |
| Historique filtrable | ✅ | ✅ | Par enfant, période, type |
| Correction (contre-écriture) | ✅ | ✅ | Annuler ou ajuster |
| Duplication transaction | ❌ | ✅ | Saisie rapide récurrents |
| **Motifs/catégories** | | | |
| Liste prédéfinie | ✅ | ✅ | 10 motifs par défaut |
| Ajouter motif | ✅ | ✅ | Personnalisation |
| Renommer motif | ❌ | ✅ | |
| Archiver motif | ❌ | ✅ | Masquer sans supprimer |
| **Dashboard** | | | |
| Soldes par enfant | ✅ | ✅ | Vue principale |
| Dernières transactions | ✅ | ✅ | 5-10 dernières |
| Stats dépenses/motif | ❌ | ✅ | Graphique simple 30j |
| **Rôles & accès** | | | |
| Mode Parent (éditeur) | ✅ | ✅ | Toutes actions |
| Mode Enfant (lecteur) | ✅ | ✅ | Consultation seule |
| PIN mode enfant | ✅ | ✅ | Sécurité basique |
| **Stockage local** | | | |
| IndexedDB (Dexie) | ✅ | ✅ | Persistance principale |
| Versionning schéma | ✅ | ✅ | Migrations |
| **Export/Import** | | | |
| Export JSON | ✅ | ✅ | Backup manuel |
| Import JSON (merge) | ✅ | ✅ | Fusion données |
| Import JSON (replace) | ✅ | ✅ | Remplacement total |
| **Google Drive** | | | |
| Connexion OAuth | ✅ | ✅ | Authentification |
| Backup manuel | ✅ | ✅ | Bouton explicite |
| Backup auto | ✅ | ✅ | Après modifications |
| Restauration | ✅ | ✅ | Depuis liste backups |
| Sync multi-appareils | ✅ | ✅ | Via dossier partagé |
| Chiffrement backup | ❌ | ✅ | Optionnel, mot de passe |
| **PWA** | | | |
| Installation | ✅ | ✅ | Add to home screen |
| Offline complet | ✅ | ✅ | 100% fonctionnel |
| Mise à jour auto | ✅ | ✅ | Service worker |

### 5.2 Détail des exigences MVP

#### F1 - Profils enfants

| ID | Exigence | Règles |
|----|----------|--------|
| F1.1 | Deux profils pré-créés au premier lancement | Noms: "Enora", "Martin", solde initial: 0.00€ |
| F1.2 | Chaque profil a un solde calculé | Solde = Σ(entrées) - Σ(sorties) |
| F1.3 | Affichage solde avec 2 décimales | Format: "45,50 €" (locale FR) |
| F1.4 | Solde peut être négatif | Affichage rouge si < 0 |

#### F2 - Transactions

| ID | Exigence | Règles |
|----|----------|--------|
| F2.1 | Type: ENTREE ou SORTIE | Enum, requis |
| F2.2 | Montant: décimal positif | Min: 0.01€, Max: 9999.99€, 2 décimales max |
| F2.3 | Date/heure | Défaut: now(), modifiable (passé OK, futur interdit) |
| F2.4 | Motif: requis | FK vers table motifs |
| F2.5 | Note: optionnelle | String, max 200 caractères |
| F2.6 | Enfant: requis | FK vers table profils |
| F2.7 | Transactions immuables | Pas d'UPDATE, seulement INSERT |
| F2.8 | Soft delete interdit | On ne supprime jamais, on contre-écrit |
| F2.9 | Correction = nouvelle transaction | Champ `correctionOf` pointe vers ID original |
| F2.10 | Motif secret (optionnel) | Liste de profils pour lesquels le motif est masqué |

#### F2bis - Fonctionnalité "Motif Secret"

| ID | Exigence | Règles |
|----|----------|--------|
| F2bis.1 | Cases à cocher par profil | 4 profils possibles : Enora, Martin, Camille, Emeline |
| F2bis.2 | Masquage du motif | Si profil dans la liste, motif affiché = "Secret" |
| F2bis.3 | Note également masquée | Si motif secret, la note est aussi cachée |
| F2bis.4 | Parents voient tout | Les parents voient toujours le vrai motif + indicateur "secret pour X" |
| F2bis.5 | Montant visible | Seul le motif est masqué, pas le montant ni la date |
| F2bis.6 | Cas d'usage principal | Cadeau surprise : parent prépare un cadeau sans que l'enfant concerné ne voie le motif |

**Exemple d'usage :**
- Camille ajoute une sortie de 25€ pour Martin
- Motif : "Cadeau anniversaire Enora"
- Coche "Secret pour Enora"
- Résultat : Enora voit la transaction (sortie 25€ pour Martin) mais avec motif "Secret"

#### F3 - Motifs/catégories

| ID | Exigence | Règles |
|----|----------|--------|
| F3.1 | Motifs prédéfinis au premier lancement | Voir liste ci-dessous |
| F3.2 | Nom unique | Case-insensitive |
| F3.3 | Ajout de motif custom | PARENT uniquement |

**Motifs prédéfinis (10):**
1. Argent de poche
2. Récompense
3. Anniversaire
4. Noël
5. Autre cadeau
6. Achat bonbons/friandises
7. Achat jouet
8. Achat vêtement
9. Achat livre
10. Autre dépense

#### F4 - Dashboard

| ID | Exigence | Règles |
|----|----------|--------|
| F4.1 | Affichage des 2 soldes | Cartes côte à côte ou empilées |
| F4.2 | Dernières transactions | 5 par défaut, toutes confondues ou par enfant |
| F4.3 | Accès rapide ajout | FAB "+" visible (PARENT uniquement) |
| F4.4 | Indicateur sync | Icône: synced / pending / error |

#### F5 - Rôles et accès

| ID | Exigence | Règles |
|----|----------|--------|
| F5.1 | Rôle PARENT | Toutes permissions (Camille, Emeline) |
| F5.2 | Rôle ENFANT | Lecture seule de TOUS les profils enfants (Enora, Martin) |
| F5.3 | PIN mode parent | 4-6 chiffres, stocké hashé (SHA-256) |
| F5.4 | Basculement mode | Parent→Enfant: direct. Enfant→Parent: PIN requis |
| F5.5 | Mode par défaut au lancement | ENFANT (sécurité) |
| F5.6 | Timeout session parent | Retour auto mode ENFANT après 30 min inactivité |
| F5.7 | Motifs secrets | Si transaction marquée secrète pour un profil, masquer motif/note pour ce profil |

**Matrice des permissions:**

| Action | PARENT | ENFANT |
|--------|--------|--------|
| Voir solde tous les enfants | ✅ | ✅ |
| Voir historique tous les enfants | ✅ | ✅ |
| Voir vrais motifs (même secrets) | ❌ (si secret pour lui) | ❌ (si secret pour lui) |
| Créer transaction | ✅ | ❌ |
| Corriger transaction | ✅ | ❌ |
| Marquer motif secret | ✅ | ❌ |
| Gérer motifs | ✅ | ❌ |
| Gérer profils | ✅ | ❌ |
| Export JSON | ✅ | ❌ |
| Import JSON | ✅ | ❌ |
| Connexion Google | ✅ | ❌ |
| Backup/Restore Drive | ✅ | ❌ |
| Voir settings | ✅ | ❌ |
| Changer PIN | ✅ | ❌ |

#### F6 - Export/Import JSON

| ID | Exigence | Règles |
|----|----------|--------|
| F6.1 | Format versionné | Champ `schemaVersion` obligatoire |
| F6.2 | Export complet | Tous profils, transactions, motifs, settings |
| F6.3 | Nom fichier | `ArgentDePoche_export_YYYYMMDD_HHMMSS.json` |
| F6.4 | Import validation | Vérifier schemaVersion, structure, types |
| F6.5 | Import merge | Ajouter transactions avec ID inexistant |
| F6.6 | Import replace | Vider toutes les tables puis insérer |
| F6.7 | Doublons ignorés | Si même ID existe déjà (merge mode) |

#### F7 - Google Drive

| ID | Exigence | Règles |
|----|----------|--------|
| F7.1 | OAuth scope | `https://www.googleapis.com/auth/drive.file` uniquement |
| F7.2 | Dossier dédié | Nom: "ArgentDePoche_Backup" |
| F7.3 | Format backup | GZIP JSON (`.json.gz`) |
| F7.4 | Nom fichier backup | `ArgentDePoche_{deviceId}_backup_v{version}_{timestamp}.json.gz` |
| F7.5 | Backup auto | Après chaque modification, debounce 30s |
| F7.6 | Backup manuel | Bouton dans settings |
| F7.7 | Rétention | Garder les 10 derniers backups |
| F7.8 | Restauration | Liste, preview, confirmation |
| F7.9 | Hash intégrité | SHA-256 dans metadata |
| F7.10 | Partage dossier | Instructions pour partager avec conjoint |

---

## 6. Exigences non fonctionnelles

### 6.1 Offline-first

| ID | Exigence | Cible | Mesure |
|----|----------|-------|--------|
| NF1.1 | 100% des fonctionnalités critiques offline | Création, consultation, correction | Test manuel déconnecté |
| NF1.2 | Aucune dépendance serveur pour le cœur | IndexedDB seul suffit | Audit code |
| NF1.3 | Sync opportuniste | Upload quand online | Logs network |
| NF1.4 | Queue de backup offline | Persister en localStorage | Test offline puis online |
| NF1.5 | Indicateur état connexion | Visible mais non bloquant | UI review |

### 6.2 Performance

| ID | Exigence | Cible | Mesure |
|----|----------|-------|--------|
| NF2.1 | First Contentful Paint | < 1.5s | Lighthouse |
| NF2.2 | Time to Interactive | < 3s | Lighthouse |
| NF2.3 | Affichage dashboard | < 500ms | Performance API |
| NF2.4 | Ajout transaction | < 100ms (local) | Performance API |
| NF2.5 | Taille bundle JS | < 200KB gzip | Build stats |
| NF2.6 | Taille backup 100 transactions | < 50KB gzip | Test réel |

### 6.3 Accessibilité

| ID | Exigence | Cible | Mesure |
|----|----------|-------|--------|
| NF3.1 | Score Lighthouse Accessibility | ≥ 90 | Lighthouse |
| NF3.2 | Navigation clavier | Tous les éléments interactifs | Test manuel |
| NF3.3 | Contraste couleurs | WCAG AA (4.5:1 texte, 3:1 UI) | Contrast checker |
| NF3.4 | Labels ARIA | Tous les boutons icône | Audit HTML |
| NF3.5 | Taille touch target | ≥ 44x44px | Mesure CSS |
| NF3.6 | Mode contraste élevé | Optionnel dans settings | Test visuel |

### 6.4 Sécurité

| ID | Exigence | Cible | Mesure |
|----|----------|-------|--------|
| NF4.1 | PIN stocké hashé | SHA-256 avec salt | Audit code |
| NF4.2 | Tokens OAuth non exposés | localStorage, pas dans URL | Audit code |
| NF4.3 | Scope OAuth minimal | drive.file uniquement | Config OAuth |
| NF4.4 | Pas de données sensibles en clair | PIN, tokens hashés/chiffrés | Audit storage |
| NF4.5 | CSP headers | Strict, inline désactivé | Headers check |
| NF4.6 | HTTPS obligatoire | Redirect HTTP→HTTPS | Test déploiement |

### 6.5 Compatibilité navigateurs

| Navigateur | Version minimale | Support |
|------------|------------------|---------|
| Chrome (Android) | 90+ | ✅ Complet |
| Safari (iOS) | 15+ | ✅ Complet |
| Firefox | 90+ | ✅ Complet |
| Samsung Internet | 15+ | ✅ Complet |
| Edge | 90+ | ✅ Complet |
| Safari macOS | 15+ | ⚠️ PWA limitée |
| IE 11 | - | ❌ Non supporté |

### 6.6 RGPD et confidentialité

| ID | Exigence | Description |
|----|----------|-------------|
| NF6.1 | Données locales uniquement | Aucun serveur tiers sauf Google Drive (opt-in) |
| NF6.2 | Pas de tracking | Aucun analytics, aucun pixel |
| NF6.3 | Consentement Drive explicite | Popup OAuth = consentement |
| NF6.4 | Droit à l'effacement | Export puis suppression locale possible |
| NF6.5 | Portabilité | Export JSON standard |
| NF6.6 | Transparence | Données = argent de poche uniquement |
| NF6.7 | Données enfants | Prénoms uniquement, pas de données personnelles sensibles |

---

## 7. Modèle de données

### 7.1 Diagramme entités-relations

```
┌─────────────────────────────────────────────────────────────────┐
│                      MODÈLE DE DONNÉES                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    User      │       │   Transaction    │       │    Motif     │
│  (famille)   │       ├──────────────────┤       ├──────────────┤
├──────────────┤       │ id (PK)          │───────►│ id (PK)      │
│ id (PK)      │       │ profileId (FK)   │       │ name         │
│ name         │       │ type             │       │ isDefault    │
│ role         │       │ amount           │       │ archivedAt?  │
│ linkedProfile│───┐   │ motifId (FK)     │       │ createdAt    │
│ order        │   │   │ note?            │       │ order        │
└──────────────┘   │   │ date             │       └──────────────┘
                   │   │ createdAt        │
┌──────────────┐   │   │ correctionOf?    │───┐
│   Profile    │◄──┘   │ deviceId         │   │ (self-reference)
│ (argent)     │◄──────│ hiddenForUsers[] │   │
├──────────────┤       └──────────────────┘◄──┘
│ id (PK)      │              │
│ name         │              │ (liste d'IDs users
│ createdAt    │              │  pour masquer motif)
│ archivedAt?  │              ▼
│ order        │       ┌──────────────┐
└──────────────┘       │ User.id[]    │
                       └──────────────┘

┌──────────────┐       ┌──────────────────┐
│   Settings   │       │   SyncMetadata   │
├──────────────┤       ├──────────────────┤
│ id (PK)      │       │ id (PK)          │
│ parentPin    │       │ lastSyncAt       │
│ currentMode  │       │ lastBackupAt     │
│ currentUser? │       │ deviceId         │
│ theme        │       │ driveFileId?     │
│ createdAt    │       │ driveFolderId?   │
│ updatedAt    │       └──────────────────┘
└──────────────┘

Légende:
- User: membres de la famille (Camille, Emeline, Enora, Martin)
- Profile: comptes d'argent des enfants (soldes)
- Un User ENFANT a un linkedProfile (son compte d'argent)
- Un User PARENT n'a pas de linkedProfile (il gère seulement)
- hiddenForUsers[]: IDs des Users pour lesquels le motif est secret
```

### 7.2 Schéma détaillé des tables

#### Table: `profiles`

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | string (UUID) | PK, auto-generated | Identifiant unique |
| `name` | string | NOT NULL, UNIQUE, max 50 | Prénom de l'enfant |
| `createdAt` | number (timestamp) | NOT NULL, default: now | Date création |
| `archivedAt` | number (timestamp) | NULL | Si archivé, date archivage |
| `order` | number | NOT NULL, default: 0 | Ordre d'affichage |

**Index:** `id`, `name`, `archivedAt`

**Données initiales:**
```json
[
  { "id": "profile-enora", "name": "Enora", "order": 0 },
  { "id": "profile-martin", "name": "Martin", "order": 1 }
]
```

#### Table: `transactions`

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | string (UUID) | PK, auto-generated | Identifiant unique |
| `profileId` | string | FK→profiles.id, NOT NULL | Enfant concerné |
| `type` | enum | 'ENTREE' \| 'SORTIE', NOT NULL | Type de transaction |
| `amount` | number | > 0, max 2 decimals, NOT NULL | Montant en euros |
| `motifId` | string | FK→motifs.id, NOT NULL | Catégorie |
| `note` | string | NULL, max 200 chars | Note optionnelle |
| `date` | number (timestamp) | NOT NULL | Date effective de la transaction |
| `createdAt` | number (timestamp) | NOT NULL, default: now | Date de saisie |
| `correctionOf` | string | FK→transactions.id, NULL | Si correction, pointe vers l'originale |
| `deviceId` | string | NOT NULL | Appareil ayant créé la transaction |
| `hiddenForUsers` | string[] | NULL, default: [] | Liste des userIds pour lesquels le motif est masqué |

**Index:** `id`, `profileId`, `date`, `motifId`, `correctionOf`, `[profileId+date]` (compound)

**Règles métier:**
- `amount` toujours positif, le `type` détermine débit/crédit
- `date` peut être dans le passé mais pas dans le futur
- `correctionOf` permet de tracer les corrections
- `hiddenForUsers` : si l'utilisateur courant est dans cette liste, afficher "Secret" au lieu du motif/note

#### Table: `users` (membres de la famille)

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | string | PK | Identifiant unique (ex: 'camille', 'emeline', 'enora', 'martin') |
| `name` | string | NOT NULL | Prénom affiché |
| `role` | enum | 'PARENT' \| 'ENFANT', NOT NULL | Rôle dans l'app |
| `linkedProfileId` | string | FK→profiles.id, NULL | Pour ENFANT: lien vers son profil d'argent |
| `order` | number | NOT NULL | Ordre d'affichage dans les listes |

**Index:** `id`, `role`

**Données initiales:**
```json
[
  { "id": "camille", "name": "Camille", "role": "PARENT", "linkedProfileId": null, "order": 0 },
  { "id": "emeline", "name": "Emeline", "role": "PARENT", "linkedProfileId": null, "order": 1 },
  { "id": "enora", "name": "Enora", "role": "ENFANT", "linkedProfileId": "profile-enora", "order": 2 },
  { "id": "martin", "name": "Martin", "role": "ENFANT", "linkedProfileId": "profile-martin", "order": 3 }
]
```

**Note:** La table `users` représente les membres de la famille qui utilisent l'app. La table `profiles` représente les comptes d'argent des enfants. Un parent n'a pas de profil d'argent (il gère, il n'a pas de solde).

#### Table: `motifs`

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | string (UUID) | PK, auto-generated | Identifiant unique |
| `name` | string | NOT NULL, UNIQUE, max 50 | Libellé du motif |
| `isDefault` | boolean | NOT NULL, default: false | Prédéfini (non supprimable) |
| `archivedAt` | number (timestamp) | NULL | Si archivé |
| `createdAt` | number (timestamp) | NOT NULL | Date création |
| `order` | number | NOT NULL | Ordre d'affichage |

**Index:** `id`, `name`, `archivedAt`, `isDefault`

**Données initiales (10 motifs):**
```json
[
  { "id": "motif-01", "name": "Argent de poche", "isDefault": true, "order": 0 },
  { "id": "motif-02", "name": "Récompense", "isDefault": true, "order": 1 },
  { "id": "motif-03", "name": "Anniversaire", "isDefault": true, "order": 2 },
  { "id": "motif-04", "name": "Noël", "isDefault": true, "order": 3 },
  { "id": "motif-05", "name": "Autre cadeau", "isDefault": true, "order": 4 },
  { "id": "motif-06", "name": "Achat bonbons/friandises", "isDefault": true, "order": 5 },
  { "id": "motif-07", "name": "Achat jouet", "isDefault": true, "order": 6 },
  { "id": "motif-08", "name": "Achat vêtement", "isDefault": true, "order": 7 },
  { "id": "motif-09", "name": "Achat livre", "isDefault": true, "order": 8 },
  { "id": "motif-10", "name": "Autre dépense", "isDefault": true, "order": 9 }
]
```

#### Table: `settings`

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | string | PK, default: 'local' | Singleton |
| `parentPinHash` | string | NULL | SHA-256(salt + PIN) |
| `parentPinSalt` | string | NULL | Salt aléatoire |
| `currentMode` | enum | 'PARENT' \| 'ENFANT', default: 'ENFANT' | Mode actif |
| `currentUserId` | string | FK→users.id, NULL | User actif (pour savoir qui consulte et filtrer les motifs secrets) |
| `theme` | enum | 'light' \| 'dark' \| 'system', default: 'system' | Thème UI |
| `highContrast` | boolean | default: false | Mode contraste élevé |
| `createdAt` | number | NOT NULL | Date création |
| `updatedAt` | number | NOT NULL | Dernière modification |
| `parentSessionExpiry` | number | NULL | Timestamp expiration session parent |

**Index:** `id`

**Usage de currentUserId:**
- En mode PARENT : identifie quel parent utilise l'app (pour les motifs secrets entre parents)
- En mode ENFANT : identifie quel enfant consulte (pour masquer les motifs secrets pour cet enfant)

#### Table: `syncMetadata`

| Champ | Type | Contraintes | Description |
|-------|------|-------------|-------------|
| `id` | string | PK, default: 'sync' | Singleton |
| `deviceId` | string | NOT NULL, auto-generated | UUID unique de l'appareil |
| `lastSyncAt` | number | NULL | Dernier sync réussi |
| `lastBackupAt` | number | NULL | Dernier backup réussi |
| `driveFolderId` | string | NULL | ID dossier Google Drive |
| `driveLastFileId` | string | NULL | ID dernier fichier backup |
| `isDirty` | boolean | default: false | Modifications non sauvegardées |
| `pendingBackups` | string (JSON) | NULL | Queue de backups en attente |

**Index:** `id`

### 7.3 Format JSON Export/Backup

```json
{
  "schemaVersion": 1,
  "appVersion": "1.0.0",
  "exportedAt": 1737100000000,
  "deviceId": "uuid-device-123",
  "checksum": "sha256-hash-here",
  "data": {
    "users": [
      { "id": "camille", "name": "Camille", "role": "PARENT", "linkedProfileId": null, "order": 0 },
      { "id": "emeline", "name": "Emeline", "role": "PARENT", "linkedProfileId": null, "order": 1 },
      { "id": "enora", "name": "Enora", "role": "ENFANT", "linkedProfileId": "profile-enora", "order": 2 },
      { "id": "martin", "name": "Martin", "role": "ENFANT", "linkedProfileId": "profile-martin", "order": 3 }
    ],
    "profiles": [
      {
        "id": "profile-enora",
        "name": "Enora",
        "createdAt": 1737000000000,
        "archivedAt": null,
        "order": 0
      }
    ],
    "transactions": [
      {
        "id": "tx-uuid-001",
        "profileId": "profile-enora",
        "type": "ENTREE",
        "amount": 10.00,
        "motifId": "motif-01",
        "note": "Semaine 3",
        "date": 1737050000000,
        "createdAt": 1737050000000,
        "correctionOf": null,
        "deviceId": "uuid-device-123",
        "hiddenForUsers": []
      },
      {
        "id": "tx-uuid-002",
        "profileId": "profile-martin",
        "type": "SORTIE",
        "amount": 25.00,
        "motifId": "motif-03",
        "note": "Cadeau anniversaire pour Enora",
        "date": 1737060000000,
        "createdAt": 1737060000000,
        "correctionOf": null,
        "deviceId": "uuid-device-123",
        "hiddenForUsers": ["enora"]
      }
    ],
    "motifs": [
      {
        "id": "motif-01",
        "name": "Argent de poche",
        "isDefault": true,
        "archivedAt": null,
        "createdAt": 1737000000000,
        "order": 0
      }
    ],
    "settings": {
      "id": "local",
      "theme": "dark",
      "highContrast": false
    }
  }
}
```

**Notes importantes:**
- `parentPinHash` et `parentPinSalt` ne sont PAS exportés (sécurité)
- `currentMode` et `currentUserId` ne sont PAS exportés (état session)
- `checksum` = SHA-256 de `JSON.stringify(data)`
- `hiddenForUsers` contient les IDs des users (pas profiles) pour lesquels le motif est masqué

### 7.4 Calcul du solde

Le solde n'est **pas stocké** mais **calculé dynamiquement** :

```typescript
function calculateBalance(profileId: string): number {
  const transactions = db.transactions
    .where('profileId')
    .equals(profileId)
    .toArray();

  return transactions.reduce((sum, tx) => {
    if (tx.type === 'ENTREE') {
      return sum + tx.amount;
    } else {
      return sum - tx.amount;
    }
  }, 0);
}
```

**Avantages:**
- Pas de désynchronisation possible entre solde et transactions
- Intégrité garantie
- Event-sourcing naturel

**Performance:**
- Avec index sur `profileId`, calcul < 10ms pour 1000 transactions
- Si besoin : cache mémoire invalidé à chaque nouvelle transaction

### 7.5 Versionning du schéma (Dexie)

```typescript
const db = new Dexie('ArgentDePocheDB');

// Version 1 - MVP
db.version(1).stores({
  users: 'id, role, linkedProfileId, order',
  profiles: 'id, name, archivedAt, order',
  transactions: 'id, profileId, date, motifId, correctionOf, [profileId+date], *hiddenForUsers',
  motifs: 'id, name, archivedAt, isDefault, order',
  settings: 'id',
  syncMetadata: 'id'
});

// Note: *hiddenForUsers = index multi-valued pour les tableaux
// Permet de requêter "toutes les transactions cachées pour userId X"

// Version 2 - Future (exemple)
db.version(2).stores({
  // Ajout d'une table ou modification d'index
}).upgrade(tx => {
  // Migration des données si nécessaire
});
```

---

## 8. Architecture technique

### 8.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE GLOBALE                             │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │  Google Drive   │
                              │    (Cloud)      │
                              └────────▲────────┘
                                       │
                                       │ OAuth 2.0 + Drive API v3
                                       │ (Backup/Sync)
                                       │
┌──────────────────────────────────────┼──────────────────────────────────┐
│                                      │                                  │
│  ┌─────────────┐              ┌──────┴──────┐              ┌──────────┐ │
│  │   Parent    │◄────────────►│    PWA      │◄────────────►│  Enfant  │ │
│  │  (iPhone)   │   Sync via   │  (React)    │   Mode       │ (Tablet) │ │
│  └─────────────┘   Drive      └──────┬──────┘   lecture    └──────────┘ │
│                                      │          seule                   │
│  ┌─────────────┐                     │                                  │
│  │   Parent    │◄────────────────────┘                                  │
│  │ (Android)   │                                                        │
│  └─────────────┘                                                        │
│                                                                         │
│                         APPAREIL LOCAL                                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │  ┌──────────────┐    ┌──────────────┐    ┌───────────────────┐     │ │
│  │  │  IndexedDB   │    │ localStorage │    │  Service Worker   │     │ │
│  │  │   (Dexie)    │    │  (Config)    │    │    (Workbox)      │     │ │
│  │  │              │    │              │    │                   │     │ │
│  │  │ - profiles   │    │ - authToken  │    │ - Cache assets    │     │ │
│  │  │ - transacts  │    │ - deviceId   │    │ - Offline mode    │     │ │
│  │  │ - motifs     │    │ - syncQueue  │    │ - Auto-update     │     │ │
│  │  │ - settings   │    │ - backupCfg  │    │                   │     │ │
│  │  └──────────────┘    └──────────────┘    └───────────────────┘     │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Stack technique détaillée

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Framework UI** | React 18 | Écosystème mature, hooks, concurrent features |
| **Langage** | TypeScript 5.x | Typage fort, maintenabilité |
| **Build** | Vite 5.x | HMR rapide, build optimisé |
| **Routing** | TanStack Router | Type-safe, lazy loading natif |
| **Stockage principal** | Dexie 4.x (IndexedDB) | API Promise, réactif, transactions ACID |
| **Stockage config** | localStorage | Simple, synchrone, adapté aux tokens |
| **Styling** | Tailwind CSS 3.x | Utility-first, purge CSS, thèmes |
| **Composants** | CVA + composants custom | Variants type-safe, cohérence UI |
| **Icônes** | Lucide React | Léger, tree-shakeable, 460+ icônes |
| **Dates** | date-fns | Immuable, modulaire, locale FR |
| **Compression** | pako (gzip) | Backups compressés ~80% |
| **PWA** | vite-plugin-pwa + Workbox | Service worker, manifest, caching |
| **OAuth** | Google Identity Services | OAuth 2.0 implicit flow, pas de backend |

### 8.3 Structure des dossiers

```
src/
├── app/
│   ├── layout/
│   │   ├── AppShell.tsx           # Container principal
│   │   ├── TopBar.tsx             # Barre de titre
│   │   ├── BottomNav.tsx          # Navigation mobile
│   │   └── Drawer.tsx             # Menu latéral (settings)
│   ├── routes/
│   │   ├── __root.tsx             # Layout racine
│   │   ├── index.tsx              # Dashboard (home)
│   │   ├── transactions/
│   │   │   ├── index.tsx          # Liste transactions
│   │   │   ├── new.tsx            # Ajout transaction
│   │   │   └── $id.tsx            # Détail transaction
│   │   ├── profiles/
│   │   │   ├── index.tsx          # Liste profils
│   │   │   └── $id.tsx            # Détail profil + historique
│   │   └── settings/
│   │       ├── index.tsx          # Settings principal
│   │       ├── motifs.tsx         # Gestion motifs
│   │       ├── backup.tsx         # Google Drive
│   │       └── security.tsx       # PIN, modes
│   └── router.tsx                 # Configuration router
├── components/
│   ├── ui/                        # Composants de base
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Switch.tsx
│   │   └── ...
│   ├── transaction/
│   │   ├── TransactionForm.tsx    # Formulaire ajout/edit
│   │   ├── TransactionCard.tsx    # Carte transaction
│   │   └── TransactionList.tsx    # Liste avec filtres
│   ├── profile/
│   │   ├── ProfileCard.tsx        # Carte solde enfant
│   │   └── ProfileSelector.tsx    # Sélection enfant
│   ├── dashboard/
│   │   ├── BalanceOverview.tsx    # Vue soldes
│   │   └── RecentTransactions.tsx # Dernières opérations
│   └── auth/
│       ├── PinPad.tsx             # Clavier PIN
│       ├── ModeSwitch.tsx         # Bascule Parent/Enfant
│       └── ChildSelector.tsx      # Sélection profil enfant
├── contexts/
│   ├── AuthContext.tsx            # Mode actuel, permissions
│   └── AlertContext.tsx           # Toasts, notifications
├── data/
│   ├── db.ts                      # Schéma Dexie
│   ├── repositories/
│   │   ├── ProfileRepository.ts
│   │   ├── TransactionRepository.ts
│   │   ├── MotifRepository.ts
│   │   └── SettingsRepository.ts
│   └── initialization.ts          # Données initiales
├── services/
│   ├── backup/
│   │   ├── BackupManager.ts       # Orchestration backup
│   │   ├── BackupRepository.ts    # État backup (localStorage)
│   │   ├── GoogleAuthService.ts   # OAuth
│   │   └── GoogleDriveService.ts  # API Drive
│   ├── sync/
│   │   └── SyncService.ts         # Logique de merge
│   └── export/
│       ├── JsonExporter.ts
│       └── JsonImporter.ts
├── hooks/
│   ├── useAuth.ts                 # Hook contexte auth
│   ├── useBalance.ts              # Calcul solde réactif
│   ├── useBackup.ts               # État backup
│   ├── useTransactions.ts         # CRUD transactions
│   └── useProfiles.ts             # CRUD profils
├── lib/
│   ├── utils.ts                   # Utilitaires (cn, format)
│   ├── crypto.ts                  # Hash PIN
│   └── validators.ts              # Validation formulaires
├── types/
│   └── index.ts                   # Types TypeScript
├── pwa/
│   └── registerSW.ts              # Service worker registration
├── main.tsx                       # Entry point
└── index.css                      # Styles globaux + Tailwind
```

### 8.4 Gestion des rôles (RBAC)

```typescript
// types/auth.ts
export type Role = 'PARENT' | 'ENFANT';

export interface AuthState {
  currentMode: Role;
  currentChildId: string | null;  // Si ENFANT, quel profil
  sessionExpiry: number | null;   // Si PARENT, quand expire
}

// contexts/AuthContext.tsx
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    currentMode: 'ENFANT',  // Défaut sécurisé
    currentChildId: null,
    sessionExpiry: null,
  });

  const canEdit = authState.currentMode === 'PARENT';
  const canViewAllProfiles = authState.currentMode === 'PARENT';
  const visibleProfileId = authState.currentMode === 'ENFANT'
    ? authState.currentChildId
    : null;

  // Vérification expiration session parent
  useEffect(() => {
    if (authState.currentMode === 'PARENT' && authState.sessionExpiry) {
      const timeout = authState.sessionExpiry - Date.now();
      if (timeout > 0) {
        const timer = setTimeout(() => {
          setAuthState(prev => ({ ...prev, currentMode: 'ENFANT' }));
        }, timeout);
        return () => clearTimeout(timer);
      }
    }
  }, [authState.sessionExpiry]);

  return (
    <AuthContext.Provider value={{
      authState,
      canEdit,
      canViewAllProfiles,
      visibleProfileId,
      switchToParent,
      switchToChild,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 8.5 Stratégie de synchronisation Google Drive

#### Option recommandée : Dossier partagé + Merge event-sourcing

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STRATÉGIE DE SYNC RECOMMANDÉE                        │
└─────────────────────────────────────────────────────────────────────────┘

1. PREMIÈRE CONNEXION (Parent A - Camille)
   ├── Créer dossier "ArgentDePoche_Backup" dans Drive
   ├── Stocker driveFolderId localement
   └── Upload premier backup

2. PARTAGE (Manuel, une seule fois)
   └── Parent A partage le dossier avec Parent B (Emeline)
       → Clic droit > Partager > Email Emeline > Éditeur

3. CONNEXION PARENT B (Emeline)
   ├── OAuth Google (son compte)
   ├── Recherche dossiers partagés avec nom "ArgentDePoche_Backup"
   ├── Si trouvé: utiliser ce dossier
   ├── Télécharger dernier backup
   └── Merge avec données locales (probablement vides)

4. SYNC CONTINUE (les deux parents)

   [Modification locale]
        │
        ▼
   [isDirty = true]
        │
        ▼
   [Debounce 30s]
        │
        ▼
   [Online ?]
        │
        ├── Non ──► [Queue dans localStorage]
        │
        └── Oui ──► [Fetch dernier backup distant]
                          │
                          ▼
                    [Comparer timestamps]
                          │
                          ├── Local plus récent ──► [Upload directement]
                          │
                          └── Distant plus récent ──► [MERGE]
                                                          │
                                                          ▼
                                                    [Télécharger distant]
                                                          │
                                                          ▼
                                                    [Fusionner transactions]
                                                    (par ID unique, union)
                                                          │
                                                          ▼
                                                    [Recalculer soldes]
                                                          │
                                                          ▼
                                                    [Upload merged backup]
```

#### Algorithme de merge

```typescript
// services/sync/SyncService.ts

interface MergeResult {
  profiles: Profile[];
  transactions: Transaction[];
  motifs: Motif[];
  conflicts: Conflict[];
}

function mergeData(local: ExportData, remote: ExportData): MergeResult {
  const result: MergeResult = {
    profiles: [],
    transactions: [],
    motifs: [],
    conflicts: [],
  };

  // 1. Merge profiles (par ID, le plus récent gagne)
  const allProfileIds = new Set([
    ...local.profiles.map(p => p.id),
    ...remote.profiles.map(p => p.id),
  ]);

  for (const id of allProfileIds) {
    const localProfile = local.profiles.find(p => p.id === id);
    const remoteProfile = remote.profiles.find(p => p.id === id);

    if (!localProfile) {
      result.profiles.push(remoteProfile!);
    } else if (!remoteProfile) {
      result.profiles.push(localProfile);
    } else {
      // Les deux existent: prendre le plus récemment modifié
      result.profiles.push(
        localProfile.createdAt > remoteProfile.createdAt
          ? localProfile
          : remoteProfile
      );
    }
  }

  // 2. Merge transactions (UNION - jamais de conflit car immuables)
  const allTransactionIds = new Set([
    ...local.transactions.map(t => t.id),
    ...remote.transactions.map(t => t.id),
  ]);

  for (const id of allTransactionIds) {
    const localTx = local.transactions.find(t => t.id === id);
    const remoteTx = remote.transactions.find(t => t.id === id);

    // Prendre l'un ou l'autre (identiques si même ID)
    result.transactions.push(localTx || remoteTx!);
  }

  // 3. Merge motifs (similaire aux profiles)
  // ... même logique

  return result;
}
```

#### Pourquoi pas AppDataFolder ?

| Critère | AppDataFolder | Dossier partagé |
|---------|---------------|-----------------|
| Partage entre comptes | ❌ Impossible | ✅ Natif |
| Isolation données | ✅ Automatique | ⚠️ Manuelle |
| Visibilité utilisateur | ❌ Caché | ✅ Visible |
| Complexité | Simple | Moyenne |

**Conclusion:** AppDataFolder ne permet pas le partage entre comptes Google. Le dossier partagé est obligatoire pour notre cas d'usage.

### 8.6 Gestion des conflits et edge cases

| Scénario | Comportement | Justification |
|----------|--------------|---------------|
| Même transaction créée offline par 2 parents | Impossible (UUID unique) | Chaque appareil génère ses propres UUID |
| Modification concurrent d'un profil | Dernier timestamp gagne | Rare, impact faible |
| Archivage motif utilisé dans transaction | Motif reste visible pour cette transaction | Intégrité référentielle |
| Token expiré pendant sync | Demander reconnexion | UX simple |
| Backup corrompu (hash invalide) | Ignorer, prendre le précédent | Sécurité données |
| Espace Drive insuffisant | Alerte utilisateur | Pas de suppression auto |

---

## 9. UX/UI

### 9.1 Principes directeurs

1. **Mobile-first** : Conçu pour smartphones, fonctionne sur tablette/desktop
2. **Thumb-friendly** : Actions principales accessibles au pouce
3. **Minimal** : Pas de surcharge visuelle, focus sur l'essentiel
4. **Feedback immédiat** : Toute action a une réponse visuelle
5. **Lecture vs Édition** : Distinction claire entre modes

### 9.2 Écrans principaux

#### Dashboard (Home)

```
┌─────────────────────────────────────────┐
│ ☰  Argent de Poche          [👤 Mode]  │ ← TopBar
├─────────────────────────────────────────┤
│                                         │
│   ┌─────────────┐  ┌─────────────┐      │
│   │   ENORA     │  │   MARTIN    │      │ ← Cartes solde
│   │             │  │             │      │
│   │   45,50 €   │  │   32,00 €   │      │
│   │             │  │             │      │
│   └─────────────┘  └─────────────┘      │
│                                         │
│  Dernières transactions                 │
│  ─────────────────────────────────────  │
│                                         │
│  📥 Enora • Argent de poche   +5,00 €  │
│     Aujourd'hui 10:30                   │
│                                         │
│  📤 Martin • Achat bonbons    -2,50 €  │
│     Hier 15:45                          │
│                                         │
│  📥 Martin • Récompense       +3,00 €  │
│     12 jan                              │
│                                         │
│  [Voir tout →]                          │
│                                         │
│                               ┌─────┐   │
│                               │  +  │   │ ← FAB (Parent only)
│                               └─────┘   │
└─────────────────────────────────────────┘
```

**États:**
- **Mode PARENT** : FAB visible, cartes cliquables
- **Mode ENFANT** : Pas de FAB, une seule carte (SON profil)
- **Solde négatif** : Montant en rouge
- **Sync en cours** : Icône spinner dans TopBar

#### Ajout transaction

```
┌─────────────────────────────────────────┐
│ ←  Nouvelle transaction                 │
├─────────────────────────────────────────┤
│                                         │
│  Pour qui ?                             │
│  ┌──────────┐  ┌──────────┐             │
│  │  Enora   │  │  Martin  │             │ ← Chips toggle
│  │    ✓     │  │          │            │
│  └──────────┘  └──────────┘             │
│                                         │
│  Type                                   │
│  ┌──────────┐  ┌──────────┐             │
│  │  Entrée  │  │  Sortie  │             │
│  │    ✓     │  │          │            │
│  └──────────┘  └──────────┘             │
│                                         │
│  Montant *                              │
│  ┌─────────────────────────────────┐    │
│  │                               € │    │  ← Input number
│  └─────────────────────────────────┘    │
│                                         │
│  Motif *                                │
│  ┌─────────────────────────────────┐    │
│  │ Argent de poche               ▼ │    │  ← Select
│  └─────────────────────────────────┘    │
│                                         │
│  Note (optionnel)                       │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Date                                   │
│  ┌─────────────────────────────────┐    │
│  │ 17/01/2026 10:30             📅 │   │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │         ENREGISTRER             │    │ ← Button primary
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

#### Liste transactions (filtrable)

```
┌─────────────────────────────────────────┐
│ ←  Historique                    🔍    │
├─────────────────────────────────────────┤
│                                         │
│  Filtres                                │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ Tous   │ │ Enora  │ │ Martin │       │
│  └────────┘ └────────┘ └────────┘       │
│                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ Tous   │ │Entrées │ │Sorties │       │
│  └────────┘ └────────┘ └────────┘       │
│                                         │
│  Janvier 2026                           │
│  ─────────────────────────────────────  │
│                                         │
│  17 jan                                 │
│  ├─ 📥 Enora • Argent de poche +5,00 € │
│  │     10:30                            │
│  │                                      │
│  └─ 📤 Martin • Bonbons        -2,50 € │
│        09:15                            │
│                                         │
│  15 jan                                 │
│  └─ 📥 Martin • Récompense     +3,00 € │
│        14:00                            │
│        "Bonne note en maths"            │
│                                         │
│  ...                                    │
│                                         │
└─────────────────────────────────────────┘
```

#### Mode Enfant

```
┌─────────────────────────────────────────┐
│ 🔒 Argent de Poche          Enora 👤   │ ← TopBar + qui consulte
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │   ENORA     │  │   MARTIN    │      │ ← 2 soldes visibles
│  │   45,50 €   │  │   32,00 €   │      │
│  │   (Toi)     │  │             │      │
│  └─────────────┘  └─────────────┘      │
│                                         │
│  Dernières transactions                 │
│  ─────────────────────────────────────  │
│                                         │
│  📥 Enora • Argent de poche   +5,00 € │
│     Aujourd'hui                         │
│                                         │
│  📤 Martin • Secret      -25,00 € │ ← Motif secret !
│     Hier                                │
│                                         │
│  📤 Enora • Achat bonbons     -2,50 € │
│     Hier                                │
│                                         │
│  📥 Martin • Récompense       +3,00 € │
│     12 jan                              │
│                                         │
│  ─────────────────────────────────────  │
│  [🔓 Mode parent]                       │ ← Petit lien discret
│                                         │
└─────────────────────────────────────────┘
```

#### PIN Pad (Passage en mode Parent)

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│           Entrez le code PIN            │
│                                         │
│           ┌───┬───┬───┬───┐             │
│           │ • │ • │ ○ │ ○ │             │ ← Indicateurs
│           └───┴───┴───┴───┘             │
│                                         │
│           ┌───┬───┬───┐                 │
│           │ 1 │ 2 │ 3 │                 │
│           ├───┼───┼───┤                 │
│           │ 4 │ 5 │ 6 │                 │
│           ├───┼───┼───┤                 │ ← Clavier PIN
│           │ 7 │ 8 │ 9 │                 │
│           ├───┼───┼───┤                 │
│           │⌫ │ 0 │ ✓ │                │
│           └───┴───┴───┘                 │
│                                         │
│           [Annuler]                     │
│                                         │
└─────────────────────────────────────────┘
```

### 9.3 Composants UI

| Composant | Description | États |
|-----------|-------------|-------|
| `Button` | Bouton principal | primary, secondary, ghost, danger, disabled, loading |
| `Card` | Container avec ombre | default, interactive (hover), selected |
| `BalanceCard` | Carte solde enfant | positive (vert), negative (rouge), neutral |
| `TransactionCard` | Ligne transaction | entrée (vert), sortie (rouge), correction (orange) |
| `Input` | Champ texte | default, focus, error, disabled |
| `Select` | Dropdown | default, open, disabled |
| `Switch` | Toggle | on, off, disabled |
| `Chip` | Tag sélectionnable | default, selected, disabled |
| `Dialog` | Modal | default, fullscreen (mobile) |
| `Toast` | Notification | success, error, warning, info |
| `PinPad` | Clavier PIN | default, error (shake) |
| `FAB` | Bouton flottant | default, extended |

### 9.4 États vides et erreurs

#### État vide - Aucune transaction

```
┌─────────────────────────────────────────┐
│                                         │
│           ┌───────────────┐             │
│           │      📝       │             │
│           └───────────────┘             │
│                                         │
│       Aucune transaction                │
│                                         │
│    Ajoutez la première entrée ou        │
│    sortie d'argent pour commencer       │
│                                         │
│    ┌─────────────────────┐              │
│    │ + Ajouter           │              │
│    └─────────────────────┘              │
│                                         │
└─────────────────────────────────────────┘
```

#### Erreur - Sync échouée

```
┌─────────────────────────────────────────┐
│ ⚠️  Synchronisation échouée             │
│                                         │
│ Impossible de se connecter à Google     │
│ Drive. Vos données sont sauvegardées    │
│ localement.                             │
│                                         │
│ ┌──────────┐  ┌──────────────────┐      │
│ │ Ignorer  │  │ Réessayer        │      │
│ └──────────┘  └──────────────────┘      │
└─────────────────────────────────────────┘
```

#### Indicateur mode lecture seule (Enfant)

- Bandeau subtil en haut : `🔒 Mode consultation`
- Aucun bouton d'action visible
- FAB masqué
- Menu settings inaccessible

### 9.5 Thèmes

| Propriété | Light | Dark |
|-----------|-------|------|
| Background | `#ffffff` | `#0f172a` |
| Surface | `#f8fafc` | `#1e293b` |
| Primary | `#3b82f6` | `#60a5fa` |
| Text | `#1e293b` | `#f1f5f9` |
| Muted | `#64748b` | `#94a3b8` |
| Success (entrée) | `#22c55e` | `#4ade80` |
| Danger (sortie) | `#ef4444` | `#f87171` |
| Warning | `#f59e0b` | `#fbbf24` |

---

## 10. Edge cases

### 10.1 Tableau des edge cases

| # | Scénario | Comportement attendu | Priorité |
|---|----------|----------------------|----------|
| EC1 | Solde devient négatif après une sortie | Autoriser avec warning "Solde négatif", affichage rouge | Must |
| EC2 | Montant avec plus de 2 décimales saisi | Arrondir à 2 décimales (0.125 → 0.13) | Must |
| EC3 | Date future sélectionnée | Bloquer, afficher erreur "Date invalide" | Must |
| EC4 | Transaction créée pile à minuit | Utiliser timezone locale, pas UTC | Should |
| EC5 | Deux transactions au même instant exact | OK, ID différent, ordre d'insertion | Should |
| EC6 | Motif archivé utilisé dans ancienne transaction | Afficher le motif (lecture), masquer dans select (création) | Must |
| EC7 | Import JSON avec motif inconnu | Créer le motif automatiquement | Should |
| EC8 | Import JSON avec schemaVersion supérieur | Refuser avec message "Mettez à jour l'app" | Must |
| EC9 | Token Google expiré pendant backup | Tenter refresh, sinon demander reconnexion | Must |
| EC10 | Perte connexion pendant upload backup | Mettre en queue, retry auto au retour online | Must |
| EC11 | Backup distant corrompu (hash invalide) | Ignorer ce backup, alerter utilisateur | Must |
| EC12 | Deux parents modifient offline, sync | Merge par union des transactions (event-sourcing) | Must |
| EC13 | Parent A archive profil, Parent B crée transaction pour ce profil (offline) | Conserver transaction, désarchiver profil automatiquement | Should |
| EC14 | Stockage IndexedDB plein | Alerter utilisateur, suggérer export puis nettoyage | Should |
| EC15 | Utilisateur efface données navigateur | Données perdues sauf si backup Drive existe | Info |
| EC16 | PIN oublié | Pas de récupération (données locales), réinstaller et restore Drive | Info |
| EC17 | Enfant tente d'accéder URL directe /settings | Rediriger vers dashboard enfant | Must |
| EC18 | Session parent expire pendant saisie | Sauvegarder en draft localStorage, demander PIN | Should |
| EC19 | App ouverte dans 2 onglets simultanément | Un seul onglet actif pour les writes (Dexie géré) | Should |
| EC20 | Très grand nombre de transactions (>10000) | Pagination, virtualisation liste | Could |
| EC21 | Motif secret pour tous les profils | Transaction affichée "Secret" pour tous sauf parents | Must |
| EC22 | Correction d'une transaction avec motif secret | La contre-écriture hérite du même hiddenForUsers | Must |
| EC23 | Parent A marque secret pour Parent B | OK, Parent B voit "Secret" (surprise entre parents) | Should |
| EC24 | Export JSON avec motifs secrets | Exporter hiddenForUsers normalement, le secret n'est pas dans l'export visible | Must |
| EC25 | Changement de user en mode enfant | Rafraîchir l'affichage pour montrer/cacher les bons motifs | Must |

### 10.2 Détail des comportements critiques

#### EC12 - Merge conflits offline

```
Scénario détaillé:
─────────────────
T0: État initial
    - Enora: 40€ (transactions T1-T10)
    - Martin: 30€ (transactions T11-T20)

T1: Parent A offline
    - Ajoute T21: Enora +5€ (argent de poche)
    - État local A: Enora 45€

T2: Parent B offline (en même temps)
    - Ajoute T22: Martin -3€ (bonbons)
    - État local B: Martin 27€

T3: Parent A revient online
    - Upload backup avec T1-T21
    - Drive contient: T1-T21

T4: Parent B revient online
    - Détecte backup distant plus récent
    - Télécharge T1-T21
    - Merge: T1-T22 (union)
    - Upload backup fusionné
    - État final: Enora 45€, Martin 27€

Résultat: AUCUNE PERTE DE DONNÉES
```

#### EC17 - Protection routes mode enfant

```typescript
// Middleware de route (TanStack Router)
const protectedRoutes = ['/settings', '/transactions/new', '/profiles/edit'];

function beforeLoad({ location }) {
  const { currentMode } = useAuth();

  if (currentMode === 'ENFANT' && protectedRoutes.some(r => location.pathname.startsWith(r))) {
    throw redirect({ to: '/' });
  }
}
```

---

## 11. Plan de tests

### 11.1 Stratégie de tests

| Type | Couverture cible | Outils | Responsabilité |
|------|------------------|--------|----------------|
| **Unit tests** | 80% des fonctions utilitaires | Vitest | Dev |
| **Integration tests** | Repositories + Services | Vitest + fake-indexeddb | Dev |
| **Component tests** | Composants critiques | Vitest + Testing Library | Dev |
| **E2E tests** | Parcours utilisateurs principaux | Playwright | Dev/QA |
| **Manual tests** | Edge cases, UX, multi-appareils | Checklist | QA |

### 11.2 Tests unitaires

#### Fonctions à tester

| Module | Fonction | Cas de test |
|--------|----------|-------------|
| `lib/crypto.ts` | `hashPin(pin, salt)` | PIN valide, PIN vide, salt différent |
| `lib/crypto.ts` | `verifyPin(pin, hash, salt)` | Correct, incorrect, hash invalide |
| `lib/utils.ts` | `formatCurrency(amount)` | Positif, négatif, zéro, décimales |
| `lib/utils.ts` | `formatDate(timestamp)` | Aujourd'hui, hier, date ancienne |
| `lib/validators.ts` | `validateAmount(value)` | Valide, négatif, trop de décimales, NaN |
| `lib/validators.ts` | `validateFutureDate(date)` | Passé OK, futur KO, maintenant OK |
| `services/sync/` | `mergeTransactions(a, b)` | Disjoints, identiques, partiellement communs |
| `services/export/` | `generateChecksum(data)` | Déterministe, différent si données différentes |

```typescript
// Exemple: lib/validators.test.ts
import { describe, it, expect } from 'vitest';
import { validateAmount } from './validators';

describe('validateAmount', () => {
  it('accepts positive amounts with 2 decimals', () => {
    expect(validateAmount(10.50)).toEqual({ valid: true });
    expect(validateAmount(0.01)).toEqual({ valid: true });
  });

  it('rejects negative amounts', () => {
    expect(validateAmount(-5)).toEqual({
      valid: false,
      error: 'Le montant doit être positif'
    });
  });

  it('rejects more than 2 decimals', () => {
    expect(validateAmount(10.555)).toEqual({
      valid: false,
      error: 'Maximum 2 décimales'
    });
  });

  it('rejects zero', () => {
    expect(validateAmount(0)).toEqual({
      valid: false,
      error: 'Le montant doit être supérieur à 0'
    });
  });
});
```

### 11.3 Tests d'intégration

#### Repositories

| Repository | Tests |
|------------|-------|
| `TransactionRepository` | create, getByProfile, getAll, calculateBalance |
| `ProfileRepository` | create, update, archive, getActive |
| `MotifRepository` | create, archive, getActive, isUsed |
| `SettingsRepository` | get, update, setPinHash |

```typescript
// Exemple: TransactionRepository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../db';
import { TransactionRepository } from './TransactionRepository';

describe('TransactionRepository', () => {
  beforeEach(async () => {
    await db.transactions.clear();
    await db.profiles.clear();
    // Seed test data
    await db.profiles.add({ id: 'p1', name: 'Enora', order: 0, createdAt: Date.now() });
  });

  it('creates transaction and updates balance', async () => {
    const tx = await TransactionRepository.create({
      profileId: 'p1',
      type: 'ENTREE',
      amount: 10,
      motifId: 'm1',
      date: Date.now(),
    });

    expect(tx.id).toBeDefined();

    const balance = await TransactionRepository.calculateBalance('p1');
    expect(balance).toBe(10);
  });

  it('calculates balance with mixed transactions', async () => {
    await TransactionRepository.create({
      profileId: 'p1', type: 'ENTREE', amount: 50, motifId: 'm1', date: Date.now()
    });
    await TransactionRepository.create({
      profileId: 'p1', type: 'SORTIE', amount: 15, motifId: 'm2', date: Date.now()
    });

    const balance = await TransactionRepository.calculateBalance('p1');
    expect(balance).toBe(35);
  });
});
```

#### Services backup

| Service | Tests |
|---------|-------|
| `BackupManager` | createBackup, restoreBackup, validateBackup |
| `SyncService` | mergeData, detectConflicts, resolveConflicts |
| `JsonExporter` | export format, checksum validity |
| `JsonImporter` | validate schema, merge mode, replace mode |

### 11.4 Tests de composants

| Composant | Tests |
|-----------|-------|
| `PinPad` | Saisie 4 chiffres, effacement, soumission, erreur shake |
| `TransactionForm` | Validation, soumission, champs requis |
| `BalanceCard` | Affichage positif/négatif, formatage |
| `ModeSwitch` | Bascule, demande PIN si vers parent |

```typescript
// Exemple: PinPad.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PinPad } from './PinPad';

describe('PinPad', () => {
  it('calls onSubmit when 4 digits entered', async () => {
    const onSubmit = vi.fn();
    render(<PinPad onSubmit={onSubmit} />);

    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('✓'));

    expect(onSubmit).toHaveBeenCalledWith('1234');
  });

  it('shows error state on wrong PIN', () => {
    render(<PinPad onSubmit={() => {}} error="Code incorrect" />);

    expect(screen.getByText('Code incorrect')).toBeInTheDocument();
  });
});
```

### 11.5 Tests E2E (Playwright)

#### Parcours critiques

| # | Parcours | Étapes |
|---|----------|--------|
| E2E-1 | Ajout transaction parent | Ouvrir app → PIN → Dashboard → FAB → Formulaire → Enregistrer → Vérifier solde |
| E2E-2 | Consultation enfant | Ouvrir app → Mode enfant → Sélection profil → Voir solde → Voir historique |
| E2E-3 | Correction transaction | PIN → Historique → Sélectionner → Corriger → Contre-écriture → Vérifier solde |
| E2E-4 | Export/Import JSON | Settings → Export → Télécharger → Clear données → Import → Vérifier données |
| E2E-5 | Connexion Google Drive | Settings → Backup → Connecter Google → OAuth popup → Vérifier connexion |
| E2E-6 | Backup et restore | Créer transactions → Backup manuel → Clear → Restore → Vérifier données |

```typescript
// Exemple: e2e/add-transaction.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Add transaction flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Bypass PIN for test (or enter test PIN)
    await page.evaluate(() => {
      localStorage.setItem('test_mode', 'parent');
    });
    await page.reload();
  });

  test('parent can add income transaction', async ({ page }) => {
    // Click FAB
    await page.click('[data-testid="fab-add"]');

    // Fill form
    await page.click('[data-testid="profile-enora"]');
    await page.click('[data-testid="type-entree"]');
    await page.fill('[data-testid="amount-input"]', '10.50');
    await page.selectOption('[data-testid="motif-select"]', 'Argent de poche');

    // Submit
    await page.click('[data-testid="submit-button"]');

    // Verify
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="balance-enora"]')).toContainText('10,50');
  });
});
```

### 11.6 Tests spécifiques

#### Tests import/export

| Test | Description | Attendu |
|------|-------------|---------|
| IMP-1 | Import fichier valide v1 | Données importées correctement |
| IMP-2 | Import fichier schemaVersion > actuel | Erreur "Version non supportée" |
| IMP-3 | Import fichier corrompu (JSON invalide) | Erreur "Format invalide" |
| IMP-4 | Import fichier checksum invalide | Warning mais import possible |
| IMP-5 | Import merge avec doublons | Doublons ignorés, nouvelles données ajoutées |
| IMP-6 | Import replace | Toutes données remplacées |
| EXP-1 | Export génère fichier valide | JSON parseable, checksum correct |
| EXP-2 | Export n'inclut pas le PIN | Champs sensibles absents |

#### Tests sync multi-appareils

| Test | Description | Attendu |
|------|-------------|---------|
| SYNC-1 | Sync initial (appareil vide) | Pull complet depuis Drive |
| SYNC-2 | Sync après modification locale | Push vers Drive |
| SYNC-3 | Sync avec conflit (modifs concurrentes) | Merge automatique |
| SYNC-4 | Sync offline puis online | Queue vidée, données sync |
| SYNC-5 | Token expiré pendant sync | Demande reconnexion |
| SYNC-6 | Backup corrompu sur Drive | Ignoré, alerte utilisateur |

#### Tests RBAC

| Test | Description | Attendu |
|------|-------------|---------|
| RBAC-1 | Enfant ne voit pas FAB | FAB masqué |
| RBAC-2 | Enfant ne peut pas accéder /settings | Redirect vers home |
| RBAC-3 | Enfant ne voit que son profil | Autres profils masqués |
| RBAC-4 | Parent voit tous les profils | Tous affichés |
| RBAC-5 | Session parent expire | Retour mode enfant auto |
| RBAC-6 | PIN incorrect 3 fois | Timeout 30s |

### 11.7 Matrice de couverture

| Fonctionnalité | Unit | Integ | E2E | Manual |
|----------------|------|-------|-----|--------|
| Ajout transaction | ✅ | ✅ | ✅ | ✅ |
| Correction transaction | ✅ | ✅ | ✅ | ✅ |
| Calcul solde | ✅ | ✅ | ✅ | - |
| Gestion motifs | ✅ | ✅ | - | ✅ |
| Export JSON | ✅ | ✅ | ✅ | ✅ |
| Import JSON | ✅ | ✅ | ✅ | ✅ |
| Google OAuth | - | - | ✅ | ✅ |
| Backup Drive | - | ✅ | ✅ | ✅ |
| Restore Drive | - | ✅ | ✅ | ✅ |
| Sync multi-appareils | - | ✅ | - | ✅ |
| Mode enfant | ✅ | ✅ | ✅ | ✅ |
| PIN parent | ✅ | ✅ | ✅ | ✅ |
| Offline mode | - | ✅ | - | ✅ |

---

## 12. Plan de livraison

### 12.1 Jalons

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ROADMAP PROJET                                  │
└─────────────────────────────────────────────────────────────────────────┘

                    MVP                          V1
     ┌──────────────────────────┐    ┌──────────────────────┐
     │                          │    │                      │
─────┼──────────┬──────────┬────┼────┼──────────┬───────────┼────────────►
     │          │          │    │    │          │           │
   Sprint 1  Sprint 2  Sprint 3 │  Sprint 4  Sprint 5   Sprint 6
     │          │          │    │    │          │           │
   Setup &   Transac-  Backup   │  Google    Sync      Stats &
   Core UI   tions &   Export   │  Drive     Multi     Polish
             Profils   Import   │  Basic     Appareils

```

### 12.2 Détail des sprints

#### Sprint 1 : Setup & Core UI (Fondations)

| Tâche | Priorité | Effort |
|-------|----------|--------|
| Setup projet (Vite, React, TypeScript, Tailwind) | Must | S |
| Configuration Dexie + schéma DB v1 | Must | M |
| Composants UI de base (Button, Card, Input, Dialog) | Must | M |
| Layout AppShell + TopBar + navigation | Must | M |
| Context Auth (mode PARENT/ENFANT) | Must | M |
| PinPad component + hash/verify | Must | M |
| Dashboard squelette (cartes solde vides) | Must | S |
| Initialisation données (profils, motifs par défaut) | Must | S |

**Livrable:** App installable, navigation, bascule modes, PIN fonctionnel

#### Sprint 2 : Transactions & Profils

| Tâche | Priorité | Effort |
|-------|----------|--------|
| TransactionRepository (CRUD) | Must | M |
| TransactionForm (ajout) | Must | L |
| Calcul solde dynamique | Must | S |
| BalanceCard avec solde réel | Must | S |
| Liste transactions avec filtres | Must | L |
| Détail transaction | Must | M |
| Correction via contre-écriture | Must | M |
| Gestion motifs (ajout) | Should | M |

**Livrable:** MVP fonctionnel local (sans backup)

#### Sprint 3 : Backup Export/Import

| Tâche | Priorité | Effort |
|-------|----------|--------|
| JsonExporter (format versionné) | Must | M |
| JsonImporter (validation, merge, replace) | Must | L |
| UI Export (bouton, téléchargement) | Must | S |
| UI Import (upload, preview, confirmation) | Must | M |
| Tests import/export | Must | M |
| PWA config (manifest, service worker) | Must | M |
| Offline indicators | Should | S |

**Livrable:** MVP complet avec backup local

#### Sprint 4 : Google Drive Basic

| Tâche | Priorité | Effort |
|-------|----------|--------|
| GoogleAuthService (OAuth) | Must | L |
| GoogleDriveService (API v3) | Must | L |
| BackupManager (upload/download) | Must | M |
| UI connexion Google | Must | M |
| Backup manuel vers Drive | Must | M |
| Liste backups + restore | Must | M |
| Tests backup Drive | Must | M |

**Livrable:** Backup Google Drive fonctionnel (mono-utilisateur)

#### Sprint 5 : Sync Multi-Appareils

| Tâche | Priorité | Effort |
|-------|----------|--------|
| Détection dossier partagé | Must | M |
| SyncService (merge) | Must | L |
| Backup automatique (debounce) | Must | M |
| Queue offline | Must | M |
| Gestion conflits | Must | L |
| UI indicateurs sync | Must | S |
| Tests sync multi-appareils | Must | L |

**Livrable:** Sync entre 2 parents opérationnelle

#### Sprint 6 : Stats & Polish (V1)

| Tâche | Priorité | Effort |
|-------|----------|--------|
| Mini stats (dépenses par motif 30j) | Should | M |
| Ajout/renommer/archiver motifs | Should | M |
| Duplication transaction | Should | S |
| Archivage profil | Could | M |
| Chiffrement backup (optionnel) | Could | L |
| Optimisations perf | Should | M |
| Tests E2E complets | Must | L |
| Documentation utilisateur | Should | M |
| Bug fixes & polish | Must | L |

**Livrable:** V1 complète

### 12.3 Critères de sortie par jalon

#### MVP (fin Sprint 3)

- [ ] 2 profils enfants avec solde calculé
- [ ] Ajout/consultation transactions
- [ ] Correction par contre-écriture
- [ ] Mode PARENT (PIN) et ENFANT (lecture seule)
- [ ] Export/Import JSON fonctionnel
- [ ] PWA installable et fonctionnelle offline
- [ ] Tests unitaires et intégration > 70% couverture

#### V1 (fin Sprint 6)

- [ ] Tous critères MVP
- [ ] Backup/restore Google Drive
- [ ] Sync entre 2 comptes parents
- [ ] Gestion conflits offline automatique
- [ ] Stats basiques
- [ ] Tests E2E passants
- [ ] Performance < 3s TTI

### 12.4 Dépendances externes

| Dépendance | Impact | Mitigation |
|------------|--------|------------|
| Google Cloud Console (OAuth credentials) | Bloquant pour Sprint 4 | Créer projet GCP dès Sprint 1 |
| Compte Google test | Bloquant pour tests Drive | Créer comptes dédiés |
| Hébergement (GitHub Pages ou autre) | Bloquant pour E2E | Configurer dès Sprint 1 |

---

## 13. Risques et mitigations

### 13.1 Matrice des risques

| # | Risque | Probabilité | Impact | Score | Mitigation |
|---|--------|-------------|--------|-------|------------|
| R1 | Perte de données (bug sync) | Moyenne | Critique | 🔴 | Event-sourcing, backups multiples, tests exhaustifs |
| R2 | Conflits de merge non résolus | Moyenne | Élevé | 🟠 | Algorithme merge déterministe, logs détaillés |
| R3 | Token Google expiré non détecté | Faible | Moyen | 🟡 | Check expiration avant chaque opération, refresh auto |
| R4 | Espace IndexedDB insuffisant | Faible | Moyen | 🟡 | Monitoring usage, alerte utilisateur, export avant clean |
| R5 | PIN oublié | Moyenne | Moyen | 🟡 | Documentation claire sur restore Drive, pas de recovery local |
| R6 | Enfant contourne mode lecture | Faible | Faible | 🟢 | Protection routes + UI, pas de données sensibles |
| R7 | Google change API Drive | Faible | Élevé | 🟠 | Utiliser SDK officiel, surveiller changelog |
| R8 | Safari iOS bugs PWA | Moyenne | Moyen | 🟡 | Tests réguliers iOS, fallbacks, documentation limites |
| R9 | Performance avec beaucoup de transactions | Faible | Moyen | 🟡 | Index Dexie optimisés, pagination, virtualisation |
| R10 | RGPD non-compliance | Faible | Élevé | 🟠 | Données locales uniquement, pas de tracking, consent Drive |

### 13.2 Plans de mitigation détaillés

#### R1 - Perte de données

```
PRÉVENTION:
├── Event-sourcing: transactions immuables, jamais de delete
├── Multi-backup: local (IndexedDB) + Drive + export JSON
├── Checksum: validation intégrité avant restore
└── Tests: couverture exhaustive des scénarios de sync

DÉTECTION:
├── Vérification solde = somme transactions au démarrage
├── Logs détaillés des opérations sync
└── Alertes si incohérence détectée

RECOVERY:
├── Restore depuis dernier backup Drive valide
├── Import JSON si backup Drive corrompu
└── Support manuel si tout échoue (contact dev)
```

#### R2 - Conflits de merge

```
STRATÉGIE:
├── Transactions: UNION par ID (jamais de conflit)
├── Profils: timestamp le plus récent gagne
├── Motifs: timestamp le plus récent gagne
└── Settings: non synchronisés (local uniquement)

EDGE CASES:
├── Même ID créé sur 2 appareils: IMPOSSIBLE (UUID v4)
├── Archivage concurrent: le plus récent gagne
└── Création motif même nom: 2 motifs distincts (IDs différents)
```

#### R8 - Safari iOS PWA

```
LIMITES CONNUES:
├── Pas de notification push (OK, pas utilisé)
├── Storage limité à 50MB (OK, suffisant)
├── Pas de background sync (OK, sync manuelle)
└── OAuth popup peut buguer: fallback redirect

TESTS REQUIS:
├── Test installation PWA sur iOS
├── Test offline après kill app
├── Test OAuth flow complet
└── Test restauration après reboot device
```

### 13.3 Critères d'escalade

| Niveau | Critère | Action |
|--------|---------|--------|
| 🟢 Normal | Risque sous contrôle | Monitoring continu |
| 🟡 Attention | Risque se matérialise partiellement | Review hebdomadaire, plan mitigation actif |
| 🟠 Alerte | Impact utilisateur | Sprint dédié à la correction |
| 🔴 Critique | Perte de données confirmée | Stop développement, hotfix immédiat |

---

## 14. Questions ouvertes et hypothèses

### 14.1 Hypothèses

| # | Hypothèse | Impact si fausse | Validation | Réponse |
|---|-----------|------------------|------------|---------|
| H1 | Les enfants ont 9-12 ans | UI trop complexe ou trop simple | Confirmer âges exacts | âges ok|
| H2 | Maximum ~100 transactions/an/enfant | Perf OK sans optimisation | Estimer volume réel | Maximum ~100 transactions/an/enfant |
| H3 | Les 2 parents ont un compte Google | Sync impossible sinon | Confirmer | oui |
| H4 | Pas de 3ème enfant prévu à court terme | MVP OK avec 2 profils fixes | Confirmer | pas de 3ème enfant (certain) |
| H5 | Utilisation smartphone principalement | Desktop secondaire | Confirmer devices | smartphone |
| H6 | Pas de besoin de multi-devises | EUR uniquement | Confirmer | euro uniquement |
| H7 | Les enfants n'ont pas de compte Google | Accès via PIN/mode enfant | Confirmer | Les enfants ont un compte Google enfant administré par les parents |
| H8 | Backup quotidien suffisant (pas temps réel) | Perte max 1 jour acceptable | Confirmer | Temps réel préféré si possible |

### 14.2 Questions ouvertes

#### Q1 : Authentification enfants - quelle approche ?

**Options:**

| Option | Description | Avantages | Inconvénients |
|--------|-------------|-----------|---------------|
| **A) PIN partagé** | Un seul PIN parent, mode enfant sans auth | Simple | Pas de distinction entre enfants |
| **B) PIN par enfant** | Chaque enfant a son PIN | Personnalisé | Plus de PINs à retenir |
| **C) Sélection profil** | Mode enfant demande "Qui es-tu ?" | Simple, pas de PIN enfant | Pas de vraie auth |

**Recommandation:** Option C (sélection profil) - Simple, adapté aux enfants, pas de PIN à oublier.

#### Q2 : Partage Google Drive - quelle méthode ?

**Options:**

| Option | Description | Avantages | Inconvénients |
|--------|-------------|-----------|---------------|
| **A) Dossier partagé manuel** | Parent A partage dossier avec Parent B | Simple, standard | Setup manuel une fois |
| **B) Invitation in-app** | App génère lien d'invitation | UX fluide | Complexité dev |
| **C) Shared Drive** | Google Workspace Shared Drive | Natif | Nécessite Workspace payant |

**Recommandation:** Option A (dossier partagé manuel) - Standard, gratuit, fiable.

#### Q3 : Correction de transaction - édition ou contre-écriture ?

**Analyse:**

| Critère | Édition directe | Contre-écriture |
|---------|-----------------|-----------------|
| Simplicité UX | ✅ Plus simple | ⚠️ Une action de plus |
| Audit trail | ❌ Historique perdu | ✅ Traçabilité complète |
| Intégrité données | ⚠️ Risque incohérence | ✅ Garantie |
| Event-sourcing | ❌ Incompatible | ✅ Natif |
| Sync conflicts | ⚠️ Complexe | ✅ Simple (union) |

**Recommandation:** Contre-écriture - Cohérent avec event-sourcing, sync robuste, auditabilité.

#### Q4 : Chiffrement des backups - nécessaire ?

**Analyse:**

| Pour | Contre |
|------|--------|
| Sécurité données enfants | Complexité (gestion clé) |
| Confidentialité vis-à-vis de Google | Données = prénoms + montants (peu sensible) |
| Best practice | Mot de passe oublié = données perdues |

**Recommandation:** V1 sans chiffrement, V2 optionnel avec warning clair sur les risques.

#### Q5 : Fréquence backup automatique ?

**Options:**
- Après chaque transaction (temps réel)
- Debounce 30 secondes après modifications
- Toutes les 5 minutes si dirty
- Manuel uniquement

**Recommandation:** Debounce 30s - Bon compromis entre fraîcheur et performance/quota.

### 14.3 Décisions à prendre

| # | Décision | Options | Owner | Deadline |
|---|----------|---------|-------|----------|
| D1 | ~~Confirmer âges des enfants~~ | ~~9-12 ans ?~~ | ~~Product Owner~~ | ✅ Confirmé |
| D2 | ~~Valider auth enfants~~ | ~~A/B/C~~ | ~~Product Owner~~ | ✅ Option C retenue |
| D3 | ~~Confirmer devices cibles~~ | ~~Smartphones ? Tablettes ?~~ | ~~Product Owner~~ | ✅ Smartphones |
| D4 | Valider scope MVP vs V1 | Liste features | Product Owner | Avant Sprint 1 |
| D5 | Choisir hébergement | GitHub Pages / Vercel / autre | Tech Lead | Avant Sprint 1 |
| D6 | Créer projet Google Cloud | OAuth credentials | Tech Lead | Avant Sprint 3 |

### 14.4 Décisions confirmées

Les éléments suivants ont été confirmés par le Product Owner :

| # | Décision | Choix retenu |
|---|----------|--------------|
| DC1 | Noms des parents | Camille (papa) et Emeline (maman) |
| DC2 | Visibilité enfants | Les enfants voient les 2 profils (soldes + historiques) |
| DC3 | Motif secret | Fonctionnalité ajoutée - permet de masquer le motif pour certains utilisateurs |
| DC4 | Utilisateurs cibles | 4 membres : Camille, Emeline, Enora, Martin |
| DC5 | Âges des enfants | Confirmé ~9-12 ans |
| DC6 | Pas de 3ème enfant | Confirmé, 2 profils fixes suffisent |
| DC7 | Multi-devises | Non, EUR uniquement |
| DC8 | Comptes Google enfants | Oui, comptes supervisés par les parents |
| DC9 | Fréquence backup | Temps réel préféré (debounce 30s conservé) |

---

## Annexes

### A. Glossaire

| Terme | Définition |
|-------|------------|
| **Contre-écriture** | Nouvelle transaction qui annule ou ajuste une transaction précédente |
| **Dirty flag** | Indicateur que des modifications locales ne sont pas encore synchronisées |
| **Event-sourcing** | Pattern où l'état est calculé à partir d'événements immuables |
| **hiddenForUsers** | Liste d'IDs utilisateurs pour lesquels le motif d'une transaction est masqué |
| **IndexedDB** | API de stockage navigateur pour données structurées |
| **Motif secret** | Transaction dont le motif est remplacé par "Secret" pour certains utilisateurs |
| **Profile** | Compte d'argent d'un enfant (solde = somme des transactions) |
| **PWA** | Progressive Web App - Application web installable |
| **Soft delete** | Marquer comme supprimé sans effacer physiquement |
| **User** | Membre de la famille utilisant l'app (parent ou enfant) |

### B. Références

- [Dexie.js Documentation](https://dexie.org/docs/)
- [Google Drive API v3](https://developers.google.com/drive/api/v3/reference)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [TanStack Router](https://tanstack.com/router)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### C. Changelog PRD

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0 | 17/01/2026 | Claude | Création initiale |
| 1.1 | 17/01/2026 | Claude | Mise à jour avec infos confirmées : noms parents (Camille, Emeline), visibilité enfants sur tous profils, ajout fonctionnalité "Motif secret", nouvelle table `users`, champ `hiddenForUsers` sur transactions |

---

**Fin du document**
