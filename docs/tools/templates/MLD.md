# MLD — Modèle Logique de Données

**Projet :** RizConnect Madagascar · version 1.0
**SGBD cible :** PostgreSQL 16 + PostGIS (géométries de parcelles)
**Résultat :** {{COUNTS.TABLES}} tables, {{COUNTS.COLONNES}} colonnes, {{COUNTS.ASSOCIATIONS}} clés étrangères
**Documents liés :** [MCD](MCD.md) · [MCT](MCT.md) · [`sql/schema.sql`](sql/schema.sql)

---

## 1. Objet du document

Le MLD traduit le [MCD](MCD.md) en schéma relationnel exécutable : tables, colonnes, types,
clés primaires, clés étrangères et contraintes d'intégrité. Il reste indépendant du produit
mais dépend du **modèle relationnel** : il précise les types de données et les règles
d'intégrité que le SGBD fera respecter.

Le script complet, prêt à exécuter, est fourni dans [`sql/schema.sql`](sql/schema.sql) ;
il est généré depuis le même modèle que celui qui produit les diagrammes, ce qui garantit
la cohérence entre le document et le code.

---

## 2. Conventions de nommage et de typage

| Convention | Règle appliquée | Exemple |
| --- | --- | --- |
| Tables | `snake_case`, au singulier | `mouvement_stock` |
| Colonnes | `snake_case` | `date_recherche` → `date_releve` |
| Clé primaire | `id` de type `uuid` (`gen_random_uuid()`), sauf `journal_audit.id` en `bigserial` | `utilisateur.id` |
| Clé étrangère | `<entité_référencée>_id`, ou nom métier si plusieurs liens vers la même table | `proprietaire_id`, `declarant_id`, `instructeur_id` |
| Clé candidate | contrainte `UNIQUE` (`UK`) | `utilisateur.telephone` |
| Booléens | `boolean`, préfixe `est_` ou `actif` | `actif`, `correcte` |
| Dates | `date` pour un jour, `timestamptz` pour un instant | `date_recolte`, `date_mouvement` |
| Montants / poids | `numeric(p,s)` en ariary ou en kilogrammes, jamais en flottant | `montant_demande_mga`, `quantite_kg` |
| Énumérations | `varchar` + contrainte `CHECK … IN (…)` | `statut IN ('signale','transmis',…)` |
| Géographie | `numeric(9,6)` pour le point, `geometry(MultiPolygon,4326)` pour le contour | `parcelle.geometrie` |
| Suppression | `ON DELETE CASCADE` pour les entités faibles, `RESTRICT` par défaut | `photo_sinistre` |

**Pourquoi des UUID ?** Le mode hors ligne (RF-46) impose de créer des enregistrements sur
le téléphone avant tout contact avec le serveur : un identifiant généré localement évite
les collisions à la synchronisation. Un `bigserial` central ne le permettrait pas.

---

## 3. Règles de passage MCD → MLD

| Cas du MCD | Règle appliquée | Exemple |
| --- | --- | --- |
| Entité | Une table ; identifiant → `PRIMARY KEY` | `ZONE` → `zone(id)` |
| Association `1,1` – `0,n` / `1,n` | Clé étrangère **obligatoire** dans la table du côté « N » | `parcelle.exploitation_id NOT NULL` |
| Association `0,1` – `0,n` / `1,n` | Clé étrangère **facultative** (`NULL`) dans la table du côté « N » | `alerte.emetteur_id NULL` |
| Association `1,1` – `1,1` | Une seule table, ou clé étrangère `UNIQUE` | `recu.mouvement_id UNIQUE` (1 reçu par mouvement) |
| Association-entité (`UTILISATEUR_ROLE`) | Table propre avec deux clés étrangères + attributs portés | `utilisateur_role(utilisateur_id, role_id, …)` |
| Association réflexive (`ZONE.CONTIENT`) | Clé étrangère vers la même table | `zone.parent_id → zone.id` |
| Association `n,n` | Table de jonction (aucune dans ce modèle : les cas sont déjà des entités) | `ciblage_alerte`, `ciblage_message` |
| Association porteuse de plusieurs occurrences | Entité faible, `ON DELETE CASCADE` | `photo_sinistre`, `media` |

