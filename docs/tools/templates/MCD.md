# MCD — Modèle Conceptuel de Données

**Projet :** RizConnect Madagascar · version 1.0 · {{COUNTS.ENTITES}} entités, {{COUNTS.ASSOCIATIONS}} associations
**Source :** `hh.sh` — cahier des charges, modules M1 à M10 et règles de gestion RG-01 à RG-07
**Notation :** Merise (entité – association – entité), cardinalités `(min,max)`

---

## 1. Objet du document

Ce document décrit le **modèle conceptuel** de la plateforme RizConnect : les objets métier
(entités), leurs propriétés (attributs) et les liens qui les unissent (associations), sans
aucune référence à un langage ou à un SGBD. Il est indépendant de l'implémentation et sert
de contrat entre la maîtrise d'ouvrage (MAEP, BNGRC, coopératives, IMF) et l'équipe technique.

Le MCD est la première étape de la chaîne Merise du projet :

| Étape | Document | Répond à la question |
| --- | --- | --- |
| Conceptuel | **MCD** (ce document) | *Quelles données le métier manipule-t-il ?* |
| Logique | [MLD](MLD.md) | *Comment les stocker dans une base relationnelle ?* |
| Traitements | [MCT](MCT.md) | *Quels événements déclenchent quels traitements ?* |

---

## 2. Démarche de construction

Le cahier des charges ne décrit pas de base de données : il décrit des **besoins
fonctionnels** (RF-01 à RF-50) et des **règles de gestion** (RG-01 à RG-07). Le passage du
texte au modèle a suivi quatre étapes.

1. **Repérage des objets** : chaque groupe nominal récurrent du cahier des charges devient
   une entité candidate (« exploitation », « parcelle », « alerte », « dépôt », « sinistre »…).
2. **Repérage des associations** : les verbes et les dépendances fonctionnelles deviennent
   des associations (« un exploitant détient des exploitations », « une parcelle subit des
   sinistres »…).
3. **Choix des identifiants** : identifiant technique `id` systématique (UUID), plus une clé
   candidate métier quand elle existe (téléphone, code de zone, numéro de reçu).
4. **Vérification** : chaque exigence RF doit être couverte par au moins une entité ou une
   association, et chaque règle RG doit être traduisible par une contrainte du modèle.

### 2.1 Couverture des modules du cahier des charges

| Module | Exigences | Entités principalement mobilisées |
| --- | --- | --- |
| M1 — Comptes et utilisateurs | RF-01 à RF-04 | `UTILISATEUR`, `ROLE`, `UTILISATEUR_ROLE`, `ZONE`, `ORGANISATION` |
| M2 — Exploitations et parcelles | RF-05 à RF-08 | `EXPLOITATION`, `PARCELLE`, `POSSESSION_MATERIEL`, `VARIETE` |
| M3 — Calendrier cultural | RF-09 à RF-13 | `CYCLE_CULTURAL`, `ETAPE_CULTURELLE`, `ETAPE_PLANIFIEE`, `DECALAGE`, `NOTIFICATION` |
| M4 — Bibliothèque et formation | RF-14 à RF-19 | `FICHE_TECHNIQUE`, `MEDIA`, `FORMATION`, `QUESTION`, `CHOIX_REPONSE`, `INSCRIPTION_FORMATION` |
| M5 — Alertes climatiques | RF-20 à RF-25 | `ALERTE`, `CIBLAGE_ALERTE`, `NOTIFICATION`, `DONNEE_PLUVIOMETRIQUE`, `SEUIL_ALERTE` |
| M6 — Matériel agricole | RF-26 à RF-30 | `TYPE_MATERIEL`, `EQUIPEMENT`, `RESERVATION`, `MAINTENANCE` |
| M7 — Financement, GCV, stocks | RF-31 à RF-36 | `GCV`, `MEMBRE_GCV`, `MOUVEMENT_STOCK`, `RECU`, `DEMANDE_CREDIT`, `GARANTIE_STOCK`, `PRIX_MARCHE` |
| M8 — Suivi de production | RF-37 à RF-41 | `RECOLTE`, `CAMPAGNE`, `RAPPORT_VISITE` |
| M9 — Sinistres et infrastructures | RF-42 à RF-45 | `SINISTRE`, `PHOTO_SINISTRE`, `INFRASTRUCTURE`, `SIGNALEMENT_INFRA` |
| M10 — Administration, sync | RF-46 à RF-50 | `PARAMETRE`, `APPAREIL`, `SYNCHRONISATION`, `JOURNAL_AUDIT` |

