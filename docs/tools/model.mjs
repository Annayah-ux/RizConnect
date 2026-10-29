/**
 * RizConnect — modèle de données unique.
 *
 * Ce fichier est la source de vérité : le MCD, le MLD, le MCT, le DDL SQL et
 * les diagrammes Mermaid sont tous dérivés d'ici pour rester cohérents.
 * Référentiel : cahier des charges `hh.sh` (modules M1 à M10, règles RG-01 à RG-07).
 */

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Colonne : nom, type SQL, clé (PK/FK/UK), description, valeurs énumérées. */
const c = (n, t, k = '', d = '', en = null, opt = false) => ({ n, t, k, d, en, opt });

/** Association : a, b, cardinalités Merise, nom, clé étrangère et côté porteur. */
const r = (id, a, b, cardA, cardB, nom, fk, on, d = '') => ({
  id,
  a,
  b,
  cardA,
  cardB,
  nom,
  fk,
  on,
  d,
});

export const project = {
  nom: 'RizConnect Madagascar',
  version: '1.0',
  date: '29 octobre 2026',
  source: 'hh.sh — Cahier des charges, § 3 (M1 à M10) et § 3.11 (règles de gestion)',
  sgbd: 'PostgreSQL 16 (extension PostGIS pour la géométrie)',
};

/* ------------------------------------------------------------------ */
/* Domaines (regroupement des modules du cahier des charges)           */
/* ------------------------------------------------------------------ */

export const domains = [
  { id: 'D1', label: 'Comptes, référentiel et administration', modules: 'M1 · M10', color: '#dbeafe', border: '#2563eb' },
  { id: 'D2', label: 'Exploitations, parcelles et calendrier cultural', modules: 'M2 · M3 · M8', color: '#dcfce7', border: '#16a34a' },
  { id: 'D3', label: 'Bibliothèque technique et formation', modules: 'M4', color: '#fef3c7', border: '#d97706' },
  { id: 'D4', label: 'Alertes, météo et sensibilisation', modules: 'M5 · M10', color: '#fee2e2', border: '#dc2626' },
  { id: 'D5', label: 'Matériel agricole', modules: 'M6', color: '#ede9fe', border: '#7c3aed' },
  { id: 'D6', label: 'GCV, stocks, crédit et prix', modules: 'M7', color: '#cffafe', border: '#0891b2' },
  { id: 'D7', label: 'Suivi de production, sinistres et infrastructures', modules: 'M8 · M9', color: '#fce7f3', border: '#db2777' },
];

/* ------------------------------------------------------------------ */
/* Entités du MCD / tables du MLD                                      */
/* ------------------------------------------------------------------ */

