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
| Clés candidates et index uniques | {{COUNTS.UNIQUES}} | téléphone, e-mail, codes, numéro de reçu, absence de doublons métier |
| Contraintes de domaine (`CHECK`) | {{COUNTS.CHECKS}} | énumérations `statut`, `type_*`, `niveau` |
| Index (toutes natures) | {{COUNTS.INDEX}} | {{COUNTS.INDEX_FK}} de clés étrangères + {{COUNTS.PERF}} secondaires et 2 sur la vue matérialisée |

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

Le DDL est calibré pour les lectures les plus fréquentes de la plateforme : boîte de
réception et diffusion d'alertes, rappels culturaux du jour, stocks du GCV, disponibilité
du matériel, files de traitement BNGRC et IMF, tableaux de bord par zone.

Quatre règles ont guidé la génération :

1. **Pas d'index en double.** Chaque clé étrangère reçoit un index, sauf lorsqu'un index
   composite commence déjà par la même colonne : {{COUNTS.INDEX_FK}} index couvrent les
   {{COUNTS.ASSOCIATIONS}} clés étrangères.
2. **Filtre puis tri.** Les index composites placent la colonne d'égalité (zone, cycle,
   utilisateur, équipement) avant les colonnes de plage ou de tri (`date_* DESC`).
3. **Index partiels** pour les files de travail : seules les lignes utiles sont indexées
   (`statut = 'prevue'`, `date_lecture IS NULL`, `etat = 'disponible'`), ce qui réduit la
   taille de l'index et le coût des écritures.
4. **Index couvrants (`INCLUDE`)** quand l'écran n'a besoin que de quelques colonnes :
   le moteur répond par balayage d'index seul, sans lire la table (`telephone` pour les
   SMS, `quantite_kg` pour le stock, `quantite` pour le matériel).

Les index spécialisés complètent l'ensemble :

- **GiST** sur `parcelle.geometrie` pour les recherches spatiales (sinistres, cartographie) ;
- **GIN trigramme** (`pg_trgm`) sur les fiches techniques pour la recherche libre `ILIKE '%mot%'` ;
- **BRIN** sur les journaux append-only (`journal_audit`, `mouvement_stock`), où un index
  compact suffit pour les extractions et purges par période.

{{PERF_INDEX_TABLE}}

### 9.1 Paramètres de stockage

Une marge de remplissage (`fillfactor`) inférieure à 100 laisse de la place aux mises à
jour sur place (*HOT updates*), qui n'ont alors pas à réécrire les index. Les tables
journalisées en insertion seule restent à 100. L'autovacuum est rendu plus réactif sur
les tables à fort volume.

{{STORAGE_TABLE}}

### 9.2 Vue matérialisée

`v_tableau_bord_zone` porte un index unique `(zone_id, campagne_id)`, indispensable à
`REFRESH MATERIALIZED VIEW CONCURRENTLY` : le rafraîchissement nocturne ne bloque plus les
lectures des tableaux de bord. Le second index sert les filtres par campagne.

### 9.3 Compromis lecture / écriture

Chaque index ralentit légèrement les insertions et consomme de l'espace. Le jeu ci-dessus
reste volontairement ciblé : {{COUNTS.INDEX}} index au total pour {{COUNTS.TABLES}} tables.
Les index inutilisés doivent être repérés en production avec `pg_stat_user_indexes`
(`idx_scan = 0`) avant d'être supprimés, et les requêtes lentes analysées avec `EXPLAIN
(ANALYZE, BUFFERS)`.

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

Le partitionnement et les purges indiqués ci-dessus sont des **recommandations
d'exploitation** : le DDL livré reste volontairement non partitionné, car le
partitionnement PostgreSQL exige d'inclure la clé de partition dans chaque clé primaire
(ce qui modifierait les identifiants UUID et les clés étrangères). Il s'active au
déploiement, par exemple avec `pg_partman` sur `notification` et `journal_audit`.

---

## 12. Script de création

Le DDL complet (tables, contraintes, commentaires, index, paramètres de stockage, vues)
est disponible ici :

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