### 2.2 Couverture des règles de gestion

{{REGLES}}

---

## 3. Diagramme conceptuel global

{{IMAGE_MCD}}

*Image : `docs/images/mcd.png` ({{SIZES_MCD}}). La version vectorielle `docs/images/mcd.svg`
reste nette à tous les niveaux de zoom ; la source Graphviz est dans `docs/sources/mcd.dot`.*

### 3.1 Représentation Mermaid (rendue par GitHub / GitLab)

{{MERMAID_MCD}}

> La notation patte de corbeau de Mermaid porte la même information que les cardinalités
> Merise `(min,max)` : le symbole placé près d'une entité indique combien de fois cette
> entité participe à la relation. Le libellé de chaque lien rappelle les deux cardinalités.

### 3.2 Lecture détaillée par domaine

Le diagramme global est dense ({{COUNTS.ENTITES}} entités). Les sept vues suivantes
reprennent chaque domaine avec ses entités de contexte, pour une lecture à l'écran sans
zoom.

{{MCD_DOMAIN_IMAGES}}

---

## 4. Entités par domaine

Le modèle est découpé en {{COUNTS.TABLES}} entités réparties en sept domaines, qui suivent
les modules du cahier des charges.

{{TABLE_DOMAINES}}

{{TABLE_ENTITES}}

---

## 5. Associations et cardinalités

Chaque association est nommée par un verbe à l'infinitif ou un substantif d'action, et
porte une justification tirée du cahier des charges.

{{TABLE_ASSOCIATIONS}}

### 5.1 Lecture des cardinalités

| Cardinalité | Signification | Exemple concret |
| --- | --- | --- |
| `1,1` | Participation obligatoire et unique | Une exploitation est située dans **exactement un** Fokontany (`A15`) |
| `0,1` | Participation facultative et unique | Un utilisateur peut ne pas être rattaché à une organisation (`A04`) |
| `0,n` | Participation facultative et multiple | Un exploitant peut détenir **plusieurs** exploitations (`A14`) |
| `1,n` | Participation obligatoire et multiple | Une alerte vise **au moins une** zone (`A38`) |

Une cardinalité `1,n` n'apparaît jamais du côté porteur d'une clé étrangère : elle décrit
l'ensemble des occurrences en face. Le sens de lecture est toujours
« *une occurrence de A participe à `cardA` occurrences de B* ».

---

## 6. Dictionnaire des données

Les identifiants techniques sont des UUID (sauf le journal d'audit, séquentiel pour la
performance) ; les horodatages sont en `timestamptz` (UTC) ; les montants sont en ariary
(`numeric`) et les poids en kilogrammes. Les énumérations sont explicitées pour préparer
les contraintes `CHECK` du MLD.

{{DICTIONNAIRE}}

---

## 7. Choix de modélisation et justifications

**7.1 Hiérarchie administrative en entité réflexive.** `ZONE` porte un `type_zone`
(région, district, commune, Fokontany) et une association réflexive `CONTIENT` (`A01`).
Quatre tables auraient figé la profondeur de la hiérarchie ; l'entité réflexive permet
d'ajouter un niveau (ex. « fokontany urbain ») sans migration.

**7.2 `UTILISATEUR_ROLE` comme association-entité.** Le cahier des charges exige des
« droits d'accès distincts » (RF-02) et un cloisonnement par zone (RG-07). Une association
porteuse d'attributs (`date_attribution`, `actif`, `zone_id`) devient une entité à part
entière : elle matérialise le périmètre d'exercice d'un rôle.

**7.3 Le cycle cultural, pivot du calendrier.** `CYCLE_CULTURAL` relie une parcelle, une
campagne et une variété (`A18` à `A20`) : c'est le seul objet qui satisfait RG-01
(« un calendrier est rattaché à une parcelle, une région et un type de riziculture »).

**7.4 Les étapes sont un référentiel, pas des colonnes.** `ETAPE_CULTURELLE` est un
référentiel (7 lignes : travail du sol, semis, repiquage, sarclage 1, sarclage 2, moisson,
battage) et `ETAPE_PLANIFIEE` porte les dates par cycle. Ajouter une étape (ex. « épandage »)
ne modifie pas le schéma.

**7.5 Le décalage est un objet, pas une date.** RG-05 impose une validation : un décalage
doit conserver sa proposition, son motif, son auteur de validation et son statut
(`DECALAGE`). Écraser `ETAPE_PLANIFIEE.date_prevue` aurait rendu la règle invérifiable.