### 3.1 Tableau de correspondance complet

{{MLD_MAPPING}}

---

## 4. Diagramme logique

{{IMAGE_MLD}}

*Image : `docs/images/mld.png` ({{SIZES_MLD}}). Source Graphviz : `docs/sources/mld.dot`.
La patte de corbeau est placée côté table qui porte la clé étrangère.*

### 4.1 Représentation Mermaid

{{MERMAID_MLD}}

---

## 5. Liste des tables

{{MLD_TABLES}}

---

## 6. Détail des tables

Chaque table est décrite avec ses colonnes, ses types et ses contraintes. Les colonnes
`PK`, `FK` et `UK` sont celles du script [`sql/schema.sql`](sql/schema.sql).

{{MLD_DETAIL}}

---

## 7. Contraintes d'intégrité

### 7.1 Contraintes structurelles

| Type | Nombre | Portée |
| --- | --: | --- |
| Clés primaires | {{COUNTS.TABLES}} | une par table |
| Clés étrangères | {{COUNTS.ASSOCIATIONS}} | toutes les associations du MCD |
| Clés candidates (`UNIQUE`) | 12 | téléphone, e-mail, codes, numéro de reçu |
| Contraintes de domaine (`CHECK`) | 34 | énumérations `statut`, `type_*`, `niveau` |

### 7.2 Contraintes métier non déclaratives

Certaines règles du cahier des charges ne peuvent pas s'exprimer par une simple contrainte
de colonne ; elles sont implémentées par des triggers ou par le code applicatif.

| Règle | Contrainte | Mise en œuvre |
| --- | --- | --- |
| RG-02 / RG-03 | Sarclage à 8–10 jours, repiquage à 15–20 cm | Génération des `etape_planifiee` (opération O10) avec les délais de `etape_culturelle` |
| RG-04 | Une alerte cyclone est prioritaire et couvre toute la zone | `alerte.priorite` + diffusion à toutes les exploitations des zones de `ciblage_alerte` |
| RG-05 | Pas de décalage sans validation | `decalage.statut='valide'` ⇒ `valide_par_id IS NOT NULL` (trigger `trg_decalage_validation`) |
| RG-06 | Retrait soumis à décision collective | `CHECK (type_mouvement <> 'retrait' OR decision_id IS NOT NULL)` |
| RG-07 | Cloisonnement par zone | Politiques `ROW LEVEL SECURITY` sur `exploitation`, `parcelle`, `sinistre`, `notification` |
| RF-37 | Rendement cohérent avec la superficie | Trigger `trg_recolte_rendement` : `rendement_t_ha = quantite_paddy_kg / 1000 / parcelle.superficie_ha` |
| RF-31 | Stock jamais négatif | Contrôle applicatif sur `v_stock_gcv` avant insertion d'un retrait (trigger différé) |
| RF-50 | Un seul seuil actif par zone et par type | Index unique partiel `WHERE actif` sur `seuil_alerte (zone_id, type_alerte)` |

### 7.3 Exemples de contraintes déclaratives générées

```sql
-- RG-06 : un retrait de stock exige une décision collective
CONSTRAINT ck_mouvement_stock_decision
  CHECK (type_mouvement <> 'retrait' OR decision_id IS NOT NULL)

-- Un seul reçu par mouvement (relation 1,1 du MCD, association A59)
CONSTRAINT uk_recu_mouvement UNIQUE (mouvement_id)

-- Un utilisateur ne peut avoir qu'un seul rôle actif identique
CONSTRAINT uk_utilisateur_role UNIQUE (utilisateur_id, role_id)
```

---

## 8. Vues et calculs dérivés

Cinq objets de calcul évitent de stocker des données redondantes. Ils couvrent les
exigences de pilotage (RF-25, RF-31, RF-37, RF-38, RF-39).

{{VUES}}

---

## 9. Index et performances

Les index couvrent les trois usages critiques : la synchronisation mobile (lecture par
utilisateur et par zone), la diffusion d'alerte (envoi massif par zone) et les tableaux
de bord (agrégats par campagne).

