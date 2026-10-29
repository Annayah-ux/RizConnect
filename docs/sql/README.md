# Script de création de la base — RizConnect

`schema.sql` est **généré** depuis `../tools/model.mjs` (voir `../README.md`). Ne pas le
modifier à la main : toute correction doit être faite dans le modèle puis régénérée.

## Prérequis

- PostgreSQL 16 ou plus ;
- extensions `postgis` (géométries de parcelles) et `pgcrypto` (`gen_random_uuid()`).

## Exécution

```bash
createdb rizconnect
psql -d rizconnect -f schema.sql
```

Le script crée, dans l'ordre :

1. les extensions ;
2. les 49 tables par domaine (D1 à D7), avec clés primaires, clés étrangères,
   contraintes `UNIQUE`, contraintes `CHECK` sur les énumérations, commentaires et index ;
3. les 5 vues de calcul (`v_stock_gcv`, `v_indicateur_pluie`,
   `v_rendement_parcelle`, `v_disponibilite_materiel`, `v_tableau_bord_zone`, cette
   dernière étant matérialisée).

## Points d'attention

- Les contraintes métier qui ne sont pas exprimables en `CHECK` (validation d'un décalage,
  rendement calculé, stock non négatif) sont décrites au § 7.2 du [MLD](../MLD.md) et
  relèvent des triggers applicatifs.
- Le cloisonnement par zone (RG-07) suppose l'activation de `ROW LEVEL SECURITY` et la
  création de politiques par zone ; ce paramétrage dépend du déploiement.
- Les données du pilote (régions Vakinankaratra, Alaotra Mangoro, Sofia) ne sont pas
  incluses : elles seront chargées par un script d'amorçage distinct.
