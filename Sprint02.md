# Sprint 2 : Transactions & Profils

## Objectif
Implémenter la gestion complète des transactions et le calcul des soldes.

## Livrable
MVP fonctionnel local (sans backup)

---

## User Stories

### US-2.1 : Repository Transactions
**Priorité:** Must | **Effort:** M

**En tant que** développeur,
**Je veux** un repository pour gérer les transactions (CRUD),
**Afin de** pouvoir créer, lire, mettre à jour et supprimer des transactions.

**Critères d'acceptation:**
- [ ] TransactionRepository créé
- [ ] Méthodes: create, getById, getByProfile, getAll
- [ ] Soft delete implémenté (jamais de suppression physique)
- [ ] Tests unitaires complets

---

### US-2.2 : Formulaire d'ajout de transaction
**Priorité:** Must | **Effort:** L

**En tant que** parent,
**Je veux** pouvoir ajouter une transaction pour un enfant,
**Afin d'** enregistrer un crédit ou un débit sur son compte.

**Critères d'acceptation:**
- [ ] Formulaire avec sélection du profil enfant
- [ ] Champ montant (positif ou négatif)
- [ ] Sélection du motif (liste déroulante)
- [ ] Champ description optionnel
- [ ] Option "Motif secret" (hiddenForUsers)
- [ ] Validation des champs
- [ ] Feedback de succès après création

---

### US-2.3 : Calcul du solde dynamique
**Priorité:** Must | **Effort:** S

**En tant que** développeur,
**Je veux** que le solde soit calculé dynamiquement à partir des transactions,
**Afin de** garantir la cohérence des données (event-sourcing).

**Critères d'acceptation:**
- [ ] Fonction de calcul du solde par profil
- [ ] Prise en compte uniquement des transactions non supprimées
- [ ] Performance optimisée (index Dexie)
- [ ] Tests unitaires avec différents scénarios

---

### US-2.4 : Carte de solde avec données réelles
**Priorité:** Must | **Effort:** S

**En tant qu'** utilisateur,
**Je veux** voir le solde réel de chaque enfant sur le dashboard,
**Afin de** connaître l'état actuel de leur argent de poche.

**Critères d'acceptation:**
- [ ] BalanceCard affiche le solde calculé
- [ ] Formatage en euros (€)
- [ ] Couleur différente si solde négatif
- [ ] Mise à jour en temps réel après transaction

---

### US-2.5 : Liste des transactions avec filtres
**Priorité:** Must | **Effort:** L

**En tant qu'** utilisateur,
**Je veux** voir la liste des transactions d'un enfant avec des filtres,
**Afin de** consulter l'historique des mouvements.

**Critères d'acceptation:**
- [ ] Liste des transactions par profil
- [ ] Filtre par période (mois, tous)
- [ ] Filtre par type (crédit, débit, tous)
- [ ] Tri par date (plus récent en premier)
- [ ] Affichage du motif (ou "Secret" si masqué)
- [ ] Pagination ou scroll infini

---

### US-2.6 : Détail d'une transaction
**Priorité:** Must | **Effort:** M

**En tant qu'** utilisateur,
**Je veux** voir le détail complet d'une transaction,
**Afin de** connaître toutes les informations associées.

**Critères d'acceptation:**
- [ ] Page ou modal de détail
- [ ] Affichage: date, montant, motif, description, créateur
- [ ] Indication si transaction corrigée/annulée
- [ ] Lien vers la contre-écriture si applicable

---

### US-2.7 : Correction par contre-écriture
**Priorité:** Must | **Effort:** M

**En tant que** parent,
**Je veux** pouvoir corriger une transaction par contre-écriture,
**Afin de** rectifier une erreur tout en conservant l'historique.

**Critères d'acceptation:**
- [ ] Bouton "Corriger" sur une transaction (mode parent uniquement)
- [ ] Création automatique d'une contre-écriture
- [ ] Lien entre transaction originale et correction
- [ ] Option d'annulation complète (montant inverse)
- [ ] Option de correction partielle (nouveau montant)

---

### US-2.8 : Gestion des motifs
**Priorité:** Should | **Effort:** M

**En tant que** parent,
**Je veux** pouvoir ajouter de nouveaux motifs,
**Afin de** personnaliser les catégories de transactions.

**Critères d'acceptation:**
- [ ] Page de gestion des motifs
- [ ] Ajout d'un nouveau motif
- [ ] Liste des motifs existants
- [ ] Motifs par défaut non supprimables

---

## Définition of Done (Sprint)

- [ ] Toutes les US Must marquées comme terminées
- [ ] MVP fonctionnel testable en local
- [ ] Tests unitaires passants (>70% couverture)
- [ ] Code review effectuée
- [ ] Documentation technique à jour