| Index | Table(s) | Justification |
| --- | --- | --- |
| `idx_<table>_<fk>` | toutes les tables portant une FK | jointures et intégrité référentielle ({{COUNTS.ASSOCIATIONS}} index) |
| `idx_etape_planifiee_date_prevue` | `etape_planifiee` | sélection des rappels du jour (RF-12) |
| `idx_notification_statut` | `notification` | rejeu des envois en échec (RF-21, RF-24) |
| `idx_alerte_zone_dates` | `alerte`, `ciblage_alerte` | diffusion prioritaire sous 15 min (RG-04) |
| `idx_mouvement_stock_gcv_date` | `mouvement_stock` | calcul du stock et des reçus (RF-31) |
| `idx_parcelle_geometrie` (GiST) | `parcelle` | cartographie des zones sinistrées (RF-45) |
| `idx_sinistre_statut` | `sinistre` | suivi du traitement par le BNGRC (RF-43) |
| `idx_donnee_pluviometrique_zone_date` | `donnee_pluviometrique` | cumuls à 10 et 20 jours (RF-25) |

Liste générée des index de clés étrangères :
{{INDEX_LIST}}

---

## 10. Normalisation

Le schéma est en **troisième forme normale (3FN)** :

- **1FN** — aucune colonne multivaluée. Les listes (photos d'un sinistre, zones ciblées
  par une alerte, choix d'une question) sont des tables filles.
- **2FN** — les attributs ne dépendent que de la clé primaire complète. Les tables de
  jonction (`utilisateur_role`, `ciblage_alerte`) portent leurs propres attributs, pas
  des attributs de leurs parents.
- **3FN** — aucun attribut ne dépend d'un autre attribut non clé : `rendement_t_ha` est
  calculé par trigger à partir des données sources, `superficie_totale_ha` est un cache
  recalculé, le stock du GCV est une vue.

**Dénormalisations assumées et documentées :**

| Élément | Pourquoi | Garde-fou |
| --- | --- | --- |
| `exploitation.superficie_totale_ha` | évite un `SUM` sur toutes les parcelles dans les tableaux de bord | recalcul par trigger après insertion/modification de parcelle |
| `recolte.rendement_t_ha` | valeur historique figée au moment de la déclaration | trigger de calcul, jamais saisi |
| `notification.message` | conserver le texte réellement envoyé (SMS facturé) | instantané, non mis à jour |
| `v_tableau_bord_zone` (matérialisée) | agrégats régionaux coûteux (100 000 utilisateurs) | rafraîchissement nocturne après clôture de campagne |

---

## 11. Volumétrie et dimensionnement

| Table | Lignes / an | Taille estimée / an | Stratégie |
| --- | --: | --: | --- |
| `notification` | 5–10 M | ~2 Go | partitionnement mensuel, purge à 24 mois |
| `etape_planifiee` | 1,4 M | ~150 Mo | index sur `date_prevue`, archivage par campagne |
| `mouvement_stock` | 300 000 | ~60 Mo | conservation 10 ans (valeur patrimoniale du GCV) |
| `journal_audit` | 2–3 M | ~1 Go | partitionnement mensuel, purge à 12 mois |
| `donnee_pluviometrique` | 150 000 | ~15 Mo | conservation 20 ans (séries climatiques) |
| `photo_sinistre` | 50 000 | objets S3 ~5 Go | URL en base, fichiers hors base |

---

## 12. Script de création

Le DDL complet (tables, contraintes, commentaires, index, vues) est disponible ici :

- [`sql/schema.sql`](sql/schema.sql) — script généré, exécutable tel quel ;
- [`sql/README.md`](sql/README.md) — ordre d'exécution et prérequis.

---

## 13. Correspondance avec le MCD

| MCD | MLD | Observation |
| --- | --- | --- |
| {{COUNTS.ENTITES}} entités | {{COUNTS.TABLES}} tables | aucune table supplémentaire : les associations n,n sont déjà des entités |
| {{COUNTS.ASSOCIATIONS}} associations | {{COUNTS.ASSOCIATIONS}} clés étrangères | aucune table de jonction créée par transformation |
| Entités faibles | `ON DELETE CASCADE` | `media`, `photo_sinistre`, `choix_reponse`, `recu`, `ciblage_*` |
| Attributs calculés du MCD | Colonnes calculées + vues | `rendement_t_ha`, `stock_kg`, `deficit_20j_pct` |