export const entities = [
  /* ------------------------------ D1 ------------------------------ */
  {
    id: 'ZONE',
    label: 'Zone administrative',
    domain: 'D1',
    desc: "Découpage région → district → commune → Fokontany (RF-03). Relation réflexive pour la hiérarchie.",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('code', 'varchar(24)', 'UK', 'Code officiel (ex. MG-ANA-01)'),
      c('nom', 'varchar(120)', '', 'Nom de la zone'),
      c('type_zone', 'varchar(16)', '', 'Niveau hiérarchique', ['region', 'district', 'commune', 'fokontany']),
      c('population', 'integer', '', 'Population estimée', null, true),
      c('actif', 'boolean', '', 'Zone ouverte au pilote'),
    ],
  },
  {
    id: 'ORGANISATION',
    label: 'Organisation partenaire',
    domain: 'D1',
    desc: "Coopérative, IMF, ONG, CFAMA, MAEP, BNGRC ou service météo (RF-02, RF-26, RF-33).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('nom', 'varchar(160)', '', 'Raison sociale'),
      c('type_organisation', 'varchar(24)', '', "Nature de l'organisation", ['cooperative', 'imf', 'ong', 'cfama', 'maep', 'bngrc', 'service_meteo']),
      c('telephone', 'varchar(20)', '', 'Contact'),
      c('email', 'varchar(160)', '', 'Contact électronique'),
      c('actif', 'boolean', '', 'Organisation active'),
    ],
  },
  {
    id: 'UTILISATEUR',
    label: 'Utilisateur',
    domain: 'D1',
    desc: "Compte identifié par son téléphone (RF-01), rattaché à une zone et éventuellement à une organisation.",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('telephone', 'varchar(20)', 'UK', 'Numéro unique, identifiant de connexion'),
      c('email', 'varchar(160)', 'UK', 'Optionnel, agents et institutions', null, true),
      c('nom', 'varchar(80)', '', 'Nom'),
      c('prenom', 'varchar(80)', '', 'Prénom'),
      c('mot_de_passe_hash', 'text', '', 'Hash Argon2 ; nul si authentification par code SMS', null, true),
      c('langue', 'varchar(2)', '', 'Langue de l’interface', ['mg', 'fr']),
      c('statut', 'varchar(16)', '', 'État du compte', ['invite', 'actif', 'suspendu', 'archive']),
      c('consentement_le', 'timestamptz', '', 'Consentement données personnelles', null, true),
      c('date_inscription', 'timestamptz', '', 'Date de création du compte'),
    ],
  },
  {
    id: 'ROLE',
    label: 'Rôle',
    domain: 'D1',
    desc: "Référentiel des rôles : exploitant, agent, coopérative, IMF, MAEP, BNGRC, administrateur (RF-02).",
    attrs: [
      c('code', 'varchar(24)', 'PK', 'Code du rôle'),
      c('libelle', 'varchar(80)', '', 'Libellé affiché'),
      c('description', 'text', '', 'Droits associés'),
    ],
  },
  {
    id: 'UTILISATEUR_ROLE',
    label: 'Affectation de rôle',
    domain: 'D1',
    desc: "Association-entité : un utilisateur peut cumuler des rôles, avec un périmètre géographique (RG-07).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('date_attribution', 'timestamptz', '', "Date d'effet"),
      c('actif', 'boolean', '', 'Rôle en cours'),
    ],
  },
  {
    id: 'APPAREIL',
    label: 'Appareil',
    domain: 'D1',
    desc: "Terminal Android ou navigateur utilisé pour la synchronisation hors ligne (RF-46).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('identifiant_appareil', 'varchar(120)', 'UK', 'Identifiant matériel/logiciel'),
      c('plateforme', 'varchar(16)', '', 'Système', ['android', 'web', 'ussd']),
      c('version_app', 'varchar(20)', '', 'Version du client'),
      c('derniere_sync', 'timestamptz', '', 'Dernière synchronisation réussie'),
    ],
  },
  {
    id: 'PARAMETRE',
    label: 'Paramètre',
    domain: 'D1',
    desc: "Paramétrage des régions, saisons, variétés et seuils (RF-50), modifiable par un administrateur.",
    attrs: [
      c('cle', 'varchar(60)', 'PK', 'Clé du paramètre'),
      c('valeur', 'text', '', 'Valeur sérialisée'),
      c('type_valeur', 'varchar(16)', '', 'Type de la valeur', ['entier', 'decimal', 'booleen', 'texte', 'json']),
      c('libelle', 'varchar(160)', '', 'Description fonctionnelle'),
      c('modifie_le', 'timestamptz', '', 'Dernière modification'),
    ],
  },
  {
    id: 'SEUIL_ALERTE',
    label: "Seuil d'alerte",
    domain: 'D1',
    desc: "Seuils pluviométriques par zone utilisés pour qualifier la sécheresse (RF-25, RF-50).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('type_alerte', 'varchar(24)', '', "Phénomène surveillé", ['secheresse', 'fortes_pluies', 'cyclone']),
      c('cumul_10j_mm', 'numeric(6,1)', '', 'Cumul de pluie minimal sur 10 jours'),
      c('cumul_20j_mm', 'numeric(6,1)', '', 'Cumul de pluie minimal sur 20 jours'),
      c('niveau', 'varchar(16)', '', 'Niveau déclenché', ['info', 'vigilance', 'alerte', 'urgence']),
      c('actif', 'boolean', '', 'Seuil actif'),
    ],
  },
  {
    id: 'JOURNAL_AUDIT',
    label: "Journal d'audit",
    domain: 'D1',
    desc: "Traçabilité des actions, des synchronisations et des accès (RF-49).",
    attrs: [
      c('id', 'bigserial', 'PK', 'Identifiant séquentiel'),
      c('action', 'varchar(32)', '', 'Type d’action (creation, modification, suppression, connexion…)'),
      c('entite', 'varchar(48)', '', 'Table concernée'),
      c('entite_id', 'uuid', '', 'Enregistrement concerné', null, true),
      c('details', 'jsonb', '', 'Avant/après, contexte'),
      c('adresse_ip', 'inet', '', 'Origine de la requête', null, true),
      c('date_action', 'timestamptz', '', 'Horodatage'),
    ],
  },
  {
    id: 'SYNCHRONISATION',
    label: 'Synchronisation',
    domain: 'D1',
    desc: "Journal des remontées hors ligne (RF-46) : volume, durée, conflits éventuels.",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('debut_le', 'timestamptz', '', 'Début de la synchronisation'),
      c('fin_le', 'timestamptz', '', 'Fin de la synchronisation', null, true),
      c('nb_enregistrements', 'integer', '', 'Nombre d’enregistrements échangés'),
      c('statut', 'varchar(16)', '', 'Résultat', ['reussie', 'partielle', 'echec']),
    ],
  },

  /* ------------------------------ D2 ------------------------------ */
  {
    id: 'EXPLOITATION',
    label: 'Exploitation',
    domain: 'D2',
    desc: "Unité de production d'un exploitant dans un Fokontany (RF-05).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('code', 'varchar(24)', 'UK', 'Code lisible (ex. EXP-2026-0142)'),
      c('nom', 'varchar(160)', '', 'Nom de l’exploitation'),
      c('telephone', 'varchar(20)', '', 'Téléphone de contact', null, true),
      c('superficie_totale_ha', 'numeric(8,2)', '', 'Somme des parcelles (dénormalisée pour le pilotage)', null, true),
      c('statut', 'varchar(16)', '', 'État', ['active', 'suspendue', 'archivee']),
    ],
  },
  {
    id: 'PARCELLE',
    label: 'Parcelle',
    domain: 'D2',
    desc: "Rizière localisée et géométrisée (RF-05, RF-08), support du calendrier et des sinistres.",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('code', 'varchar(24)', '', 'Code interne à l’exploitation'),
      c('superficie_ha', 'numeric(6,2)', '', 'Superficie en hectares'),
      c('type_riziculture', 'varchar(16)', '', 'Mode de culture', ['irriguee', 'pluviale', 'brulis']),
      c('latitude', 'numeric(9,6)', '', 'Latitude du centroïde', null, true),
      c('longitude', 'numeric(9,6)', '', 'Longitude du centroïde', null, true),
      c('geometrie', 'geometry(MultiPolygon,4326)', '', 'Contour saisi sur la carte (PostGIS)', null, true),
      c('statut', 'varchar(16)', '', 'État', ['active', 'jachere', 'abandonnee']),
    ],
  },
  {
    id: 'VARIETE',
    label: 'Variété de riz',
    domain: 'D2',
    desc: "Référentiel des variétés (RF-07, RF-50) : durée de cycle et potentiel de rendement.",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('nom', 'varchar(120)', 'UK', 'Nom de la variété'),
      c('cycle_jours', 'integer', '', 'Durée moyenne du cycle'),
      c('rendement_potentiel_t_ha', 'numeric(4,2)', '', 'Potentiel de rendement', null, true),
      c('description', 'text', '', 'Caractéristiques', null, true),
      c('actif', 'boolean', '', 'Variété proposée'),
    ],
  },
  {
    id: 'CAMPAGNE',
    label: 'Campagne rizicole',
    domain: 'D2',
    desc: "Période de production (grande saison / contre-saison) servant de référentiel temporel (RF-07, RF-37).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('libelle', 'varchar(40)', 'UK', 'Libellé (ex. 2026-2027)'),
      c('date_debut', 'date', '', 'Début de campagne'),
      c('date_fin', 'date', '', 'Fin de campagne'),
      c('saison', 'varchar(16)', '', 'Saison', ['grande_saison', 'contre_saison']),
      c('statut', 'varchar(16)', '', 'État', ['preparee', 'en_cours', 'cloturee']),
    ],
  },
  {
    id: 'CYCLE_CULTURAL',
    label: 'Cycle cultural',
    domain: 'D2',
    desc: "Culture d'une variété sur une parcelle pendant une campagne : point d'entrée du calendrier (RG-01).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('date_debut', 'date', '', 'Date de démarrage (travail du sol)'),
      c('date_fin_prevue', 'date', '', 'Fin prévue (battage)', null, true),
      c('statut', 'varchar(16)', '', 'Avancement', ['planifie', 'en_cours', 'termine', 'abandonne']),
    ],
  },
  {
    id: 'ETAPE_CULTURELLE',
    label: 'Étape culturelle',
    domain: 'D2',
    desc: "Référentiel des étapes : travail du sol, semis, repiquage, sarclage, moisson, battage (RF-09, RF-14).",
    attrs: [
      c('code', 'varchar(24)', 'PK', 'Code de l’étape'),
      c('libelle', 'varchar(80)', '', 'Libellé bilingue de référence'),
      c('ordre', 'integer', '', 'Ordre chronologique'),
      c('delai_min_jours', 'integer', '', 'Délai minimal depuis l’étape précédente', null, true),
      c('delai_max_jours', 'integer', '', 'Délai maximal depuis l’étape précédente', null, true),
      c('description', 'text', '', 'Contenu de la fiche type', null, true),
    ],
  },
  {
    id: 'ETAPE_PLANIFIEE',
    label: 'Étape planifiée',
    domain: 'D2',
    desc: "Occurrence datée d'une étape pour un cycle (RF-09, RF-12), base des rappels.",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('date_prevue', 'date', '', 'Date planifiée'),
      c('date_reelle', 'date', '', 'Date de réalisation constatée', null, true),
      c('statut', 'varchar(16)', '', 'Avancement', ['prevue', 'en_cours', 'realisee', 'sautee']),
    ],
  },
  {
    id: 'DECALAGE',
    label: 'Décalage de calendrier',
    domain: 'D2',
    desc: "Proposition de report d'une étape, jamais appliquée sans validation (RF-11, RG-05).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('date_proposee', 'date', '', 'Nouvelle date proposée'),
      c('motif', 'varchar(160)', '', 'Retard des pluies, sécheresse, alerte cyclone…'),
      c('source', 'varchar(24)', '', 'Origine de la proposition', ['meteo', 'alerte', 'exploitant', 'agent']),
      c('statut', 'varchar(16)', '', 'Décision', ['propose', 'valide', 'refuse']),
      c('date_validation', 'timestamptz', '', 'Horodatage de la décision', null, true),
    ],
  },
  {
    id: 'RECOLTE',
    label: 'Récolte',
    domain: 'D2',
    desc: "Déclaration de récolte d'un cycle et rendement calculé en t/ha (RF-07, RF-37).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('date_recolte', 'date', '', 'Date de moisson/battage'),
      c('quantite_paddy_kg', 'numeric(10,2)', '', 'Production de paddy déclarée'),
      c('rendement_t_ha', 'numeric(5,2)', '', 'Rendement calculé : quantité / superficie', null, true),
      c('qualite', 'varchar(16)', '', 'Qualité estimée', ['bonne', 'moyenne', 'faible'], true),
    ],
  },
  {
    id: 'POSSESSION_MATERIEL',
    label: 'Matériel possédé',
    domain: 'D2',
    desc: "Matériel déclaré par une exploitation (RF-06), utilisé pour personnaliser les conseils (RF-19, RF-39).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('quantite', 'integer', '', 'Nombre d’unités'),
      c('annee_acquisition', 'integer', '', 'Année d’acquisition'),
    ],
  },

  /* ------------------------------ D3 ------------------------------ */
  {
    id: 'FICHE_TECHNIQUE',
    label: 'Fiche technique',
    domain: 'D3',
    desc: "Fiche pratique par étape : technique, outil traditionnel et outil moderne équivalent (RF-14, RF-16, RF-47).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('titre_mg', 'varchar(160)', '', 'Titre en malagasy'),
      c('titre_fr', 'varchar(160)', '', 'Titre en français'),
      c('resume_mg', 'text', '', 'Contenu court en malagasy'),
      c('resume_fr', 'text', '', 'Contenu court en français'),
      c('outil_traditionnel', 'varchar(160)', '', 'Ex. angady, faucille'),
      c('outil_moderne', 'varchar(160)', '', 'Ex. motoculteur, batteuse'),
      c('statut', 'varchar(16)', '', 'Cycle de publication', ['brouillon', 'publie', 'archive']),
      c('date_publication', 'timestamptz', '', 'Date de mise en ligne', null, true),
    ],
  },
  {
    id: 'MEDIA',
    label: 'Média',
    domain: 'D3',
    desc: "Illustration, vidéo courte ou lecture audio d'une fiche, par langue (RF-15).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('type_media', 'varchar(12)', '', 'Format', ['image', 'video', 'audio']),
      c('url', 'text', '', 'Adresse du fichier'),
      c('legende', 'varchar(160)', '', 'Légende', null, true),
      c('langue', 'varchar(2)', '', 'Langue', ['mg', 'fr']),
      c('duree_s', 'integer', '', 'Durée pour les vidéos et audios', null, true),
    ],
  },
  {
    id: 'FORMATION',
    label: 'Module de formation',
    domain: 'D3',
    desc: "Formation courte avec quiz et suivi de progression (RF-17).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('titre', 'varchar(160)', '', 'Titre du module'),
      c('description', 'text', '', 'Objectifs pédagogiques'),
      c('duree_min', 'integer', '', 'Durée estimée', null, true),
      c('niveau', 'varchar(16)', '', 'Niveau', ['debutant', 'intermediaire', 'avance']),
      c('statut', 'varchar(16)', '', 'Publication', ['brouillon', 'publie', 'archive']),
    ],
  },
  {
    id: 'QUESTION',
    label: 'Question de quiz',
    domain: 'D3',
    desc: "Question d'évaluation rattachée à un module de formation (RF-17).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('enonce', 'text', '', 'Énoncé bilingue'),
      c('ordre', 'integer', '', 'Ordre dans le quiz'),
      c('points', 'integer', '', 'Barème'),
    ],
  },
  {
    id: 'CHOIX_REPONSE',
    label: 'Choix de réponse',
    domain: 'D3',
    desc: "Proposition de réponse, une seule correcte par question (RF-17).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('libelle', 'varchar(240)', '', 'Texte du choix'),
      c('correcte', 'boolean', '', 'Bonne réponse'),
      c('ordre', 'integer', '', 'Ordre d’affichage'),
    ],
  },
  {
    id: 'INSCRIPTION_FORMATION',
    label: 'Inscription à une formation',
    domain: 'D3',
    desc: "Suivi individuel : progression et score (RF-17).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('date_inscription', 'timestamptz', '', 'Date d’inscription'),
      c('progression_pct', 'integer', '', 'Progression de 0 à 100'),
      c('score', 'integer', '', 'Score du quiz'),
      c('statut', 'varchar(16)', '', 'État', ['inscrit', 'en_cours', 'termine', 'abandonne']),
    ],
  },

  /* ------------------------------ D4 ------------------------------ */
  {
    id: 'ALERTE',
    label: 'Alerte',
    domain: 'D4',
    desc: "Alerte climatique ou sanitaire émise par le BNGRC ou la météo, prioritaire sur tout autre message (RF-20 à RF-23, RG-04).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('type_alerte', 'varchar(24)', '', 'Phénomène', ['cyclone', 'fortes_pluies', 'secheresse', 'ravageurs', 'prix']),
      c('niveau', 'varchar(16)', '', 'Gravité', ['info', 'vigilance', 'alerte', 'urgence']),
      c('titre', 'varchar(160)', '', 'Titre bilingue'),
      c('message_mg', 'text', '', 'Message en malagasy'),
      c('message_fr', 'text', '', 'Message en français'),
      c('consignes_mg', 'text', '', 'Consignes de protection (RF-22)', null, true),
      c('consignes_fr', 'text', '', 'Consignes de protection (RF-22)', null, true),
      c('priorite', 'integer', '', 'Priorité de diffusion (RG-04)'),
      c('date_emission', 'timestamptz', '', 'Début de validité'),
      c('date_fin', 'timestamptz', '', 'Fin de validité', null, true),
      c('statut', 'varchar(16)', '', 'État', ['brouillon', 'emise', 'cloturee']),
    ],
  },
  {
    id: 'CIBLAGE_ALERTE',
    label: "Ciblage d'alerte",
    domain: 'D4',
    desc: "Zones couvertes par une alerte (RF-23) ; une alerte peut viser plusieurs communes.",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
    ],
  },
  {
    id: 'NOTIFICATION',
    label: 'Notification',
    domain: 'D4',
    desc: "Message envoyé à un utilisateur par push, SMS ou USSD, avec accusé de réception (RF-12, RF-21, RF-24).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('canal', 'varchar(8)', '', 'Canal de diffusion', ['push', 'sms', 'ussd']),
      c('titre', 'varchar(160)', '', 'Titre'),
      c('message', 'text', '', 'Contenu envoyé'),
      c('statut', 'varchar(16)', '', 'État de diffusion', ['en_attente', 'envoye', 'echec', 'lu', 'accuse']),
      c('date_envoi', 'timestamptz', '', 'Date d’envoi', null, true),
      c('date_lecture', 'timestamptz', '', 'Date de lecture / d’accusé', null, true),
    ],
  },
  {
    id: 'DONNEE_PLUVIOMETRIQUE',
    label: 'Donnée pluviométrique',
    domain: 'D4',
    desc: "Relevé journalier par zone, base du calcul du déficit de pluie (RF-25).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('date_mesure', 'date', '', 'Jour du relevé'),
      c('pluie_mm', 'numeric(6,1)', '', 'Hauteur de pluie'),
      c('source', 'varchar(60)', '', 'Station ou fournisseur'),
    ],
  },
  {
    id: 'MESSAGE_SENSIBILISATION',
    label: 'Message de sensibilisation',
    domain: 'D4',
    desc: "Message de sensibilisation ciblé par commune ou Fokontany (RF-18).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('titre', 'varchar(160)', '', 'Titre'),
      c('contenu_mg', 'text', '', 'Contenu en malagasy'),
      c('contenu_fr', 'text', '', 'Contenu en français'),
      c('date_debut', 'date', '', 'Début de diffusion'),
      c('date_fin', 'date', '', 'Fin de diffusion'),
      c('statut', 'varchar(16)', '', 'État', ['brouillon', 'actif', 'clos']),
    ],
  },
  {
    id: 'CIBLAGE_MESSAGE',
    label: 'Ciblage de message',
    domain: 'D4',
    desc: "Zones destinataires d'un message de sensibilisation (RF-18).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
    ],
  },

  /* ------------------------------ D5 ------------------------------ */
  {
    id: 'TYPE_MATERIEL',
    label: 'Type de matériel',
    domain: 'D5',
    desc: "Référentiel des équipements : angady, charrue, herse, motoculteur, sarcleuse, faucille, batteuse (RF-06, RF-16, RF-26).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('code', 'varchar(32)', 'UK', 'Code du type'),
      c('libelle', 'varchar(120)', '', 'Libellé'),
      c('categorie', 'varchar(24)', '', 'Étape concernée', ['travail_sol', 'semis', 'repiquage', 'sarclage', 'moisson', 'battage', 'transport']),
      c('description', 'text', '', 'Usage et coût indicatif'),
    ],
  },
  {
    id: 'EQUIPEMENT',
    label: 'Équipement',
    domain: 'D5',
    desc: "Matériel réel mis à disposition par le CFAMA, une coopérative, une ONG ou un Fokontany (RF-26 à RF-29).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('libelle', 'varchar(160)', '', 'Désignation'),
      c('mode', 'varchar(16)', '', 'Modalité de mise à disposition', ['location', 'pret', 'collectif']),
      c('tarif_journalier_mga', 'numeric(10,0)', '', 'Tarif indicatif par jour', null, true),
      c('etat', 'varchar(16)', '', 'Disponibilité', ['disponible', 'reserve', 'maintenance', 'hors_service']),
      c('quantite', 'integer', '', 'Nombre d’unités identiques'),
    ],
  },
  {
    id: 'RESERVATION',
    label: 'Réservation',
    domain: 'D5',
    desc: "Demande de location ou de prêt sur une période, confirmée par le propriétaire (RF-27, RF-28).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('date_debut', 'date', '', 'Début de la période'),
      c('date_fin', 'date', '', 'Fin de la période'),
      c('statut', 'varchar(16)', '', 'État', ['demandee', 'confirmee', 'refusee', 'annulee', 'terminee']),
      c('date_demande', 'timestamptz', '', 'Date de la demande'),
      c('date_reponse', 'timestamptz', '', 'Date de la réponse', null, true),
      c('motif_refus', 'varchar(240)', '', 'Motif éventuel', null, true),
    ],
  },
  {
    id: 'MAINTENANCE',
    label: 'Maintenance',
    domain: 'D5',
    desc: "Suivi de l'état et des interventions sur le matériel (RF-29).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('date_intervention', 'date', '', 'Date prévue ou réalisée'),
      c('type_maintenance', 'varchar(16)', '', 'Nature', ['preventive', 'corrective']),
      c('cout_mga', 'numeric(10,0)', '', 'Coût de l’intervention', null, true),
      c('description', 'text', '', 'Travaux réalisés', null, true),
      c('statut', 'varchar(16)', '', 'État', ['planifiee', 'en_cours', 'terminee']),
    ],
  },

  /* ------------------------------ D6 ------------------------------ */
  {
    id: 'GCV',
    label: 'Grenier communautaire (GCV)',
    domain: 'D6',
    desc: "Grenier Commun Villageois : membres, dépôts, retraits et valeur du stock (RF-31).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('nom', 'varchar(160)', '', 'Nom du grenier'),
      c('capacite_t', 'numeric(8,2)', '', 'Capacité de stockage (tonnes)', null, true),
      c('reglement', 'text', '', 'Règles de fonctionnement et de décision collective'),
      c('date_ouverture', 'date', '', 'Date d’ouverture', null, true),
      c('statut', 'varchar(16)', '', 'État', ['ouvert', 'suspendu', 'ferme']),
    ],
  },
  {
    id: 'MEMBRE_GCV',
    label: 'Membre de GCV',
    domain: 'D6',
    desc: "Adhésion d'une exploitation à un grenier, avec rôle interne (RF-31).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('role_membre', 'varchar(24)', '', 'Fonction dans le grenier', ['membre', 'tresorier', 'president']),
      c('date_adhesion', 'date', '', 'Date d’adhésion'),
      c('statut', 'varchar(16)', '', 'État', ['actif', 'sorti']),
    ],
  },
  {
    id: 'DECISION_COLLECTIVE',
    label: 'Décision collective',
    domain: 'D6',
    desc: "Décision de l'assemblée du grenier autorisant un retrait ou une mise en garantie (RG-06).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('objet', 'varchar(160)', '', 'Objet de la décision'),
      c('date_decision', 'date', '', 'Date de l’assemblée'),
      c('quorum_pct', 'integer', '', 'Quorum atteint', null, true),
      c('proces_verbal', 'text', '', 'Compte rendu', null, true),
    ],
  },
  {
    id: 'MOUVEMENT_STOCK',
    label: 'Mouvement de stock',
    domain: 'D6',
    desc: "Dépôt ou retrait de paddy, avec reçu numérique et décision collective éventuelle (RF-31, RF-32, RG-06).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('type_mouvement', 'varchar(8)', '', 'Sens du mouvement', ['depot', 'retrait']),
      c('quantite_kg', 'numeric(10,2)', '', 'Poids de paddy'),
      c('qualite', 'varchar(16)', '', 'Qualité constatée', ['bonne', 'moyenne', 'faible'], true),
      c('date_mouvement', 'timestamptz', '', 'Horodatage'),
    ],
  },
  {
    id: 'RECU',
    label: 'Reçu numérique',
    domain: 'D6',
    desc: "Reçu remis pour chaque dépôt ou retrait (RF-32), numéro unique et PDF archivable.",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('numero', 'varchar(24)', 'UK', 'Numéro de reçu'),
      c('date_emission', 'timestamptz', '', 'Date d’émission'),
      c('url_pdf', 'text', '', 'Document généré', null, true),
    ],
  },
  {
    id: 'DEMANDE_CREDIT',
    label: 'Demande de crédit',
    domain: 'D6',
    desc: "Dossier de crédit de campagne déposé auprès d'une IMF, avec le stock comme garantie (RF-33).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('montant_demande_mga', 'numeric(12,0)', '', 'Montant sollicité'),
      c('montant_accorde_mga', 'numeric(12,0)', '', 'Montant accordé', null, true),
      c('objet', 'varchar(160)', '', 'Semences, main-d’œuvre, location…', null, true),
      c('statut', 'varchar(16)', '', 'Avancement', ['soumise', 'etude', 'accordee', 'refusee', 'decaissee', 'remboursee']),
      c('date_demande', 'date', '', 'Date de dépôt'),
      c('date_decision', 'date', '', 'Date de décision', null, true),
    ],
  },
  {
    id: 'GARANTIE_STOCK',
    label: 'Garantie en stock',
    domain: 'D6',
    desc: "Stock de paddy affecté en garantie d'un crédit (RF-33), valorisé au prix du marché.",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('quantite_kg', 'numeric(10,2)', '', 'Quantité nantie'),
      c('valeur_mga', 'numeric(12,0)', '', 'Valorisation retenue'),
    ],
  },
  {
    id: 'PRIX_MARCHE',
    label: 'Prix du marché',
    domain: 'D6',
    desc: "Relevé de prix du riz par marché et par variété (RF-34, RF-35).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('date_releve', 'date', '', 'Date du relevé'),
      c('prix_kg_mga', 'numeric(8,0)', '', 'Prix au kilo'),
      c('marche', 'varchar(120)', '', 'Marché ou lieu de vente'),
      c('source', 'varchar(60)', '', 'Source du relevé'),
    ],
  },

  /* ------------------------------ D7 ------------------------------ */
  {
    id: 'SINISTRE',
    label: 'Sinistre',
    domain: 'D7',
    desc: "Déclaration d'inondation, cyclone, sécheresse ou ravageurs avec photo et position (RF-42, RF-43).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('type_sinistre', 'varchar(16)', '', 'Nature', ['inondation', 'cyclone', 'secheresse', 'ravageurs']),
      c('date_survenance', 'date', '', 'Date du phénomène'),
      c('superficie_touchee_ha', 'numeric(6,2)', '', 'Superficie impactée'),
      c('description', 'text', '', 'Description des dégâts', null, true),
      c('latitude', 'numeric(9,6)', '', 'Position GPS', null, true),
      c('longitude', 'numeric(9,6)', '', 'Position GPS', null, true),
      c('statut', 'varchar(16)', '', 'Traitement', ['signale', 'transmis', 'en_traitement', 'cloture']),
      c('date_transmission', 'timestamptz', '', 'Transmission au BNGRC'),
    ],
  },
  {
    id: 'PHOTO_SINISTRE',
    label: 'Photo de sinistre',
    domain: 'D7',
    desc: "Preuve photographique d'un sinistre (RF-42), collectée même hors ligne puis synchronisée.",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('url', 'text', '', 'Fichier stocké'),
      c('date_prise', 'timestamptz', '', 'Date de prise de vue'),
    ],
  },
  {
    id: 'INFRASTRUCTURE',
    label: 'Ouvrage hydraulique',
    domain: 'D7',
    desc: "Digue, barrage ou canal d'irrigation à entretenir (RF-44, RF-45).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('nom', 'varchar(160)', '', 'Nom de l’ouvrage'),
      c('type_infrastructure', 'varchar(16)', '', 'Type', ['digue', 'barrage', 'canal']),
      c('longueur_m', 'numeric(8,1)', '', 'Linéaire', null, true),
      c('etat', 'varchar(16)', '', 'État constaté', ['bon', 'degrade', 'hors_service']),
      c('latitude', 'numeric(9,6)', '', 'Position GPS', null, true),
      c('longitude', 'numeric(9,6)', '', 'Position GPS', null, true),
    ],
  },
  {
    id: 'SIGNALEMENT_INFRA',
    label: 'Signalement d’ouvrage',
    domain: 'D7',
    desc: "Signalement d'une infrastructure à réparer, suivi jusqu'à la réparation (RF-44).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('description', 'text', '', 'Désordre constaté'),
      c('gravite', 'varchar(16)', '', 'Gravité', ['faible', 'moyenne', 'forte']),
      c('statut', 'varchar(16)', '', 'Traitement', ['nouveau', 'transmis', 'en_reparation', 'repare']),
      c('date_signalement', 'timestamptz', '', 'Date du signalement'),
      c('date_traitement', 'timestamptz', '', 'Date de clôture', null, true),
      c('url_photo', 'text', '', 'Photo jointe', null, true),
    ],
  },
  {
    id: 'RAPPORT_VISITE',
    label: 'Rapport de visite',
    domain: 'D7',
    desc: "Compte rendu de la visite d'un agent de terrain : exploitants rencontrés, conseils donnés (RF-41).",
    attrs: [
      c('id', 'uuid', 'PK', 'Identifiant technique'),
      c('date_visite', 'date', '', 'Date de la visite'),
      c('duree_min', 'integer', '', 'Durée', null, true),
      c('conseils', 'text', '', 'Conseils et observations'),
      c('nb_exploitants', 'integer', '', 'Nombre d’exploitants rencontrés', null, true),
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Associations du MCD                                                 */
/* ------------------------------------------------------------------ */

export const associations = [
  /* D1 */
  r('A01', 'ZONE', 'ZONE', '0,n', '0,1', 'CONTIENT', 'parent_id', 'b', 'Hiérarchie administrative réflexive'),
  r('A02', 'ORGANISATION', 'ZONE', '0,n', '0,1', 'SIÈGE_DANS', 'zone_id', 'a', 'Rattachement géographique'),
  r('A03', 'UTILISATEUR', 'ZONE', '0,n', '1,1', 'RÉSIDE', 'zone_id', 'a', 'RF-03'),
  r('A04', 'UTILISATEUR', 'ORGANISATION', '0,n', '0,1', 'TRAVAILLE_POUR', 'organisation_id', 'a', 'Agents, IMF, MAEP, BNGRC'),
  r('A05', 'UTILISATEUR', 'UTILISATEUR_ROLE', '0,n', '1,1', 'POSSÈDE', 'utilisateur_id', 'b', 'RF-02'),
  r('A06', 'ROLE', 'UTILISATEUR_ROLE', '0,n', '1,1', 'EST_TITULAIRE_DE', 'role_id', 'b', 'RF-02'),
  r('A07', 'UTILISATEUR', 'APPAREIL', '0,n', '1,1', 'UTILISE', 'utilisateur_id', 'b', 'RF-46'),
  r('A08', 'UTILISATEUR', 'JOURNAL_AUDIT', '0,n', '0,1', 'GÉNÈRE', 'utilisateur_id', 'b', 'RF-49'),
  r('A09', 'UTILISATEUR', 'PARAMETRE', '0,n', '0,1', 'MODIFIE', 'modifie_par_id', 'b', 'RF-50'),
  r('A10', 'ZONE', 'SEUIL_ALERTE', '0,n', '1,1', 'DISPOSE_DE', 'zone_id', 'b', 'RF-25'),
  r('A11', 'ORGANISATION', 'GCV', '0,n', '0,1', 'GÈRE', 'organisation_id', 'b', 'Coopérative de tutelle'),
  r('A12', 'UTILISATEUR', 'GCV', '0,n', '1,1', 'RESPONSABLE_DE', 'responsable_id', 'b', 'RF-31'),
  r('A13', 'ZONE', 'GCV', '0,n', '1,1', 'ABRITE', 'zone_id', 'b', 'RF-31'),

  /* D2 */
  r('A14', 'UTILISATEUR', 'EXPLOITATION', '0,n', '1,1', 'DÉTIENT', 'proprietaire_id', 'b', 'RF-05'),
  r('A15', 'ZONE', 'EXPLOITATION', '0,n', '1,1', 'SITUE', 'zone_id', 'b', 'Fokontany de l’exploitation'),
  r('A16', 'EXPLOITATION', 'PARCELLE', '0,n', '1,1', 'COMPORTE', 'exploitation_id', 'b', 'RF-05'),
  r('A17', 'ZONE', 'CAMPAGNE', '0,n', '0,1', 'CONCERNE', 'zone_id', 'b', 'Campagne régionale'),
  r('A18', 'CAMPAGNE', 'CYCLE_CULTURAL', '0,n', '1,1', 'ORGANISE', 'campagne_id', 'b', 'RF-07'),
  r('A19', 'PARCELLE', 'CYCLE_CULTURAL', '0,n', '1,1', 'SUPPORTE', 'parcelle_id', 'b', 'RG-01'),
  r('A20', 'VARIETE', 'CYCLE_CULTURAL', '0,n', '1,1', 'CARACTÉRISE', 'variete_id', 'b', 'RF-07'),
  r('A21', 'CYCLE_CULTURAL', 'ETAPE_PLANIFIEE', '0,n', '1,1', 'PLANIFIE', 'cycle_id', 'b', 'RF-09'),
  r('A22', 'ETAPE_CULTURELLE', 'ETAPE_PLANIFIEE', '0,n', '1,1', 'INSTANCIE', 'etape_code', 'b', 'Référentiel des étapes'),
  r('A23', 'ETAPE_PLANIFIEE', 'DECALAGE', '0,n', '1,1', 'FAIT_L_OBJET_DE', 'etape_planifiee_id', 'b', 'RF-11'),
  r('A24', 'UTILISATEUR', 'DECALAGE', '0,n', '0,1', 'VALIDE', 'valide_par_id', 'b', 'RG-05'),
  r('A25', 'CYCLE_CULTURAL', 'RECOLTE', '0,1', '1,1', 'PRODUIT', 'cycle_id', 'b', 'RF-37'),
  r('A26', 'UTILISATEUR', 'RECOLTE', '0,n', '1,1', 'DÉCLARE', 'declare_par_id', 'b', 'RF-37'),
  r('A27', 'EXPLOITATION', 'POSSESSION_MATERIEL', '0,n', '1,1', 'DÉCLARE', 'exploitation_id', 'b', 'RF-06'),
  r('A28', 'TYPE_MATERIEL', 'POSSESSION_MATERIEL', '0,n', '1,1', 'CONCERNE', 'type_materiel_id', 'b', 'RF-06'),

  /* D3 */
  r('A29', 'ETAPE_CULTURELLE', 'FICHE_TECHNIQUE', '0,n', '1,1', 'DOCUMENTE', 'etape_code', 'b', 'RF-14'),
  r('A30', 'FICHE_TECHNIQUE', 'MEDIA', '0,n', '1,1', 'ILLUSTRE', 'fiche_id', 'b', 'RF-15'),
  r('A31', 'FICHE_TECHNIQUE', 'FORMATION', '0,1', '0,n', 'ACCOMPAGNE', 'fiche_id', 'b', 'RF-17'),
  r('A32', 'FORMATION', 'QUESTION', '0,n', '1,1', 'ÉVALUE', 'formation_id', 'b', 'RF-17'),
  r('A33', 'QUESTION', 'CHOIX_REPONSE', '0,n', '1,1', 'PROPOSE', 'question_id', 'b', 'RF-17'),
  r('A34', 'UTILISATEUR', 'INSCRIPTION_FORMATION', '0,n', '1,1', 'SUIT', 'utilisateur_id', 'b', 'RF-17'),
  r('A35', 'FORMATION', 'INSCRIPTION_FORMATION', '0,n', '1,1', 'ACCUEILLE', 'formation_id', 'b', 'RF-17'),
  r('A36', 'UTILISATEUR', 'FICHE_TECHNIQUE', '0,n', '0,1', 'RÉDIGE', 'auteur_id', 'b', 'RF-47'),

  /* D4 */
  r('A37', 'UTILISATEUR', 'ALERTE', '0,n', '0,1', 'ÉMET', 'emetteur_id', 'b', 'RF-23'),
  r('A38', 'ALERTE', 'CIBLAGE_ALERTE', '0,n', '1,1', 'VISE', 'alerte_id', 'b', 'RF-23'),
  r('A39', 'ZONE', 'CIBLAGE_ALERTE', '0,n', '1,1', 'EST_CIBLEE', 'zone_id', 'b', 'RF-23'),
  r('A40', 'ALERTE', 'NOTIFICATION', '0,n', '0,1', 'DÉCLENCHE', 'alerte_id', 'b', 'RG-04'),
  r('A41', 'UTILISATEUR', 'NOTIFICATION', '0,n', '1,1', 'REÇOIT', 'utilisateur_id', 'b', 'RF-21'),
  r('A42', 'ETAPE_PLANIFIEE', 'NOTIFICATION', '0,n', '0,1', 'RAPPELLE', 'etape_planifiee_id', 'b', 'RF-12'),
  r('A43', 'ZONE', 'DONNEE_PLUVIOMETRIQUE', '0,n', '1,1', 'MESURE', 'zone_id', 'b', 'RF-25'),
  r('A44', 'UTILISATEUR', 'MESSAGE_SENSIBILISATION', '0,n', '0,1', 'PUBLIE', 'auteur_id', 'b', 'RF-18'),
  r('A45', 'MESSAGE_SENSIBILISATION', 'CIBLAGE_MESSAGE', '0,n', '1,1', 'VISE', 'message_id', 'b', 'RF-18'),
  r('A46', 'ZONE', 'CIBLAGE_MESSAGE', '0,n', '1,1', 'EST_DESTINATAIRE', 'zone_id', 'b', 'RF-18'),
  r('A47', 'ZONE', 'PRIX_MARCHE', '0,n', '1,1', 'PUBLIE', 'zone_id', 'b', 'RF-34'),
  r('A48', 'VARIETE', 'PRIX_MARCHE', '0,n', '1,1', 'COTE', 'variete_id', 'b', 'RF-34'),
  r('A49', 'CAMPAGNE', 'PRIX_MARCHE', '0,n', '1,1', 'SITUE', 'campagne_id', 'b', 'RF-34'),

  /* D5 */
  r('A50', 'TYPE_MATERIEL', 'EQUIPEMENT', '0,n', '1,1', 'TYPOLOGIE', 'type_materiel_id', 'b', 'RF-26'),
  r('A51', 'ORGANISATION', 'EQUIPEMENT', '0,n', '0,1', 'PROPOSE', 'proprietaire_org_id', 'b', 'RF-26'),
  r('A52', 'ZONE', 'EQUIPEMENT', '0,n', '1,1', 'LOCALISE', 'zone_id', 'b', 'RF-26'),
  r('A53', 'EQUIPEMENT', 'RESERVATION', '0,n', '1,1', 'EST_RÉSERVÉ', 'equipement_id', 'b', 'RF-27'),
  r('A54', 'UTILISATEUR', 'RESERVATION', '0,n', '1,1', 'DEMANDE', 'demandeur_id', 'b', 'RF-27'),
  r('A55', 'EQUIPEMENT', 'MAINTENANCE', '0,n', '1,1', 'SUBIT', 'equipement_id', 'b', 'RF-29'),

  /* D6 */
  r('A56', 'EXPLOITATION', 'MEMBRE_GCV', '0,n', '1,1', 'ADHÈRE', 'exploitation_id', 'b', 'RF-31'),
  r('A57', 'GCV', 'MEMBRE_GCV', '0,n', '1,1', 'COMPTE', 'gcv_id', 'b', 'RF-31'),
  r('A58', 'MEMBRE_GCV', 'MOUVEMENT_STOCK', '0,n', '1,1', 'EFFECTUE', 'membre_id', 'b', 'RF-32'),
  r('A59', 'MOUVEMENT_STOCK', 'RECU', '0,1', '1,1', 'JUSTIFIE', 'mouvement_id', 'b', 'RF-32'),
  r('A60', 'UTILISATEUR', 'MOUVEMENT_STOCK', '0,n', '1,1', 'ENREGISTRE', 'enregistre_par_id', 'b', 'RF-32'),
  r('A61', 'DECISION_COLLECTIVE', 'MOUVEMENT_STOCK', '0,n', '0,1', 'AUTORISE', 'decision_id', 'b', 'RG-06'),
  r('A62', 'GCV', 'DECISION_COLLECTIVE', '0,n', '1,1', 'TIENT', 'gcv_id', 'b', 'RG-06'),
  r('A63', 'UTILISATEUR', 'DECISION_COLLECTIVE', '0,n', '1,1', 'SECRÈTE', 'secretaire_id', 'b', 'RF-31'),
  r('A64', 'EXPLOITATION', 'DEMANDE_CREDIT', '0,n', '1,1', 'SOLLICITE', 'exploitation_id', 'b', 'RF-33'),
  r('A65', 'ORGANISATION', 'DEMANDE_CREDIT', '0,n', '1,1', 'INSTRUIT', 'imf_organisation_id', 'b', 'RF-33'),
  r('A66', 'CAMPAGNE', 'DEMANDE_CREDIT', '0,n', '1,1', 'FINANCE', 'campagne_id', 'b', 'RF-33'),
  r('A67', 'UTILISATEUR', 'DEMANDE_CREDIT', '0,n', '0,1', 'SUIT', 'instructeur_id', 'b', 'RF-33'),
  r('A68', 'DEMANDE_CREDIT', 'GARANTIE_STOCK', '0,n', '1,1', 'EST_GARANTIE_PAR', 'demande_credit_id', 'b', 'RF-33'),
  r('A69', 'GCV', 'GARANTIE_STOCK', '0,n', '1,1', 'NANTIT', 'gcv_id', 'b', 'RF-33'),

  /* D7 */
  r('A70', 'PARCELLE', 'SINISTRE', '0,n', '1,1', 'SUBIT', 'parcelle_id', 'b', 'RF-42'),
  r('A71', 'ALERTE', 'SINISTRE', '0,n', '0,1', 'PROVOQUE', 'alerte_id', 'b', 'RF-42'),
  r('A72', 'UTILISATEUR', 'SINISTRE', '0,n', '1,1', 'SIGNALE', 'declarant_id', 'b', 'RF-42'),
  r('A73', 'SINISTRE', 'PHOTO_SINISTRE', '0,n', '1,1', 'CONTIENT', 'sinistre_id', 'b', 'RF-42'),
  r('A74', 'ZONE', 'INFRASTRUCTURE', '0,n', '1,1', 'SITUE', 'zone_id', 'b', 'RF-44'),
  r('A75', 'INFRASTRUCTURE', 'SIGNALEMENT_INFRA', '0,n', '1,1', 'FAIT_L_OBJET_DE', 'infrastructure_id', 'b', 'RF-44'),
  r('A76', 'UTILISATEUR', 'SIGNALEMENT_INFRA', '0,n', '1,1', 'ÉMET', 'auteur_id', 'b', 'RF-44'),
  r('A77', 'UTILISATEUR', 'RAPPORT_VISITE', '0,n', '1,1', 'RÉDIGE', 'agent_id', 'b', 'RF-41'),
  r('A78', 'EXPLOITATION', 'RAPPORT_VISITE', '0,n', '1,1', 'CONCERNE', 'exploitation_id', 'b', 'RF-41'),
  r('A79', 'APPAREIL', 'SYNCHRONISATION', '0,n', '1,1', 'DÉCLENCHE', 'appareil_id', 'b', 'RF-46'),
];

/* ------------------------------------------------------------------ */
/* Vue logique : colonnes calculées et vues SQL                        */
/* ------------------------------------------------------------------ */

export const vues = [
  {
    nom: 'v_stock_gcv',
    but: 'Stock de paddy par grenier, membre et qualité : Σ dépôts − Σ retraits (RF-31, RF-32).',
    sql: `CREATE VIEW v_stock_gcv AS
SELECT  m.gcv_id,
        s.membre_id,
        s.qualite,
        SUM(CASE WHEN s.type_mouvement = 'depot' THEN s.quantite_kg ELSE -s.quantite_kg END) AS stock_kg,
        SUM(CASE WHEN s.type_mouvement = 'depot' THEN s.quantite_kg ELSE -s.quantite_kg END) * 1000 AS stock_valeur_mga
FROM    mouvement_stock s
JOIN    membre_gcv m ON m.id = s.membre_id
GROUP BY m.gcv_id, s.membre_id, s.qualite;`,
  },
  {
    nom: 'v_indicateur_pluie',
    but: 'Cumuls de pluie à 10 et 20 jours et déficit par rapport au seuil de la zone (RF-25).',
    sql: `CREATE VIEW v_indicateur_pluie AS
SELECT  p.zone_id,
        CURRENT_DATE                                   AS date_calcul,
        SUM(p.pluie_mm) FILTER (WHERE p.date_mesure > CURRENT_DATE - 10) AS cumul_10j_mm,
        SUM(p.pluie_mm) FILTER (WHERE p.date_mesure > CURRENT_DATE - 20) AS cumul_20j_mm,
        s.cumul_10j_mm                                 AS seuil_10j_mm,
        s.cumul_20j_mm                                 AS seuil_20j_mm,
        ROUND(100 * (1 - COALESCE(SUM(p.pluie_mm) FILTER (WHERE p.date_mesure > CURRENT_DATE - 20), 0)
            / NULLIF(s.cumul_20j_mm, 0)), 1)           AS deficit_20j_pct
FROM    zone z
LEFT JOIN donnee_pluviometrique p ON p.zone_id = z.id
LEFT JOIN seuil_alerte s ON s.zone_id = z.id AND s.type_alerte = 'secheresse' AND s.actif
GROUP BY p.zone_id, z.id, s.cumul_10j_mm, s.cumul_20j_mm;`,
  },
  {
    nom: 'v_rendement_parcelle',
    but: 'Rendement en t/ha par parcelle et campagne, comparable au matériel déclaré (RF-37, RF-39).',
    sql: `CREATE VIEW v_rendement_parcelle AS
SELECT  pa.id            AS parcelle_id,
        pa.exploitation_id,
        cy.campagne_id,
        cy.variete_id,
        pa.superficie_ha,
        r.quantite_paddy_kg,
        ROUND(r.quantite_paddy_kg / 1000 / NULLIF(pa.superficie_ha, 0), 2) AS rendement_t_ha
FROM    parcelle pa
JOIN    cycle_cultural cy ON cy.parcelle_id = pa.id
LEFT JOIN recolte r ON r.cycle_id = cy.id;`,
  },
  {
    nom: 'v_disponibilite_materiel',
    but: 'Équipements réellement disponibles à une date donnée, réservations confirmées déduites (RF-26, RF-27).',
    sql: `CREATE VIEW v_disponibilite_materiel AS
SELECT  e.id,
        e.libelle,
        e.zone_id,
        e.quantite - COALESCE((
          SELECT COUNT(*) FROM reservation r
          WHERE r.equipement_id = e.id
            AND r.statut IN ('demandee', 'confirmee')
            AND CURRENT_DATE BETWEEN r.date_debut AND r.date_fin
        ), 0) AS quantite_disponible
FROM    equipement e
WHERE   e.etat = 'disponible';`,
  },
  {
    nom: 'v_tableau_bord_zone',
    but: 'Indicateurs agrégés par région/district pour le MAEP et le BNGRC (RF-38, RF-40, RG-07).',
    sql: `CREATE MATERIALIZED VIEW v_tableau_bord_zone AS
SELECT  z.id AS zone_id, z.code, z.nom, z.type_zone, c.id AS campagne_id,
        COUNT(DISTINCT pa.id)                 AS nb_parcelles,
        SUM(pa.superficie_ha)                 AS superficie_ha,
        SUM(r.quantite_paddy_kg) / 1000       AS production_t,
        ROUND(AVG(rp.rendement_t_ha), 2)      AS rendement_moyen_t_ha,
        COUNT(DISTINCT si.id)                 AS nb_sinistres
FROM    zone z
LEFT JOIN exploitation e ON e.zone_id = z.id
LEFT JOIN parcelle pa ON pa.exploitation_id = e.id
LEFT JOIN cycle_cultural cy ON cy.parcelle_id = pa.id
LEFT JOIN campagne c ON c.id = cy.campagne_id
LEFT JOIN recolte r ON r.cycle_id = cy.id
LEFT JOIN v_rendement_parcelle rp ON rp.parcelle_id = pa.id
LEFT JOIN sinistre si ON si.parcelle_id = pa.id
GROUP BY z.id, z.code, z.nom, z.type_zone, c.id;`,
  },
];

/* ------------------------------------------------------------------ */
/* Performance : index secondaires, stockage, vue matérialisée         */
/* ------------------------------------------------------------------ */

const ix = (name, table, cols, opts = {}) => ({ name, table, cols, method: 'btree', ...opts });

/*
 * Index secondaires. Chaque entrée répond à un écran ou à un traitement du cahier
 * des charges ; les index de clés étrangères déjà générés ne sont pas répétés quand
 * un index ci-dessous commence par la même colonne (« préfixe gauche »).
 *
 * opts :
 *   method  btree (défaut) | gist | gin | brin
 *   unique  contrainte d'unicité portée par l'index
 *   where   index partiel (ne couvre alors pas les contrôles de clé étrangère)
 *   include colonnes ajoutées en INCLUDE (balayage d'index seul)
 *   opclass classe d'opérateurs, une par colonne si tableau
 */
export const perfIndexes = [
  /* D1 — comptes, ciblage, audit */
  ix('idx_utilisateur_actif_zone', 'UTILISATEUR', ['zone_id'], {
    include: ['telephone'],
    where: "statut = 'actif'",
    why: 'Liste des destinataires d’une alerte par zone, sans lecture de la table (RF-23, RG-04).',
  }),
  ix('idx_utilisateur_role_actif', 'UTILISATEUR_ROLE', ['utilisateur_id', 'role_id'], {
    unique: true,
    where: 'actif',
    why: 'Un seul rôle actif par couple utilisateur/rôle ; contrôle des droits en une lecture (RF-02, RG-07).',
  }),
  ix('idx_seuil_alerte_actif', 'SEUIL_ALERTE', ['zone_id', 'type_alerte'], {
    unique: true,
    where: 'actif',
    why: 'Un seul seuil actif par zone et type (RF-50) ; lu par v_indicateur_pluie.',
  }),
  ix('idx_journal_audit_entite', 'JOURNAL_AUDIT', ['entite', 'entite_id', 'date_action DESC'], {
    why: 'Historique d’un objet précis, du plus récent au plus ancien (RF-49).',
  }),
  ix('idx_journal_audit_date', 'JOURNAL_AUDIT', ['date_action'], {
    method: 'brin',
    why: 'Table append-only : BRIN tient en quelques pages et sert les purges et extractions par période.',
  }),

  /* D2 — exploitations, calendrier */
  ix('idx_exploitation_zone', 'EXPLOITATION', ['zone_id', 'statut'], {
    why: 'Tableaux de bord et ciblage par zone (RF-05, RF-38).',
  }),
  ix('idx_parcelle_exploitation', 'PARCELLE', ['exploitation_id', 'statut'], {
    include: ['superficie_ha'],
    why: 'Liste et somme des surfaces d’une exploitation sans lire la table (RF-05, RF-37).',
  }),
  ix('idx_parcelle_geometrie', 'PARCELLE', ['geometrie'], {
    method: 'gist',
    where: 'geometrie IS NOT NULL',
    why: 'Intersection parcelle / zone sinistrée et cartographie (RF-08, RF-45).',
  }),
  ix('idx_cycle_cultural_parcelle', 'CYCLE_CULTURAL', ['parcelle_id', 'campagne_id'], {
    why: 'Calendrier d’une parcelle pour une campagne (RF-09, RG-01).',
  }),
  ix('idx_etape_planifiee_cycle', 'ETAPE_PLANIFIEE', ['cycle_id', 'date_prevue'], {
    why: 'Étapes d’un cycle dans l’ordre chronologique (RF-09, RF-12).',
  }),
  ix('idx_etape_planifiee_rappels', 'ETAPE_PLANIFIEE', ['date_prevue'], {
    include: ['cycle_id', 'etape_code'],
    where: "statut = 'prevue'",
    why: 'Rappels du jour : l’index ne contient que les étapes à venir (RF-12).',
  }),
  ix('idx_decalage_a_valider', 'DECALAGE', ['statut', 'date_proposee'], {
    where: "statut = 'propose'",
    why: 'File des décalages en attente de validation (RF-11, RG-05).',
  }),
  ix('idx_recolte_cycle_date', 'RECOLTE', ['cycle_id', 'date_recolte DESC'], {
    why: 'Dernière récolte d’un cycle, rendement et historique (RF-37).',
  }),
  ix('idx_possession_exploitation', 'POSSESSION_MATERIEL', ['exploitation_id', 'type_materiel_id'], {
    why: 'Matériel déclaré par une exploitation, utilisé pour les conseils (RF-06, RF-39).',
  }),

  /* D3 — bibliothèque et formation */
  ix('idx_fiche_technique_etape', 'FICHE_TECHNIQUE', ['etape_code', 'statut', 'date_publication DESC'], {
    why: 'Fiches publiées d’une étape culturale, les plus récentes d’abord (RF-14).',
  }),
  ix('idx_fiche_technique_recherche', 'FICHE_TECHNIQUE', ['titre_fr', 'resume_fr'], {
    method: 'gin',
    opclass: 'gin_trgm_ops',
    why: 'Recherche libre (ILIKE « %mot% ») dans les fiches sans parcours complet (RF-14).',
  }),
  ix('idx_media_fiche', 'MEDIA', ['fiche_id', 'type_media'], {
    why: 'Illustrations, vidéos et audios d’une fiche par type (RF-15).',
  }),
  ix('idx_inscription_utilisateur', 'INSCRIPTION_FORMATION', ['utilisateur_id', 'statut'], {
    why: 'Progression d’un apprenant dans ses formations (RF-17).',
  }),
  ix('idx_inscription_unique', 'INSCRIPTION_FORMATION', ['utilisateur_id', 'formation_id'], {
    unique: true,
    why: 'Une seule inscription par utilisateur et par formation (RF-17).',
  }),

  /* D4 — alertes, notifications, pluie */
  ix('idx_alerte_emise', 'ALERTE', ['date_emission DESC'], {
    where: "statut = 'emise'",
    why: 'Bandeau des alertes en cours, les plus récentes d’abord (RF-20, RG-04).',
  }),
  ix('idx_ciblage_alerte_unique', 'CIBLAGE_ALERTE', ['alerte_id', 'zone_id'], {
    unique: true,
    why: 'Évite de diffuser deux fois la même alerte dans la même zone (RF-23, RG-04).',
  }),
  ix('idx_ciblage_message_unique', 'CIBLAGE_MESSAGE', ['message_id', 'zone_id'], {
    unique: true,
    why: 'Évite les doublons de ciblage d’un message (RF-18).',
  }),
  ix('idx_notification_utilisateur', 'NOTIFICATION', ['utilisateur_id', 'date_envoi DESC'], {
    why: 'Boîte de réception d’un utilisateur, la plus récente d’abord (RF-21, RF-24).',
  }),
  ix('idx_notification_a_envoyer', 'NOTIFICATION', ['date_envoi'], {
    include: ['utilisateur_id', 'canal', 'alerte_id'],
    where: "statut IN ('en_attente', 'echec')",
    why: 'File d’envoi : ne stocke que les messages à traiter, balayage d’index seul (RF-21, RF-24).',
  }),
  ix('idx_notification_non_lues', 'NOTIFICATION', ['utilisateur_id'], {
    include: ['date_envoi'],
    where: 'date_lecture IS NULL',
    why: 'Compteur de messages non lus, sans lire l’historique complet (RF-24).',
  }),
  ix('idx_notification_alerte', 'NOTIFICATION', ['alerte_id', 'statut'], {
    why: 'Suivi de la diffusion d’une alerte (envoyés, échecs) (RG-04).',
  }),
  ix('idx_pluie_zone_date_source', 'DONNEE_PLUVIOMETRIQUE', ['zone_id', 'date_mesure DESC', 'source'], {
    unique: true,
    why: 'Cumuls à 10 et 20 jours par zone (v_indicateur_pluie) et rejet des imports en double (RF-25).',
  }),

  /* D5 — matériel */
  ix('idx_equipement_disponible', 'EQUIPEMENT', ['zone_id', 'type_materiel_id'], {
    include: ['quantite', 'tarif_journalier_mga'],
    where: "etat = 'disponible'",
    why: 'Recherche d’un matériel disponible dans une zone (v_disponibilite_materiel, RF-26, RF-27).',
  }),
  ix('idx_reservation_periode', 'RESERVATION', ['equipement_id', 'date_debut', 'date_fin'], {
    include: ['statut'],
    why: 'Détection des chevauchements de réservation et calcul de disponibilité (RF-27).',
  }),
  ix('idx_reservation_demandeur', 'RESERVATION', ['demandeur_id', 'statut'], {
    why: 'Suivi des demandes d’un exploitant (RF-28).',
  }),
  ix('idx_maintenance_equipement', 'MAINTENANCE', ['equipement_id', 'date_intervention DESC'], {
    why: 'Dernière maintenance et coût par équipement (RF-29).',
  }),

  /* D6 — GCV, stocks, financement */
  ix('idx_membre_gcv_gcv', 'MEMBRE_GCV', ['gcv_id', 'statut'], {
    why: 'Membres actifs d’un grenier (RF-31, RF-32).',
  }),
  ix('idx_membre_gcv_exploitation', 'MEMBRE_GCV', ['exploitation_id', 'statut'], {
    why: 'Greniers fréquentés par une exploitation (RF-32).',
  }),
  ix('idx_mouvement_stock_membre', 'MOUVEMENT_STOCK', ['membre_id', 'qualite'], {
    include: ['type_mouvement', 'quantite_kg'],
    why: 'Agrégat de v_stock_gcv calculé par balayage d’index seul, sans lire la table (RF-31).',
  }),
  ix('idx_mouvement_stock_date', 'MOUVEMENT_STOCK', ['date_mouvement'], {
    method: 'brin',
    why: 'Journal append-only : BRIN pour les états et purges par période (RF-31, RF-32).',
  }),
  ix('idx_decision_collective_gcv', 'DECISION_COLLECTIVE', ['gcv_id', 'date_decision DESC'], {
    why: 'Dernières décisions d’un grenier, préalables à un retrait (RF-34, RG-06).',
  }),
  ix('idx_recu_mouvement', 'RECU', ['mouvement_id'], {
    unique: true,
    why: 'Un seul reçu par mouvement (association 1,1 A59, RF-32).',
  }),
  ix('idx_demande_credit_file', 'DEMANDE_CREDIT', ['statut', 'date_demande'], {
    where: "statut IN ('soumise', 'etude')",
    why: 'File d’instruction des demandes de crédit (RF-33).',
  }),
  ix('idx_demande_credit_exploitation', 'DEMANDE_CREDIT', ['exploitation_id', 'campagne_id'], {
    why: 'Crédits d’une exploitation pour une campagne (RF-33, RF-36).',
  }),
  ix('idx_prix_marche_lookup', 'PRIX_MARCHE', ['zone_id', 'variete_id', 'date_releve DESC'], {
    why: 'Dernier prix connu par zone et variété (RF-35).',
  }),

  /* D7 — sinistres, infrastructures, visites */
  ix('idx_sinistre_statut', 'SINISTRE', ['statut', 'date_survenance DESC'], {
    why: 'File de traitement BNGRC, du sinistre le plus récent au plus ancien (RF-43).',
  }),
  ix('idx_sinistre_parcelle', 'SINISTRE', ['parcelle_id', 'date_survenance DESC'], {
    why: 'Sinistralité d’une parcelle sur plusieurs campagnes (RF-42, RF-45).',
  }),
  ix('idx_signalement_statut', 'SIGNALEMENT_INFRA', ['statut', 'date_signalement DESC'], {
    why: 'Suivi des signalements d’infrastructure par état (RF-44).',
  }),
  ix('idx_rapport_visite_exploitation', 'RAPPORT_VISITE', ['exploitation_id', 'date_visite DESC'], {
    why: 'Dernières visites d’une exploitation (RF-41).',
  }),
];

/*
 * Paramètres de stockage : marge de remplissage pour les tables souvent mises à jour
 * (mises à jour « HOT », moins de réécritures d’index) et autovacuum plus réactif
 * sur les tables à fort volume.
 */
export const storageParams = [
  { table: 'NOTIFICATION', params: { fillfactor: 85, autovacuum_vacuum_scale_factor: 0.02, autovacuum_analyze_scale_factor: 0.02 }, why: '5 à 10 M lignes/an, statut et date_lecture modifiés en continu.' },
  { table: 'ETAPE_PLANIFIEE', params: { fillfactor: 90, autovacuum_analyze_scale_factor: 0.05 }, why: 'Dates réelles et statuts mis à jour au fil de la campagne.' },
  { table: 'RESERVATION', params: { fillfactor: 90 }, why: 'Changements de statut fréquents (demandée → confirmée → close).' },
  { table: 'EQUIPEMENT', params: { fillfactor: 90 }, why: 'État et quantité réévalués à chaque réservation.' },
  { table: 'SINISTRE', params: { fillfactor: 90 }, why: 'Passage signalé → transmis → traité, avec pièces jointes.' },
  { table: 'SYNCHRONISATION', params: { fillfactor: 90 }, why: 'Ligne complétée à la fin de chaque synchronisation.' },
  { table: 'ALERTE', params: { fillfactor: 95 }, why: 'Peu de mises à jour, mais diffusion massive en lecture.' },
  { table: 'JOURNAL_AUDIT', params: { fillfactor: 100, autovacuum_vacuum_scale_factor: 0.05, autovacuum_analyze_scale_factor: 0.05 }, why: 'Insertion seule : pages pleines, purge mensuelle.' },
  { table: 'MOUVEMENT_STOCK', params: { fillfactor: 100, autovacuum_analyze_scale_factor: 0.05 }, why: 'Insertion seule : écritures comptables jamais modifiées.' },
];

/* Index de la vue matérialisée : indispensable à REFRESH ... CONCURRENTLY. */
export const matviewIndexes = [
  { view: 'v_tableau_bord_zone', name: 'idx_v_tableau_bord_zone', cols: ['zone_id', 'campagne_id'], unique: true, why: 'Rafraîchissement concurrent et lecture par zone/campagne (RF-38, RF-40).' },
  { view: 'v_tableau_bord_zone', name: 'idx_v_tableau_bord_campagne', cols: ['campagne_id'], unique: false, why: 'Filtre par campagne dans les tableaux de bord nationaux.' },
];

/* ------------------------------------------------------------------ */
/* MCT — événements, opérations, synchronisations, résultats           */
/* ------------------------------------------------------------------ */

export const mctFlows = [
  {
    module: 'M1',
    label: 'Comptes et utilisateurs',
    chains: [
      {
        event: ['E01', "Demande d'inscription par téléphone"],
        ops: [
          ['O01', 'Vérifier le numéro, la zone et l’unicité du compte', 'UTILISATEUR, ZONE'],
          ['O02', 'Envoyer et contrôler le code de vérification SMS', 'UTILISATEUR'],
        ],
        sync: 'S1',
        result: ['R01', 'Compte actif + rôle exploitant attribué', 'UTILISATEUR, UTILISATEUR_ROLE'],
      },
      {
        event: ['E02', 'Visite de l’agent (exploitant sans smartphone)'],
        ops: [['O03', 'Créer le compte au nom de l’exploitant (RF-04)', 'UTILISATEUR, EXPLOITATION']],
        result: ['R01', 'Compte actif + rôle exploitant attribué', 'UTILISATEUR'],
      },
      {
        event: ['E03', 'Connexion (téléphone ou e-mail)'],
        ops: [['O04', 'Authentifier puis journaliser la session', 'UTILISATEUR, JOURNAL_AUDIT']],
        result: ['R02', 'Session ouverte', 'APPAREIL'],
      },
      {
        event: ['E04', 'Code SMS erroné (3 tentatives)'],
        ops: [['O05', 'Suspendre temporairement la demande', 'UTILISATEUR']],
        result: ['R03', 'Compte non activé', 'UTILISATEUR'],
      },
    ],
  },
  {
    module: 'M2',
    label: 'Exploitations, parcelles et matériel déclaré',
    chains: [
      {
        event: ['E05', 'Création / modification d’une exploitation'],
        ops: [['O06', 'Contrôler la zone et l’unicité du code', 'EXPLOITATION, ZONE']],
        result: ['R04', 'Exploitation enregistrée', 'EXPLOITATION'],
      },
      {
        event: ['E06', 'Ajout d’une parcelle (saisie ou tracé GPS)'],
        ops: [['O07', 'Calculer la superficie et enregistrer la géométrie', 'PARCELLE']],
        result: ['R05', 'Parcelle rattachée à l’exploitation', 'PARCELLE'],
      },
      {
        event: ['E07', 'Déclaration du matériel possédé'],
        ops: [['O08', 'Mettre à jour le référentiel de possession', 'POSSESSION_MATERIEL']],
        result: ['R06', 'Possession à jour', 'POSSESSION_MATERIEL'],
      },
    ],
  },
  {
    module: 'M3',
    label: 'Calendrier cultural',
    chains: [
      {
        event: ['E08', 'Création d’un cycle cultural'],
        ops: [
          ['O09', 'Sélectionner le modèle régional (variété + type de riziculture)', 'CYCLE_CULTURAL, VARIETE'],
          ['O10', 'Générer les étapes datées (RG-02, RG-03)', 'ETAPE_PLANIFIEE'],
        ],
        sync: 'S2',
        result: ['R07', 'Calendrier de la parcelle', 'ETAPE_PLANIFIEE'],
      },
      {
        event: ['E09', 'Retard des pluies, sécheresse ou alerte reçue'],
        ops: [['O11', 'Calculer les dates décalées et créer la proposition', 'DECALAGE']],
        result: ['R08', 'Décalage proposé (non appliqué)', 'DECALAGE'],
      },
      {
        event: ['E10', 'Validation par l’exploitant ou son agent'],
        ops: [['O12', 'Appliquer le décalage et replanifier les rappels', 'ETAPE_PLANIFIEE, DECALAGE']],
        sync: 'S2',
        result: ['R09', 'Étapes replanifiées', 'ETAPE_PLANIFIEE'],
      },
      {
        event: ['E11', 'Date prévue atteinte (tâche planifiée)'],
        ops: [['O13', 'Émettre le rappel par notification ou SMS', 'NOTIFICATION']],
        result: ['R10', 'Rappel envoyé', 'NOTIFICATION'],
      },
    ],
  },
  {
    module: 'M4',
    label: 'Bibliothèque technique et formation',
    chains: [
      {
        event: ['E12', 'Publication d’une fiche ou d’une formation'],
        ops: [['O14', 'Contrôler le contenu bilingue puis publier', 'FICHE_TECHNIQUE, MEDIA']],
        result: ['R11', 'Contenu publié', 'FICHE_TECHNIQUE'],
      },
      {
        event: ['E13', 'Fin d’un module de quiz'],
        ops: [['O15', 'Corriger et calculer le score', 'QUESTION, INSCRIPTION_FORMATION']],
        result: ['R12', 'Progression enregistrée', 'INSCRIPTION_FORMATION'],
      },
      {
        event: ['E14', 'Demande de conseil pour une étape en cours'],
        ops: [['O16', 'Croiser matériel déclaré × étape × zone', 'POSSESSION_MATERIEL, ETAPE_PLANIFIEE']],
        result: ['R13', 'Recommandation personnalisée', 'FICHE_TECHNIQUE'],
      },
    ],
  },
  {
    module: 'M5',
    label: 'Alertes climatiques',
    chains: [
      {
        event: ['E15', 'Saisie d’une alerte par le BNGRC ou la météo'],
        ops: [
          ['O17', 'Vérifier le ciblage géographique et la priorité (RG-04)', 'ALERTE, CIBLAGE_ALERTE'],
          ['O18', 'Diffuser par push, SMS et USSD', 'NOTIFICATION'],
        ],
        sync: 'S3',
        result: ['R14', 'Alertes envoyées aux exploitations ciblées', 'NOTIFICATION'],
      },
      {
        event: ['E16', 'Accusé de réception de l’exploitant'],
        ops: [['O19', 'Mettre à jour le statut de diffusion', 'NOTIFICATION']],
        result: ['R15', 'Accusé enregistré', 'NOTIFICATION'],
      },
      {
        event: ['E17', 'Alerte prioritaire reçue (cyclone)'],
        ops: [['O20', 'Proposer un décalage du calendrier (vers O11)', 'DECALAGE']],
        result: ['R16', 'Décalage proposé', 'DECALAGE'],
      },
      {
        event: ['E18', 'Relevé pluviométrique du jour'],
        ops: [['O21', 'Calculer le déficit à 10 et 20 jours', 'DONNEE_PLUVIOMETRIQUE']],
        result: ['R17', 'Indicateur de sécheresse', 'SEUIL_ALERTE'],
      },
    ],
  },
  {
    module: 'M6',
    label: 'Matériel agricole',
    chains: [
      {
        event: ['E19', 'Demande de réservation d’un équipement'],
        ops: [['O22', 'Vérifier la disponibilité sur la période demandée', 'EQUIPEMENT, RESERVATION']],
        result: ['R18', 'Réservation demandée', 'RESERVATION'],
      },
      {
        event: ['E20', 'Réponse du propriétaire'],
        ops: [['O23', 'Confirmer ou refuser, puis notifier le demandeur', 'RESERVATION, NOTIFICATION']],
        result: ['R19', 'Réservation confirmée ou refusée', 'RESERVATION'],
      },
      {
        event: ['E21', 'Fin de la location'],
        ops: [['O24', 'Clôturer et mettre à jour l’état du matériel', 'RESERVATION, EQUIPEMENT']],
        result: ['R20', 'Équipement remis en service', 'EQUIPEMENT'],
      },
    ],
  },
  {
    module: 'M7',
    label: 'GCV, stocks et financement',
    chains: [
      {
        event: ['E22', 'Dépôt de paddy au GCV'],
        ops: [
          ['O25', 'Contrôler l’adhésion, peser et qualifier', 'MEMBRE_GCV, MOUVEMENT_STOCK'],
          ['O26', 'Enregistrer le mouvement et émettre le reçu', 'MOUVEMENT_STOCK, RECU'],
        ],
        sync: 'S4',
        result: ['R21', 'Stock augmenté + reçu numérique', 'MOUVEMENT_STOCK, RECU'],
      },
      {
        event: ['E23', 'Demande de retrait'],
        ops: [['O27', 'Vérifier la décision collective (RG-06) et le stock disponible', 'DECISION_COLLECTIVE, v_stock_gcv']],
        result: ['R22', 'Retrait autorisé ou refusé', 'MOUVEMENT_STOCK'],
      },
      {
        event: ['E24', 'Demande de crédit de campagne'],
        ops: [
          ['O28', 'Constituer le dossier et la garantie en stock', 'DEMANDE_CREDIT, GARANTIE_STOCK'],
          ['O29', 'Instruction et décision de l’IMF', 'DEMANDE_CREDIT'],
        ],
        sync: 'S5',
        result: ['R23', 'Statut de la demande mis à jour', 'DEMANDE_CREDIT'],
      },
      {
        event: ['E25', 'Relevé des prix du marché'],
        ops: [['O30', 'Publier les prix et alerter si prix favorable', 'PRIX_MARCHE, NOTIFICATION']],
        result: ['R24', 'Prix publiés', 'PRIX_MARCHE'],
      },
    ],
  },
  {
    module: 'M8',
    label: 'Suivi de production et tableaux de bord',
    chains: [
      {
        event: ['E26', 'Déclaration de récolte'],
        ops: [['O31', 'Calculer le rendement en t/ha', 'RECOLTE, PARCELLE']],
        result: ['R25', 'Récolte enregistrée', 'RECOLTE'],
      },
      {
        event: ['E27', 'Visite d’un agent de terrain'],
        ops: [['O32', 'Saisir le rapport de visite et les conseils', 'RAPPORT_VISITE']],
        result: ['R26', 'Rapport de visite', 'RAPPORT_VISITE'],
      },
      {
        event: ['E28', 'Clôture de campagne'],
        ops: [['O33', 'Agréger par région et district, exporter CSV/PDF', 'v_tableau_bord_zone']],
        result: ['R27', 'Tableau de bord et export', 'CAMPAGNE'],
      },
    ],
  },
  {
    module: 'M9',
    label: 'Sinistres et infrastructures',
    chains: [
      {
        event: ['E29', 'Déclaration d’un sinistre (photo + GPS)'],
        ops: [['O34', 'Enregistrer, géolocaliser et classer le sinistre', 'SINISTRE, PHOTO_SINISTRE']],
        result: ['R28', 'Sinistre signalé', 'SINISTRE'],
      },
      {
        event: ['E30', 'Transmission au BNGRC et à l’agent de zone'],
        ops: [['O35', 'Notifier les destinataires et suivre le traitement', 'SINISTRE, NOTIFICATION']],
        sync: 'S6',
        result: ['R29', 'Sinistre transmis / suivi', 'SINISTRE'],
      },
      {
        event: ['E31', 'Signalement d’un ouvrage hydraulique'],
        ops: [['O36', 'Enregistrer et évaluer la gravité', 'SIGNALEMENT_INFRA, INFRASTRUCTURE']],
        result: ['R30', 'Signalement d’infrastructure', 'SIGNALEMENT_INFRA'],
      },
      {
        event: ['E32', 'Clôture d’un sinistre'],
        ops: [['O37', 'Mettre à jour la cartographie des zones sinistrées', 'SINISTRE, v_tableau_bord_zone']],
        result: ['R31', 'Carte des zones sinistrées', 'SINISTRE'],
      },
    ],
  },
  {
    module: 'M10',
    label: 'Administration, notifications et synchronisation',
    chains: [
      {
        event: ['E33', 'Action métier hors ligne'],
        ops: [['O38', 'Journaliser dans la file locale de l’appareil', 'APPAREIL']],
        result: ['R32', 'Action en attente de synchronisation', 'APPAREIL'],
      },
      {
        event: ['E34', 'Retour du réseau (synchronisation)'],
        ops: [['O39', 'Réconcilier les enregistrements et tracer les conflits', 'SYNCHRONISATION, JOURNAL_AUDIT']],
        sync: 'S7',
        result: ['R33', 'Données consolidées', 'SYNCHRONISATION'],
      },
      {
        event: ['E35', 'Tâche planifiée quotidienne'],
        ops: [['O40', 'Sauvegarder les données et purger les journaux', 'JOURNAL_AUDIT']],
        result: ['R34', 'Sauvegarde réalisée', 'PARAMETRE'],
      },
      {
        event: ['E36', 'Modification d’un paramètre ou d’un seuil'],
        ops: [['O41', 'Contrôler le droit, appliquer et tracer (RF-49, RF-50)', 'PARAMETRE, SEUIL_ALERTE']],
        result: ['R35', 'Paramètre appliqué', 'PARAMETRE'],
      },
    ],
  },
];

/** Cycles de vie (diagrammes d'états) pour les objets à statut. */
export const etats = {
  'Cycle cultural': {
    entite: 'CYCLE_CULTURAL',
    champ: 'statut',
    initial: 'planifie',
    transitions: [
      ['planifie', 'en_cours', 'démarrage du travail du sol'],
      ['en_cours', 'termine', 'récolte déclarée'],
      ['planifie', 'abandonne', 'parcelle non exploitée'],
      ['en_cours', 'abandonne', 'sécheresse, cyclone, ravageurs'],
    ],
  },
  'Étape planifiée': {
    entite: 'ETAPE_PLANIFIEE',
    champ: 'statut',
    initial: 'prevue',
    transitions: [
      ['prevue', 'en_cours', 'date prévue atteinte'],
      ['en_cours', 'realisee', 'saisie de la date réelle'],
      ['prevue', 'sautee', 'étape non nécessaire'],
    ],
  },
  'Décalage': {
    entite: 'DECALAGE',
    champ: 'statut',
    initial: 'propose',
    transitions: [
      ['propose', 'valide', 'accord de l’exploitant ou de l’agent (RG-05)'],
      ['propose', 'refuse', 'refus explicite'],
    ],
  },
  'Réservation': {
    entite: 'RESERVATION',
    champ: 'statut',
    initial: 'demandee',
    transitions: [
      ['demandee', 'confirmee', 'accord du propriétaire'],
      ['demandee', 'refusee', 'indisponibilité'],
      ['confirmee', 'annulee', 'annulation du demandeur'],
      ['confirmee', 'terminee', 'retour du matériel'],
    ],
  },
  'Demande de crédit': {
    entite: 'DEMANDE_CREDIT',
    champ: 'statut',
    initial: 'soumise',
    transitions: [
      ['soumise', 'etude', 'dossier complet'],
      ['etude', 'accordee', 'décision favorable de l’IMF'],
      ['etude', 'refusee', 'garantie insuffisante'],
      ['accordee', 'decaissee', 'mise à disposition des fonds'],
      ['decaissee', 'remboursee', 'remboursement de campagne'],
    ],
  },
  'Sinistre': {
    entite: 'SINISTRE',
    champ: 'statut',
    initial: 'signale',
    transitions: [
      ['signale', 'transmis', 'notification au BNGRC'],
      ['transmis', 'en_traitement', 'évaluation de l’agent'],
      ['en_traitement', 'cloture', 'dossier clos'],
    ],
  },
  'Signalement d’ouvrage': {
    entite: 'SIGNALEMENT_INFRA',
    champ: 'statut',
    initial: 'nouveau',
    transitions: [
      ['nouveau', 'transmis', 'transmission au gestionnaire'],
      ['transmis', 'en_reparation', 'travaux engagés'],
      ['en_reparation', 'repare', 'réception des travaux'],
    ],
  },
  'Alerte': {
    entite: 'ALERTE',
    champ: 'statut',
    initial: 'brouillon',
    transitions: [
      ['brouillon', 'emise', 'validation et diffusion (RG-04)'],
      ['emise', 'cloturee', 'fin de validité'],
    ],
  },
  'Notification': {
    entite: 'NOTIFICATION',
    champ: 'statut',
    initial: 'en_attente',
    transitions: [
      ['en_attente', 'envoye', 'passerelle push / SMS / USSD'],
      ['en_attente', 'echec', 'numéro invalide ou opérateur indisponible'],
      ['envoye', 'lu', 'ouverture de l’application'],
      ['envoye', 'accuse', 'accusé de réception (RF-24)'],
    ],
  },
};

/** Règles de gestion du cahier des charges et leur traduction dans le modèle. */
export const regles = [
  ['RG-01', 'Un calendrier est rattaché à une parcelle, une région et un type de riziculture.', 'CYCLE_CULTURAL → PARCELLE → EXPLOITATION → ZONE ; PARCELLE.type_riziculture ; contrainte d’unicité (parcelle_id, campagne_id).'],
  ['RG-02', 'Premier sarclage 8 à 10 jours après repiquage, second au moins 2 semaines plus tard.', 'ETAPE_CULTURELLE.delai_min_jours / delai_max_jours + génération applicative (O10).'],
  ['RG-03', 'Repiquage proposé quand les pousses atteignent 15 à 20 cm.', 'Paramètre seuil_hauteur_pousses_cm (PARAMETRE) + règle de l’opération O10.'],
  ['RG-04', 'Une alerte cyclonique est prioritaire et touche toutes les exploitations de la zone ciblée.', 'ALERTE.priorite + CIBLAGE_ALERTE + diffusion à toutes les exploitations des zones ciblées.'],
  ['RG-05', 'Un décalage n’est jamais appliqué sans validation de l’exploitant ou de son agent.', 'DECALAGE.statut = propose → valide ; DECALAGE.valide_par_id obligatoire à la validation.'],
  ['RG-06', 'Un retrait de stock suit la décision collective prévue par les règles du grenier.', 'MOUVEMENT_STOCK.type_mouvement = retrait ⇒ decision_id non nul (contrainte de vérification).'],
  ['RG-07', 'Cloisonnement des données : exploitant, agent, MAEP/BNGRC (agrégé).', 'UTILISATEUR_ROLE.zone_id + vues agrégées v_tableau_bord_zone + politiques RLS.'],
];

export const rgpd = [
  ['Minimisation', 'Aucune donnée sensible au-delà du téléphone, de la zone et des parcelles ; pas de données bancaires (crédit traité par l’IMF).'],
  ['Consentement', 'UTILISATEUR.consentement_le horodaté, obligatoire avant la première synchronisation.'],
  ['Localisation', 'PARCELLE.geometrie et latitude/longitude non publiques : visibles du seul exploitant, de son agent et des vues agrégées.'],
  ['Traçabilité', 'JOURNAL_AUDIT (RF-49) et SYNCHRONISATION conservés 12 mois glissants.'],
  ['Sécurité', 'mot_de_passe_hash Argon2, TLS, sauvegarde quotidienne, RLS par zone.'],
];
