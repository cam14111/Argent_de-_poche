# Sprint 5 : Sync Multi-Appareils

## Objectif
Permettre la synchronisation des données entre les appareils des deux parents.

## Livrable
Sync entre 2 parents opérationnelle

---

## User Stories

### US-5.1 : Détection du dossier partagé
**Priorité:** Must | **Effort:** M

**En tant que** parent,
**Je veux** que l'app détecte si je suis le premier utilisateur ou si je rejoins un dossier existant,
**Afin de** configurer correctement la synchronisation.

**Critères d'acceptation:**
- [ ] Détection de l'existence du dossier "ArgentDePoche" sur Drive
- [ ] Cas "nouveau": création du dossier
- [ ] Cas "existant": proposition de rejoindre
- [ ] Configuration du mode sync (owner/member)
- [ ] Interface de setup guidée

---

### US-5.2 : Service de synchronisation
**Priorité:** Must | **Effort:** L

**En tant que** développeur,
**Je veux** un service de synchronisation avec merge intelligent,
**Afin de** fusionner les données de plusieurs appareils.

**Critères d'acceptation:**
- [ ] SyncService créé
- [ ] Stratégie merge:
  - Transactions: UNION par ID (pas de conflit possible)
  - Profils: timestamp le plus récent gagne
  - Motifs: timestamp le plus récent gagne
- [ ] Détection des modifications locales (dirty flag)
- [ ] Comparaison avec backup distant
- [ ] Tests unitaires exhaustifs

---

### US-5.3 : Backup automatique
**Priorité:** Must | **Effort:** M

**En tant que** parent,
**Je veux** que mes modifications soient sauvegardées automatiquement,
**Afin de** ne pas perdre de données.

**Critères d'acceptation:**
- [ ] Debounce de 30 secondes après modification
- [ ] Backup automatique si dirty flag actif
- [ ] Pas de backup si aucune modification
- [ ] Indicateur de synchronisation en cours
- [ ] Configuration on/off dans les paramètres

---

### US-5.4 : Queue offline
**Priorité:** Must | **Effort:** M

**En tant que** parent,
**Je veux** que mes modifications offline soient synchronisées dès que possible,
**Afin de** ne pas perdre de données en mode déconnecté.

**Critères d'acceptation:**
- [ ] Queue des opérations en attente
- [ ] Persistance de la queue (IndexedDB)
- [ ] Exécution automatique au retour online
- [ ] Indicateur du nombre d'opérations en attente
- [ ] Gestion des erreurs avec retry

---

### US-5.5 : Gestion des conflits
**Priorité:** Must | **Effort:** L

**En tant que** parent,
**Je veux** que les conflits de synchronisation soient résolus automatiquement,
**Afin de** ne pas avoir à gérer manuellement les incohérences.

**Critères d'acceptation:**
- [ ] Algorithme de merge déterministe
- [ ] Logs détaillés des résolutions de conflits
- [ ] Aucune perte de transaction (union)
- [ ] Notification si merge effectué
- [ ] Tests avec scénarios de conflits

---

### US-5.6 : Indicateurs de synchronisation
**Priorité:** Must | **Effort:** S

**En tant qu'** utilisateur,
**Je veux** voir l'état de synchronisation de l'app,
**Afin de** savoir si mes données sont à jour.

**Critères d'acceptation:**
- [ ] Icône de statut sync (synced, syncing, pending, error)
- [ ] Date de dernière synchronisation
- [ ] Nombre d'éléments en attente
- [ ] Bouton sync manuelle
- [ ] Détail des erreurs si applicable

---

### US-5.7 : Tests sync multi-appareils
**Priorité:** Must | **Effort:** L

**En tant que** développeur,
**Je veux** des tests complets pour la synchronisation,
**Afin de** garantir la fiabilité du système.

**Critères d'acceptation:**
- [ ] Tests unitaires SyncService
- [ ] Tests merge: différents scénarios
- [ ] Tests conflits: même donnée modifiée
- [ ] Tests offline: queue et replay
- [ ] Tests E2E: simulation 2 appareils
- [ ] Tests de performance (beaucoup de transactions)

---

## Scénarios de test clés

### Scénario 1: Premier utilisateur
1. Parent A installe l'app
2. Se connecte à Google
3. Crée le dossier ArgentDePoche
4. Ajoute des transactions
5. Backup automatique fonctionne

### Scénario 2: Second utilisateur rejoint
1. Parent B installe l'app
2. Se connecte à Google
3. Détecte le dossier partagé (via Drive partagé par A)
4. Télécharge les données existantes
5. Peut ajouter des transactions

### Scénario 3: Modifications simultanées
1. Parent A ajoute transaction T1 offline
2. Parent B ajoute transaction T2 offline
3. Les deux se reconnectent
4. Merge: T1 + T2 présentes sur les deux appareils

---

## Définition of Done (Sprint)

- [ ] Toutes les US Must marquées comme terminées
- [ ] Sync fonctionnelle entre 2 appareils testée
- [ ] Tests passants (>70% couverture)
- [ ] Code review effectuée
- [ ] Documentation technique à jour
