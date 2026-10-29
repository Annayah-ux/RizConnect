# Script de création de la base — RizConnect

`schema.sql` est **généré** depuis `../tools/model.mjs` (voir `../README.md`). Ne pas le
modifier à la main : toute correction doit être faite dans le modèle puis régénérée.

## Prérequis

- PostgreSQL 16 ou plus ;
- extensions `postgis` (géométries de parcelles), `pgcrypto` (`gen_random_uuid()`) et
  `pg_trgm` (recherche libre par trigrammes sur les fiches techniques).

## Exécution

```bash
createdb rizconnect
psql -d rizconnect -f schema.sql
```

Le script crée, dans l'ordre :

1. les extensions ;
2. les 49 tables par domaine (D1 à D7), avec clés primaires, clés étrangères,
   contraintes `UNIQUE`, contraintes `CHECK` sur les énumérations, commentaires et index
   de clés étrangères ;
3. les index secondaires (composites, partiels, couvrants, GiST, GIN, BRIN) et les
   paramètres de stockage / autovacuum des tables les plus sollicitées ;
4. les 5 vues de calcul (`v_stock_gcv`, `v_indicateur_pluie`,
   `v_rendement_parcelle`, `v_disponibilite_materiel`, `v_tableau_bord_zone`, cette
   dernière étant matérialisée) et les index de la vue matérialisée.

## Optimisations intégrées

Le détail et la justification de chaque index figurent au § 9 du [MLD](../MLD.md).

- **Pas d'index redondant** : un index de clé étrangère n'est créé que s'il n'est pas déjà
  couvert par le préfixe gauche d'un index composite.
- **Index partiels** pour les files de travail (`notification` à envoyer, rappels du jour,
  décalages à valider, matériel disponible) : l'index ne contient que les lignes utiles.
- **Index couvrants** (`INCLUDE`) pour les écrans qui n'ont besoin que de quelques
  colonnes : le moteur répond sans lire la table.
- **Index GiST** sur `parcelle.geometrie`, **GIN trigramme** pour la recherche libre,
  **BRIN** sur les journaux en insertion seule (`journal_audit`, `mouvement_stock`).
- **`fillfactor` et autovacuum** ajustés sur `notification`, `etape_planifiee`,
  `reservation`, `equipement`, `sinistre`, `synchronisation`, `alerte` (mises à jour
  fréquentes) et sur les tables append-only.
- La vue matérialisée possède un index unique, ce qui autorise
  `REFRESH MATERIALIZED VIEW CONCURRENTLY`.

Après un chargement massif de données, lancer une fois :

```sql
ANALYZE;
```

Sur une base **déjà en production**, préférer la création des index sans verrou d'écriture
(`CREATE INDEX CONCURRENTLY`), en reprenant les instructions de la section « INDEX
SECONDAIRES » du script.

## Points d'attention

- Les contraintes métier qui ne sont pas exprimables en `CHECK` (validation d'un décalage,
  rendement calculé, stock non négatif) sont décrites au § 7.2 du [MLD](../MLD.md) et
  relèvent des triggers applicatifs.
- Le cloisonnement par zone (RG-07) suppose l'activation de `ROW LEVEL SECURITY` et la
  création de politiques par zone ; ce paramétrage dépend du déploiement.
- Le partitionnement de `notification` et `journal_audit` est recommandé en exploitation
  (§ 11 du MLD) mais n'est pas inclus dans le DDL : il modifierait les clés primaires.
- Les données du pilote (régions Vakinankaratra, Alaotra Mangoro, Sofia) ne sont pas
  incluses : elles seront chargées par un script d'amorçage distinct.