**7.6 Une notification est un envoi, pas un message.** `ALERTE` décrit le phénomène
(une alerte cyclone) ; `NOTIFICATION` décrit chaque envoi à un utilisateur, avec son canal
(push/SMS/USSD), son statut et son accusé de réception (RF-21, RF-24). Cette séparation
permet de rejouer les échecs sans dupliquer l'alerte.

**7.7 Le ciblage est une entité.** Une alerte cyclone vise « une liste de communes »
(§ 3.12) : `CIBLAGE_ALERTE` porte la liste, ce qui autorise une alerte multi-zones sans
répétition du message. Même logique pour `CIBLAGE_MESSAGE` (RF-18).

**7.8 Le stock du GCV est un flux, pas un solde.** `MOUVEMENT_STOCK` (dépôt/retrait)
conserve l'historique, le reçu associé et la décision collective qui l'autorise (RG-06).
Le solde est calculé par la vue `v_stock_gcv` : il n'est jamais saisi, donc jamais faux.

**7.9 Le matériel possédé et le matériel disponible sont deux choses.** `TYPE_MATERIEL`
est le référentiel (angady, charrue, motoculteur…), `POSSESSION_MATERIEL` déclare ce que
possède une exploitation (RF-06) et `EQUIPEMENT` décrit un matériel réel louable (RF-26).
Cette séparation est nécessaire pour comparer rendement et matériel (RF-39).

**7.10 Le sinistre est localisé sur la parcelle.** `SINISTRE` pointe la parcelle touchée
(`A70`), ce qui rend la superficie et la cartographie calculables (RF-45). Les photos sont
dans `PHOTO_SINISTRE` car un sinistre en comporte plusieurs (RF-42).

**7.11 Traçabilité et mode hors ligne natifs.** `JOURNAL_AUDIT`, `APPAREIL` et
`SYNCHRONISATION` traduisent RF-46 et RF-49 : la plateforme doit pouvoir prouver ce qui a
été synchronisé, par quel appareil et dans quel ordre.

**7.12 Pas d'entité « table de bord ».** Les tableaux de bord (RF-38, RF-39, RF-40) sont
des **vues** calculées sur les données de production, décrites dans le [MLD](MLD.md#8-vues-et-calculs-dérivés).
Aucune donnée n'est dupliquée pour l'affichage.

---

## 8. Données personnelles et confidentialité

{{RGPD}}

Le modèle ne stocke aucune donnée bancaire : le crédit est instruit par l'IMF, RizConnect
ne conserve que le statut et les montants demandés/accordés (RF-33).

---

## 9. Volumétrie conceptuelle

Hypothèses de travail du cahier des charges (100 000 utilisateurs inscrits, 70 % de
riziculteurs) :

| Objet | Volume estimé | Base du calcul |
| --- | --- | --- |
| `UTILISATEUR` | 100 000 | cible du § 4 du cahier des charges |
| `EXPLOITATION` / `PARCELLE` | 80 000 / 200 000 | 2,5 parcelles par exploitation |
| `CYCLE_CULTURAL` | 200 000 / campagne | un cycle par parcelle et par campagne |
| `ETAPE_PLANIFIEE` | 1 400 000 / campagne | 7 étapes par cycle |
| `NOTIFICATION` | 5 à 10 M / an | rappels d'étapes + alertes, multicanal |
| `MOUVEMENT_STOCK` | 300 000 / an | 3 mouvements par membre et par campagne |
| `ALERTE` | 200 / an | 4 à 5 cyclones + sécheresses + pluies |

Ces volumes orientent les index du MLD (clés étrangères, `zone_id`, `date_prevue`,
`date_mouvement`) et justifient la matérialisation de `v_tableau_bord_zone`.

---

## 10. Limites et points à valider

- Le rapport source ne décrit pas de logiciel : le modèle est une **interprétation** des
  recommandations (§ 1.5 du cahier des charges).
- La notion de « décision collective » du GCV est modélisée simplement (`DECISION_COLLECTIVE`) ;
  les règles de quorum réelles doivent être confirmées avec les coopératives.
- Le prix du riz est modélisé par relevé (zone, variété, campagne) : la source exacte des
  relevés (ODR, marchés physiques, enquêteurs) reste à conventionner.
- Les unités (kg, ha, ariary) sont fixées ; une conversion en « kapoaka » ou en « varira »
  relève de l'interface, pas du modèle.
