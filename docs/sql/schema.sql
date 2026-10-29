-- RizConnect Madagascar — schéma relationnel (MLD)
-- Généré depuis docs/tools/model.mjs — ne pas modifier à la main.
-- PostgreSQL 16 + PostGIS

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- pg_trgm : recherche libre par trigrammes (index GIN des fiches techniques).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==================================================================
-- D1 — Comptes, référentiel et administration (modules M1 · M10)
-- ==================================================================

CREATE TABLE zone (
  id                           uuid DEFAULT gen_random_uuid(),
  code                         varchar(24) NOT NULL,
  nom                          varchar(120) NOT NULL,
  type_zone                    varchar(16) NOT NULL,
  population                   integer,
  actif                        boolean NOT NULL,
  parent_id                    uuid,
  CONSTRAINT pk_zone PRIMARY KEY (id),
  CONSTRAINT uk_zone_code UNIQUE (code),
  CONSTRAINT ck_zone_type_zone CHECK (type_zone IN ('region', 'district', 'commune', 'fokontany')),
  CONSTRAINT fk_zone_parent_id FOREIGN KEY (parent_id) REFERENCES zone(id)
);
COMMENT ON TABLE zone IS 'Découpage région → district → commune → Fokontany (RF-03). Relation réflexive pour la hiérarchie.';
COMMENT ON COLUMN zone.id IS 'Identifiant technique';
COMMENT ON COLUMN zone.code IS 'Code officiel (ex. MG-ANA-01)';
COMMENT ON COLUMN zone.nom IS 'Nom de la zone';
COMMENT ON COLUMN zone.type_zone IS 'Niveau hiérarchique';
COMMENT ON COLUMN zone.population IS 'Population estimée';
COMMENT ON COLUMN zone.actif IS 'Zone ouverte au pilote';
CREATE INDEX idx_zone_parent_id ON zone (parent_id);

CREATE TABLE organisation (
  id                           uuid DEFAULT gen_random_uuid(),
  nom                          varchar(160) NOT NULL,
  type_organisation            varchar(24) NOT NULL,
  telephone                    varchar(20) NOT NULL,
  email                        varchar(160) NOT NULL,
  actif                        boolean NOT NULL,
  zone_id                      uuid,
  CONSTRAINT pk_organisation PRIMARY KEY (id),
  CONSTRAINT ck_organisation_type_organisation CHECK (type_organisation IN ('cooperative', 'imf', 'ong', 'cfama', 'maep', 'bngrc', 'service_meteo')),
  CONSTRAINT fk_organisation_zone_id FOREIGN KEY (zone_id) REFERENCES zone(id)
);
COMMENT ON TABLE organisation IS 'Coopérative, IMF, ONG, CFAMA, MAEP, BNGRC ou service météo (RF-02, RF-26, RF-33).';
COMMENT ON COLUMN organisation.id IS 'Identifiant technique';
COMMENT ON COLUMN organisation.nom IS 'Raison sociale';
COMMENT ON COLUMN organisation.type_organisation IS 'Nature de l''organisation';
COMMENT ON COLUMN organisation.telephone IS 'Contact';
COMMENT ON COLUMN organisation.email IS 'Contact électronique';
COMMENT ON COLUMN organisation.actif IS 'Organisation active';
CREATE INDEX idx_organisation_zone_id ON organisation (zone_id);

CREATE TABLE utilisateur (
  id                           uuid DEFAULT gen_random_uuid(),
  telephone                    varchar(20) NOT NULL,
  email                        varchar(160),
  nom                          varchar(80) NOT NULL,
  prenom                       varchar(80) NOT NULL,
  mot_de_passe_hash            text,
  langue                       varchar(2) NOT NULL,
  statut                       varchar(16) NOT NULL,
  consentement_le              timestamptz,
  date_inscription             timestamptz NOT NULL,
  zone_id                      uuid,
  organisation_id              uuid,
  CONSTRAINT pk_utilisateur PRIMARY KEY (id),
  CONSTRAINT uk_utilisateur_telephone UNIQUE (telephone),
  CONSTRAINT uk_utilisateur_email UNIQUE (email),
  CONSTRAINT ck_utilisateur_langue CHECK (langue IN ('mg', 'fr')),
  CONSTRAINT ck_utilisateur_statut CHECK (statut IN ('invite', 'actif', 'suspendu', 'archive')),
  CONSTRAINT fk_utilisateur_zone_id FOREIGN KEY (zone_id) REFERENCES zone(id),
  CONSTRAINT fk_utilisateur_organisation_id FOREIGN KEY (organisation_id) REFERENCES organisation(id)
);
COMMENT ON TABLE utilisateur IS 'Compte identifié par son téléphone (RF-01), rattaché à une zone et éventuellement à une organisation.';
COMMENT ON COLUMN utilisateur.id IS 'Identifiant technique';
COMMENT ON COLUMN utilisateur.telephone IS 'Numéro unique, identifiant de connexion';
COMMENT ON COLUMN utilisateur.email IS 'Optionnel, agents et institutions';
COMMENT ON COLUMN utilisateur.nom IS 'Nom';
COMMENT ON COLUMN utilisateur.prenom IS 'Prénom';
COMMENT ON COLUMN utilisateur.mot_de_passe_hash IS 'Hash Argon2 ; nul si authentification par code SMS';
COMMENT ON COLUMN utilisateur.langue IS 'Langue de l’interface';
COMMENT ON COLUMN utilisateur.statut IS 'État du compte';
COMMENT ON COLUMN utilisateur.consentement_le IS 'Consentement données personnelles';
COMMENT ON COLUMN utilisateur.date_inscription IS 'Date de création du compte';
CREATE INDEX idx_utilisateur_zone_id ON utilisateur (zone_id);
CREATE INDEX idx_utilisateur_organisation_id ON utilisateur (organisation_id);

CREATE TABLE role (
  code                         varchar(24),
  libelle                      varchar(80) NOT NULL,
  description                  text NOT NULL,
  CONSTRAINT pk_role PRIMARY KEY (code)
);
COMMENT ON TABLE role IS 'Référentiel des rôles : exploitant, agent, coopérative, IMF, MAEP, BNGRC, administrateur (RF-02).';
COMMENT ON COLUMN role.code IS 'Code du rôle';
COMMENT ON COLUMN role.libelle IS 'Libellé affiché';
COMMENT ON COLUMN role.description IS 'Droits associés';

CREATE TABLE utilisateur_role (
  id                           uuid DEFAULT gen_random_uuid(),
  date_attribution             timestamptz NOT NULL,
  actif                        boolean NOT NULL,
  utilisateur_id               uuid NOT NULL,
  role_id                      varchar(24) NOT NULL,
  CONSTRAINT pk_utilisateur_role PRIMARY KEY (id),
  CONSTRAINT fk_utilisateur_role_utilisateur_id FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
  CONSTRAINT fk_utilisateur_role_role_id FOREIGN KEY (role_id) REFERENCES role(code) ON DELETE CASCADE
);
COMMENT ON TABLE utilisateur_role IS 'Association-entité : un utilisateur peut cumuler des rôles, avec un périmètre géographique (RG-07).';
COMMENT ON COLUMN utilisateur_role.id IS 'Identifiant technique';
COMMENT ON COLUMN utilisateur_role.date_attribution IS 'Date d''effet';
COMMENT ON COLUMN utilisateur_role.actif IS 'Rôle en cours';
CREATE INDEX idx_utilisateur_role_utilisateur_id ON utilisateur_role (utilisateur_id);
CREATE INDEX idx_utilisateur_role_role_id ON utilisateur_role (role_id);

CREATE TABLE appareil (
  id                           uuid DEFAULT gen_random_uuid(),
  identifiant_appareil         varchar(120) NOT NULL,
  plateforme                   varchar(16) NOT NULL,
  version_app                  varchar(20) NOT NULL,
  derniere_sync                timestamptz NOT NULL,
  utilisateur_id               uuid NOT NULL,
  CONSTRAINT pk_appareil PRIMARY KEY (id),
  CONSTRAINT uk_appareil_identifiant_appareil UNIQUE (identifiant_appareil),
  CONSTRAINT ck_appareil_plateforme CHECK (plateforme IN ('android', 'web', 'ussd')),
  CONSTRAINT fk_appareil_utilisateur_id FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);
COMMENT ON TABLE appareil IS 'Terminal Android ou navigateur utilisé pour la synchronisation hors ligne (RF-46).';
COMMENT ON COLUMN appareil.id IS 'Identifiant technique';
COMMENT ON COLUMN appareil.identifiant_appareil IS 'Identifiant matériel/logiciel';
COMMENT ON COLUMN appareil.plateforme IS 'Système';
COMMENT ON COLUMN appareil.version_app IS 'Version du client';
COMMENT ON COLUMN appareil.derniere_sync IS 'Dernière synchronisation réussie';
CREATE INDEX idx_appareil_utilisateur_id ON appareil (utilisateur_id);

CREATE TABLE parametre (
  cle                          varchar(60),
  valeur                       text NOT NULL,
  type_valeur                  varchar(16) NOT NULL,
  libelle                      varchar(160) NOT NULL,
  modifie_le                   timestamptz NOT NULL,
  modifie_par_id               uuid,
  CONSTRAINT pk_parametre PRIMARY KEY (cle),
  CONSTRAINT ck_parametre_type_valeur CHECK (type_valeur IN ('entier', 'decimal', 'booleen', 'texte', 'json')),
  CONSTRAINT fk_parametre_modifie_par_id FOREIGN KEY (modifie_par_id) REFERENCES utilisateur(id)
);
COMMENT ON TABLE parametre IS 'Paramétrage des régions, saisons, variétés et seuils (RF-50), modifiable par un administrateur.';
COMMENT ON COLUMN parametre.cle IS 'Clé du paramètre';
COMMENT ON COLUMN parametre.valeur IS 'Valeur sérialisée';
COMMENT ON COLUMN parametre.type_valeur IS 'Type de la valeur';
COMMENT ON COLUMN parametre.libelle IS 'Description fonctionnelle';
COMMENT ON COLUMN parametre.modifie_le IS 'Dernière modification';
CREATE INDEX idx_parametre_modifie_par_id ON parametre (modifie_par_id);

CREATE TABLE seuil_alerte (
  id                           uuid DEFAULT gen_random_uuid(),
  type_alerte                  varchar(24) NOT NULL,
  cumul_10j_mm                 numeric(6,1) NOT NULL,
  cumul_20j_mm                 numeric(6,1) NOT NULL,
  niveau                       varchar(16) NOT NULL,
  actif                        boolean NOT NULL,
  zone_id                      uuid NOT NULL,
  CONSTRAINT pk_seuil_alerte PRIMARY KEY (id),
  CONSTRAINT ck_seuil_alerte_type_alerte CHECK (type_alerte IN ('secheresse', 'fortes_pluies', 'cyclone')),
  CONSTRAINT ck_seuil_alerte_niveau CHECK (niveau IN ('info', 'vigilance', 'alerte', 'urgence')),
  CONSTRAINT fk_seuil_alerte_zone_id FOREIGN KEY (zone_id) REFERENCES zone(id)
);
COMMENT ON TABLE seuil_alerte IS 'Seuils pluviométriques par zone utilisés pour qualifier la sécheresse (RF-25, RF-50).';
COMMENT ON COLUMN seuil_alerte.id IS 'Identifiant technique';
COMMENT ON COLUMN seuil_alerte.type_alerte IS 'Phénomène surveillé';
COMMENT ON COLUMN seuil_alerte.cumul_10j_mm IS 'Cumul de pluie minimal sur 10 jours';
COMMENT ON COLUMN seuil_alerte.cumul_20j_mm IS 'Cumul de pluie minimal sur 20 jours';
COMMENT ON COLUMN seuil_alerte.niveau IS 'Niveau déclenché';
COMMENT ON COLUMN seuil_alerte.actif IS 'Seuil actif';
CREATE INDEX idx_seuil_alerte_zone_id ON seuil_alerte (zone_id);

CREATE TABLE journal_audit (
  id                           bigserial,
  action                       varchar(32) NOT NULL,
  entite                       varchar(48) NOT NULL,
  entite_id                    uuid,
  details                      jsonb NOT NULL,
  adresse_ip                   inet,
  date_action                  timestamptz NOT NULL,
  utilisateur_id               uuid,
  CONSTRAINT pk_journal_audit PRIMARY KEY (id),
  CONSTRAINT fk_journal_audit_utilisateur_id FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);
COMMENT ON TABLE journal_audit IS 'Traçabilité des actions, des synchronisations et des accès (RF-49).';
COMMENT ON COLUMN journal_audit.id IS 'Identifiant séquentiel';
COMMENT ON COLUMN journal_audit.action IS 'Type d’action (creation, modification, suppression, connexion…)';
COMMENT ON COLUMN journal_audit.entite IS 'Table concernée';
COMMENT ON COLUMN journal_audit.entite_id IS 'Enregistrement concerné';
COMMENT ON COLUMN journal_audit.details IS 'Avant/après, contexte';
COMMENT ON COLUMN journal_audit.adresse_ip IS 'Origine de la requête';
COMMENT ON COLUMN journal_audit.date_action IS 'Horodatage';
CREATE INDEX idx_journal_audit_utilisateur_id ON journal_audit (utilisateur_id);

CREATE TABLE synchronisation (
  id                           uuid DEFAULT gen_random_uuid(),
  debut_le                     timestamptz NOT NULL,
  fin_le                       timestamptz,
  nb_enregistrements           integer NOT NULL,
  statut                       varchar(16) NOT NULL,
  appareil_id                  uuid NOT NULL,
  CONSTRAINT pk_synchronisation PRIMARY KEY (id),
  CONSTRAINT ck_synchronisation_statut CHECK (statut IN ('reussie', 'partielle', 'echec')),
  CONSTRAINT fk_synchronisation_appareil_id FOREIGN KEY (appareil_id) REFERENCES appareil(id)
);
COMMENT ON TABLE synchronisation IS 'Journal des remontées hors ligne (RF-46) : volume, durée, conflits éventuels.';
COMMENT ON COLUMN synchronisation.id IS 'Identifiant technique';
COMMENT ON COLUMN synchronisation.debut_le IS 'Début de la synchronisation';
COMMENT ON COLUMN synchronisation.fin_le IS 'Fin de la synchronisation';
COMMENT ON COLUMN synchronisation.nb_enregistrements IS 'Nombre d’enregistrements échangés';
COMMENT ON COLUMN synchronisation.statut IS 'Résultat';
CREATE INDEX idx_synchronisation_appareil_id ON synchronisation (appareil_id);

-- ==================================================================
-- D2 — Exploitations, parcelles et calendrier cultural (modules M2 · M3 · M8)
-- ==================================================================

CREATE TABLE exploitation (
  id                           uuid DEFAULT gen_random_uuid(),
  code                         varchar(24) NOT NULL,
  nom                          varchar(160) NOT NULL,
  telephone                    varchar(20),
  superficie_totale_ha         numeric(8,2),
  statut                       varchar(16) NOT NULL,
  proprietaire_id              uuid NOT NULL,
  zone_id                      uuid NOT NULL,
  CONSTRAINT pk_exploitation PRIMARY KEY (id),
  CONSTRAINT uk_exploitation_code UNIQUE (code),
  CONSTRAINT ck_exploitation_statut CHECK (statut IN ('active', 'suspendue', 'archivee')),
  CONSTRAINT fk_exploitation_proprietaire_id FOREIGN KEY (proprietaire_id) REFERENCES utilisateur(id),
  CONSTRAINT fk_exploitation_zone_id FOREIGN KEY (zone_id) REFERENCES zone(id)
);
COMMENT ON TABLE exploitation IS 'Unité de production d''un exploitant dans un Fokontany (RF-05).';
COMMENT ON COLUMN exploitation.id IS 'Identifiant technique';
COMMENT ON COLUMN exploitation.code IS 'Code lisible (ex. EXP-2026-0142)';
COMMENT ON COLUMN exploitation.nom IS 'Nom de l’exploitation';
COMMENT ON COLUMN exploitation.telephone IS 'Téléphone de contact';
COMMENT ON COLUMN exploitation.superficie_totale_ha IS 'Somme des parcelles (dénormalisée pour le pilotage)';
COMMENT ON COLUMN exploitation.statut IS 'État';
CREATE INDEX idx_exploitation_proprietaire_id ON exploitation (proprietaire_id);

CREATE TABLE parcelle (
  id                           uuid DEFAULT gen_random_uuid(),
  code                         varchar(24) NOT NULL,
  superficie_ha                numeric(6,2) NOT NULL,
  type_riziculture             varchar(16) NOT NULL,
  latitude                     numeric(9,6),
  longitude                    numeric(9,6),
  geometrie                    geometry(MultiPolygon,4326),
  statut                       varchar(16) NOT NULL,
  exploitation_id              uuid NOT NULL,
  CONSTRAINT pk_parcelle PRIMARY KEY (id),
  CONSTRAINT ck_parcelle_type_riziculture CHECK (type_riziculture IN ('irriguee', 'pluviale', 'brulis')),
  CONSTRAINT ck_parcelle_statut CHECK (statut IN ('active', 'jachere', 'abandonnee')),
  CONSTRAINT fk_parcelle_exploitation_id FOREIGN KEY (exploitation_id) REFERENCES exploitation(id)
);
COMMENT ON TABLE parcelle IS 'Rizière localisée et géométrisée (RF-05, RF-08), support du calendrier et des sinistres.';
COMMENT ON COLUMN parcelle.id IS 'Identifiant technique';
COMMENT ON COLUMN parcelle.code IS 'Code interne à l’exploitation';
COMMENT ON COLUMN parcelle.superficie_ha IS 'Superficie en hectares';
COMMENT ON COLUMN parcelle.type_riziculture IS 'Mode de culture';
COMMENT ON COLUMN parcelle.latitude IS 'Latitude du centroïde';
COMMENT ON COLUMN parcelle.longitude IS 'Longitude du centroïde';
COMMENT ON COLUMN parcelle.geometrie IS 'Contour saisi sur la carte (PostGIS)';
COMMENT ON COLUMN parcelle.statut IS 'État';

CREATE TABLE variete (
  id                           uuid DEFAULT gen_random_uuid(),
  nom                          varchar(120) NOT NULL,
  cycle_jours                  integer NOT NULL,
  rendement_potentiel_t_ha     numeric(4,2),
  description                  text,
  actif                        boolean NOT NULL,
  CONSTRAINT pk_variete PRIMARY KEY (id),
  CONSTRAINT uk_variete_nom UNIQUE (nom)
);
COMMENT ON TABLE variete IS 'Référentiel des variétés (RF-07, RF-50) : durée de cycle et potentiel de rendement.';
COMMENT ON COLUMN variete.id IS 'Identifiant technique';
COMMENT ON COLUMN variete.nom IS 'Nom de la variété';
COMMENT ON COLUMN variete.cycle_jours IS 'Durée moyenne du cycle';
COMMENT ON COLUMN variete.rendement_potentiel_t_ha IS 'Potentiel de rendement';
COMMENT ON COLUMN variete.description IS 'Caractéristiques';
COMMENT ON COLUMN variete.actif IS 'Variété proposée';

CREATE TABLE campagne (
  id                           uuid DEFAULT gen_random_uuid(),
  libelle                      varchar(40) NOT NULL,
  date_debut                   date NOT NULL,
  date_fin                     date NOT NULL,
  saison                       varchar(16) NOT NULL,
  statut                       varchar(16) NOT NULL,
  zone_id                      uuid,
  CONSTRAINT pk_campagne PRIMARY KEY (id),
  CONSTRAINT uk_campagne_libelle UNIQUE (libelle),
  CONSTRAINT ck_campagne_saison CHECK (saison IN ('grande_saison', 'contre_saison')),
  CONSTRAINT ck_campagne_statut CHECK (statut IN ('preparee', 'en_cours', 'cloturee')),
  CONSTRAINT fk_campagne_zone_id FOREIGN KEY (zone_id) REFERENCES zone(id)
);
COMMENT ON TABLE campagne IS 'Période de production (grande saison / contre-saison) servant de référentiel temporel (RF-07, RF-37).';
COMMENT ON COLUMN campagne.id IS 'Identifiant technique';
COMMENT ON COLUMN campagne.libelle IS 'Libellé (ex. 2026-2027)';
COMMENT ON COLUMN campagne.date_debut IS 'Début de campagne';
COMMENT ON COLUMN campagne.date_fin IS 'Fin de campagne';
COMMENT ON COLUMN campagne.saison IS 'Saison';
COMMENT ON COLUMN campagne.statut IS 'État';
CREATE INDEX idx_campagne_zone_id ON campagne (zone_id);

CREATE TABLE cycle_cultural (
  id                           uuid DEFAULT gen_random_uuid(),
  date_debut                   date NOT NULL,
  date_fin_prevue              date,
  statut                       varchar(16) NOT NULL,
  campagne_id                  uuid NOT NULL,
  parcelle_id                  uuid NOT NULL,
  variete_id                   uuid NOT NULL,
  CONSTRAINT pk_cycle_cultural PRIMARY KEY (id),
  CONSTRAINT ck_cycle_cultural_statut CHECK (statut IN ('planifie', 'en_cours', 'termine', 'abandonne')),
  CONSTRAINT fk_cycle_cultural_campagne_id FOREIGN KEY (campagne_id) REFERENCES campagne(id),
  CONSTRAINT fk_cycle_cultural_parcelle_id FOREIGN KEY (parcelle_id) REFERENCES parcelle(id),
  CONSTRAINT fk_cycle_cultural_variete_id FOREIGN KEY (variete_id) REFERENCES variete(id)
);
COMMENT ON TABLE cycle_cultural IS 'Culture d''une variété sur une parcelle pendant une campagne : point d''entrée du calendrier (RG-01).';
COMMENT ON COLUMN cycle_cultural.id IS 'Identifiant technique';
COMMENT ON COLUMN cycle_cultural.date_debut IS 'Date de démarrage (travail du sol)';
COMMENT ON COLUMN cycle_cultural.date_fin_prevue IS 'Fin prévue (battage)';
COMMENT ON COLUMN cycle_cultural.statut IS 'Avancement';
CREATE INDEX idx_cycle_cultural_campagne_id ON cycle_cultural (campagne_id);
CREATE INDEX idx_cycle_cultural_variete_id ON cycle_cultural (variete_id);

CREATE TABLE etape_culturelle (
  code                         varchar(24),
  libelle                      varchar(80) NOT NULL,
  ordre                        integer NOT NULL,
  delai_min_jours              integer,
  delai_max_jours              integer,
  description                  text,
  CONSTRAINT pk_etape_culturelle PRIMARY KEY (code)
);
COMMENT ON TABLE etape_culturelle IS 'Référentiel des étapes : travail du sol, semis, repiquage, sarclage, moisson, battage (RF-09, RF-14).';
COMMENT ON COLUMN etape_culturelle.code IS 'Code de l’étape';
COMMENT ON COLUMN etape_culturelle.libelle IS 'Libellé bilingue de référence';
COMMENT ON COLUMN etape_culturelle.ordre IS 'Ordre chronologique';
COMMENT ON COLUMN etape_culturelle.delai_min_jours IS 'Délai minimal depuis l’étape précédente';
COMMENT ON COLUMN etape_culturelle.delai_max_jours IS 'Délai maximal depuis l’étape précédente';
COMMENT ON COLUMN etape_culturelle.description IS 'Contenu de la fiche type';

CREATE TABLE etape_planifiee (
  id                           uuid DEFAULT gen_random_uuid(),
  date_prevue                  date NOT NULL,
  date_reelle                  date,
  statut                       varchar(16) NOT NULL,
  cycle_id                     uuid NOT NULL,
  etape_code                   varchar(24) NOT NULL,
  CONSTRAINT pk_etape_planifiee PRIMARY KEY (id),
  CONSTRAINT ck_etape_planifiee_statut CHECK (statut IN ('prevue', 'en_cours', 'realisee', 'sautee')),
  CONSTRAINT fk_etape_planifiee_cycle_id FOREIGN KEY (cycle_id) REFERENCES cycle_cultural(id) ON DELETE CASCADE,
  CONSTRAINT fk_etape_planifiee_etape_code FOREIGN KEY (etape_code) REFERENCES etape_culturelle(code) ON DELETE CASCADE
);
COMMENT ON TABLE etape_planifiee IS 'Occurrence datée d''une étape pour un cycle (RF-09, RF-12), base des rappels.';
COMMENT ON COLUMN etape_planifiee.id IS 'Identifiant technique';
COMMENT ON COLUMN etape_planifiee.date_prevue IS 'Date planifiée';
COMMENT ON COLUMN etape_planifiee.date_reelle IS 'Date de réalisation constatée';
COMMENT ON COLUMN etape_planifiee.statut IS 'Avancement';
CREATE INDEX idx_etape_planifiee_etape_code ON etape_planifiee (etape_code);

CREATE TABLE decalage (
  id                           uuid DEFAULT gen_random_uuid(),
  date_proposee                date NOT NULL,
  motif                        varchar(160) NOT NULL,
  source                       varchar(24) NOT NULL,
  statut                       varchar(16) NOT NULL,
  date_validation              timestamptz,
  etape_planifiee_id           uuid NOT NULL,
  valide_par_id                uuid,
  CONSTRAINT pk_decalage PRIMARY KEY (id),
  CONSTRAINT ck_decalage_source CHECK (source IN ('meteo', 'alerte', 'exploitant', 'agent')),
  CONSTRAINT ck_decalage_statut CHECK (statut IN ('propose', 'valide', 'refuse')),
  CONSTRAINT fk_decalage_etape_planifiee_id FOREIGN KEY (etape_planifiee_id) REFERENCES etape_planifiee(id),
  CONSTRAINT fk_decalage_valide_par_id FOREIGN KEY (valide_par_id) REFERENCES utilisateur(id)
);
COMMENT ON TABLE decalage IS 'Proposition de report d''une étape, jamais appliquée sans validation (RF-11, RG-05).';
COMMENT ON COLUMN decalage.id IS 'Identifiant technique';
COMMENT ON COLUMN decalage.date_proposee IS 'Nouvelle date proposée';
COMMENT ON COLUMN decalage.motif IS 'Retard des pluies, sécheresse, alerte cyclone…';
COMMENT ON COLUMN decalage.source IS 'Origine de la proposition';
COMMENT ON COLUMN decalage.statut IS 'Décision';
COMMENT ON COLUMN decalage.date_validation IS 'Horodatage de la décision';
CREATE INDEX idx_decalage_etape_planifiee_id ON decalage (etape_planifiee_id);
CREATE INDEX idx_decalage_valide_par_id ON decalage (valide_par_id);

CREATE TABLE recolte (
  id                           uuid DEFAULT gen_random_uuid(),
  date_recolte                 date NOT NULL,
  quantite_paddy_kg            numeric(10,2) NOT NULL,
  rendement_t_ha               numeric(5,2),
  qualite                      varchar(16),
  cycle_id                     uuid NOT NULL,
  declare_par_id               uuid NOT NULL,
  CONSTRAINT pk_recolte PRIMARY KEY (id),
  CONSTRAINT ck_recolte_qualite CHECK (qualite IN ('bonne', 'moyenne', 'faible')),
  CONSTRAINT fk_recolte_cycle_id FOREIGN KEY (cycle_id) REFERENCES cycle_cultural(id),
  CONSTRAINT fk_recolte_declare_par_id FOREIGN KEY (declare_par_id) REFERENCES utilisateur(id)
);
COMMENT ON TABLE recolte IS 'Déclaration de récolte d''un cycle et rendement calculé en t/ha (RF-07, RF-37).';
COMMENT ON COLUMN recolte.id IS 'Identifiant technique';
COMMENT ON COLUMN recolte.date_recolte IS 'Date de moisson/battage';
COMMENT ON COLUMN recolte.quantite_paddy_kg IS 'Production de paddy déclarée';
COMMENT ON COLUMN recolte.rendement_t_ha IS 'Rendement calculé : quantité / superficie';
COMMENT ON COLUMN recolte.qualite IS 'Qualité estimée';
CREATE INDEX idx_recolte_declare_par_id ON recolte (declare_par_id);

CREATE TABLE possession_materiel (
  id                           uuid DEFAULT gen_random_uuid(),
  quantite                     integer NOT NULL,
  annee_acquisition            integer NOT NULL,
  exploitation_id              uuid NOT NULL,
  type_materiel_id             uuid NOT NULL,
  CONSTRAINT pk_possession_materiel PRIMARY KEY (id),
  CONSTRAINT fk_possession_materiel_exploitation_id FOREIGN KEY (exploitation_id) REFERENCES exploitation(id) ON DELETE CASCADE,
  CONSTRAINT fk_possession_materiel_type_materiel_id FOREIGN KEY (type_materiel_id) REFERENCES type_materiel(id) ON DELETE CASCADE
);
COMMENT ON TABLE possession_materiel IS 'Matériel déclaré par une exploitation (RF-06), utilisé pour personnaliser les conseils (RF-19, RF-39).';
COMMENT ON COLUMN possession_materiel.id IS 'Identifiant technique';
COMMENT ON COLUMN possession_materiel.quantite IS 'Nombre d’unités';
COMMENT ON COLUMN possession_materiel.annee_acquisition IS 'Année d’acquisition';
CREATE INDEX idx_possession_materiel_type_materiel_id ON possession_materiel (type_materiel_id);

-- ==================================================================
-- D3 — Bibliothèque technique et formation (modules M4)
-- ==================================================================

CREATE TABLE fiche_technique (
  id                           uuid DEFAULT gen_random_uuid(),
  titre_mg                     varchar(160) NOT NULL,
  titre_fr                     varchar(160) NOT NULL,
  resume_mg                    text NOT NULL,
  resume_fr                    text NOT NULL,
  outil_traditionnel           varchar(160) NOT NULL,
  outil_moderne                varchar(160) NOT NULL,
  statut                       varchar(16) NOT NULL,
  date_publication             timestamptz,
  etape_code                   varchar(24) NOT NULL,
  auteur_id                    uuid,
  CONSTRAINT pk_fiche_technique PRIMARY KEY (id),
  CONSTRAINT ck_fiche_technique_statut CHECK (statut IN ('brouillon', 'publie', 'archive')),
  CONSTRAINT fk_fiche_technique_etape_code FOREIGN KEY (etape_code) REFERENCES etape_culturelle(code),
  CONSTRAINT fk_fiche_technique_auteur_id FOREIGN KEY (auteur_id) REFERENCES utilisateur(id)
);
COMMENT ON TABLE fiche_technique IS 'Fiche pratique par étape : technique, outil traditionnel et outil moderne équivalent (RF-14, RF-16, RF-47).';
COMMENT ON COLUMN fiche_technique.id IS 'Identifiant technique';
COMMENT ON COLUMN fiche_technique.titre_mg IS 'Titre en malagasy';
COMMENT ON COLUMN fiche_technique.titre_fr IS 'Titre en français';
COMMENT ON COLUMN fiche_technique.resume_mg IS 'Contenu court en malagasy';
COMMENT ON COLUMN fiche_technique.resume_fr IS 'Contenu court en français';
COMMENT ON COLUMN fiche_technique.outil_traditionnel IS 'Ex. angady, faucille';
COMMENT ON COLUMN fiche_technique.outil_moderne IS 'Ex. motoculteur, batteuse';
COMMENT ON COLUMN fiche_technique.statut IS 'Cycle de publication';
COMMENT ON COLUMN fiche_technique.date_publication IS 'Date de mise en ligne';
CREATE INDEX idx_fiche_technique_auteur_id ON fiche_technique (auteur_id);

CREATE TABLE media (
  id                           uuid DEFAULT gen_random_uuid(),
  type_media                   varchar(12) NOT NULL,
  url                          text NOT NULL,
  legende                      varchar(160),
  langue                       varchar(2) NOT NULL,
  duree_s                      integer,
  fiche_id                     uuid NOT NULL,
  CONSTRAINT pk_media PRIMARY KEY (id),
  CONSTRAINT ck_media_type_media CHECK (type_media IN ('image', 'video', 'audio')),
  CONSTRAINT ck_media_langue CHECK (langue IN ('mg', 'fr')),
  CONSTRAINT fk_media_fiche_id FOREIGN KEY (fiche_id) REFERENCES fiche_technique(id) ON DELETE CASCADE
);
COMMENT ON TABLE media IS 'Illustration, vidéo courte ou lecture audio d''une fiche, par langue (RF-15).';
COMMENT ON COLUMN media.id IS 'Identifiant technique';
COMMENT ON COLUMN media.type_media IS 'Format';
COMMENT ON COLUMN media.url IS 'Adresse du fichier';
COMMENT ON COLUMN media.legende IS 'Légende';
COMMENT ON COLUMN media.langue IS 'Langue';
COMMENT ON COLUMN media.duree_s IS 'Durée pour les vidéos et audios';

CREATE TABLE formation (
  id                           uuid DEFAULT gen_random_uuid(),
  titre                        varchar(160) NOT NULL,
  description                  text NOT NULL,
  duree_min                    integer,
  niveau                       varchar(16) NOT NULL,
  statut                       varchar(16) NOT NULL,
  fiche_id                     uuid,
  CONSTRAINT pk_formation PRIMARY KEY (id),
  CONSTRAINT ck_formation_niveau CHECK (niveau IN ('debutant', 'intermediaire', 'avance')),
  CONSTRAINT ck_formation_statut CHECK (statut IN ('brouillon', 'publie', 'archive')),
  CONSTRAINT fk_formation_fiche_id FOREIGN KEY (fiche_id) REFERENCES fiche_technique(id)
);
COMMENT ON TABLE formation IS 'Formation courte avec quiz et suivi de progression (RF-17).';
COMMENT ON COLUMN formation.id IS 'Identifiant technique';
COMMENT ON COLUMN formation.titre IS 'Titre du module';
COMMENT ON COLUMN formation.description IS 'Objectifs pédagogiques';
COMMENT ON COLUMN formation.duree_min IS 'Durée estimée';
COMMENT ON COLUMN formation.niveau IS 'Niveau';
COMMENT ON COLUMN formation.statut IS 'Publication';
CREATE INDEX idx_formation_fiche_id ON formation (fiche_id);

CREATE TABLE question (
  id                           uuid DEFAULT gen_random_uuid(),
  enonce                       text NOT NULL,
  ordre                        integer NOT NULL,
  points                       integer NOT NULL,
  formation_id                 uuid NOT NULL,
  CONSTRAINT pk_question PRIMARY KEY (id),
  CONSTRAINT fk_question_formation_id FOREIGN KEY (formation_id) REFERENCES formation(id)
);
COMMENT ON TABLE question IS 'Question d''évaluation rattachée à un module de formation (RF-17).';
COMMENT ON COLUMN question.id IS 'Identifiant technique';
COMMENT ON COLUMN question.enonce IS 'Énoncé bilingue';
COMMENT ON COLUMN question.ordre IS 'Ordre dans le quiz';
COMMENT ON COLUMN question.points IS 'Barème';
CREATE INDEX idx_question_formation_id ON question (formation_id);

CREATE TABLE choix_reponse (
  id                           uuid DEFAULT gen_random_uuid(),
  libelle                      varchar(240) NOT NULL,
  correcte                     boolean NOT NULL,
  ordre                        integer NOT NULL,
  question_id                  uuid NOT NULL,
  CONSTRAINT pk_choix_reponse PRIMARY KEY (id),
  CONSTRAINT fk_choix_reponse_question_id FOREIGN KEY (question_id) REFERENCES question(id) ON DELETE CASCADE
);
COMMENT ON TABLE choix_reponse IS 'Proposition de réponse, une seule correcte par question (RF-17).';
COMMENT ON COLUMN choix_reponse.id IS 'Identifiant technique';
COMMENT ON COLUMN choix_reponse.libelle IS 'Texte du choix';
COMMENT ON COLUMN choix_reponse.correcte IS 'Bonne réponse';
COMMENT ON COLUMN choix_reponse.ordre IS 'Ordre d’affichage';
CREATE INDEX idx_choix_reponse_question_id ON choix_reponse (question_id);

CREATE TABLE inscription_formation (
  id                           uuid DEFAULT gen_random_uuid(),
  date_inscription             timestamptz NOT NULL,
  progression_pct              integer NOT NULL,
  score                        integer NOT NULL,
  statut                       varchar(16) NOT NULL,
  utilisateur_id               uuid NOT NULL,
  formation_id                 uuid NOT NULL,
  CONSTRAINT pk_inscription_formation PRIMARY KEY (id),
  CONSTRAINT ck_inscription_formation_statut CHECK (statut IN ('inscrit', 'en_cours', 'termine', 'abandonne')),
  CONSTRAINT fk_inscription_formation_utilisateur_id FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id),
  CONSTRAINT fk_inscription_formation_formation_id FOREIGN KEY (formation_id) REFERENCES formation(id)
);
COMMENT ON TABLE inscription_formation IS 'Suivi individuel : progression et score (RF-17).';
COMMENT ON COLUMN inscription_formation.id IS 'Identifiant technique';
COMMENT ON COLUMN inscription_formation.date_inscription IS 'Date d’inscription';
COMMENT ON COLUMN inscription_formation.progression_pct IS 'Progression de 0 à 100';
COMMENT ON COLUMN inscription_formation.score IS 'Score du quiz';
COMMENT ON COLUMN inscription_formation.statut IS 'État';
CREATE INDEX idx_inscription_formation_formation_id ON inscription_formation (formation_id);

-- ==================================================================
-- D4 — Alertes, météo et sensibilisation (modules M5 · M10)
-- ==================================================================

CREATE TABLE alerte (
  id                           uuid DEFAULT gen_random_uuid(),
  type_alerte                  varchar(24) NOT NULL,
  niveau                       varchar(16) NOT NULL,
  titre                        varchar(160) NOT NULL,
  message_mg                   text NOT NULL,
  message_fr                   text NOT NULL,
  consignes_mg                 text,
  consignes_fr                 text,
  priorite                     integer NOT NULL,
  date_emission                timestamptz NOT NULL,
  date_fin                     timestamptz,
  statut                       varchar(16) NOT NULL,
  emetteur_id                  uuid,
  CONSTRAINT pk_alerte PRIMARY KEY (id),
  CONSTRAINT ck_alerte_type_alerte CHECK (type_alerte IN ('cyclone', 'fortes_pluies', 'secheresse', 'ravageurs', 'prix')),
  CONSTRAINT ck_alerte_niveau CHECK (niveau IN ('info', 'vigilance', 'alerte', 'urgence')),
  CONSTRAINT ck_alerte_statut CHECK (statut IN ('brouillon', 'emise', 'cloturee')),
  CONSTRAINT fk_alerte_emetteur_id FOREIGN KEY (emetteur_id) REFERENCES utilisateur(id)
);
COMMENT ON TABLE alerte IS 'Alerte climatique ou sanitaire émise par le BNGRC ou la météo, prioritaire sur tout autre message (RF-20 à RF-23, RG-04).';
COMMENT ON COLUMN alerte.id IS 'Identifiant technique';
COMMENT ON COLUMN alerte.type_alerte IS 'Phénomène';
COMMENT ON COLUMN alerte.niveau IS 'Gravité';
COMMENT ON COLUMN alerte.titre IS 'Titre bilingue';
COMMENT ON COLUMN alerte.message_mg IS 'Message en malagasy';
COMMENT ON COLUMN alerte.message_fr IS 'Message en français';
COMMENT ON COLUMN alerte.consignes_mg IS 'Consignes de protection (RF-22)';
COMMENT ON COLUMN alerte.consignes_fr IS 'Consignes de protection (RF-22)';
COMMENT ON COLUMN alerte.priorite IS 'Priorité de diffusion (RG-04)';
COMMENT ON COLUMN alerte.date_emission IS 'Début de validité';
COMMENT ON COLUMN alerte.date_fin IS 'Fin de validité';
COMMENT ON COLUMN alerte.statut IS 'État';
CREATE INDEX idx_alerte_emetteur_id ON alerte (emetteur_id);

CREATE TABLE ciblage_alerte (
  id                           uuid DEFAULT gen_random_uuid(),
  alerte_id                    uuid NOT NULL,
  zone_id                      uuid NOT NULL,
  CONSTRAINT pk_ciblage_alerte PRIMARY KEY (id),
  CONSTRAINT fk_ciblage_alerte_alerte_id FOREIGN KEY (alerte_id) REFERENCES alerte(id) ON DELETE CASCADE,
  CONSTRAINT fk_ciblage_alerte_zone_id FOREIGN KEY (zone_id) REFERENCES zone(id) ON DELETE CASCADE
);
COMMENT ON TABLE ciblage_alerte IS 'Zones couvertes par une alerte (RF-23) ; une alerte peut viser plusieurs communes.';
COMMENT ON COLUMN ciblage_alerte.id IS 'Identifiant technique';
CREATE INDEX idx_ciblage_alerte_zone_id ON ciblage_alerte (zone_id);

CREATE TABLE notification (
  id                           uuid DEFAULT gen_random_uuid(),
  canal                        varchar(8) NOT NULL,
  titre                        varchar(160) NOT NULL,
  message                      text NOT NULL,
  statut                       varchar(16) NOT NULL,
  date_envoi                   timestamptz,
  date_lecture                 timestamptz,
  alerte_id                    uuid,
  utilisateur_id               uuid NOT NULL,
  etape_planifiee_id           uuid,
  CONSTRAINT pk_notification PRIMARY KEY (id),
  CONSTRAINT ck_notification_canal CHECK (canal IN ('push', 'sms', 'ussd')),
  CONSTRAINT ck_notification_statut CHECK (statut IN ('en_attente', 'envoye', 'echec', 'lu', 'accuse')),
  CONSTRAINT fk_notification_alerte_id FOREIGN KEY (alerte_id) REFERENCES alerte(id),
  CONSTRAINT fk_notification_utilisateur_id FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id),
  CONSTRAINT fk_notification_etape_planifiee_id FOREIGN KEY (etape_planifiee_id) REFERENCES etape_planifiee(id)
);
COMMENT ON TABLE notification IS 'Message envoyé à un utilisateur par push, SMS ou USSD, avec accusé de réception (RF-12, RF-21, RF-24).';
COMMENT ON COLUMN notification.id IS 'Identifiant technique';
COMMENT ON COLUMN notification.canal IS 'Canal de diffusion';
COMMENT ON COLUMN notification.titre IS 'Titre';
COMMENT ON COLUMN notification.message IS 'Contenu envoyé';
COMMENT ON COLUMN notification.statut IS 'État de diffusion';
COMMENT ON COLUMN notification.date_envoi IS 'Date d’envoi';
COMMENT ON COLUMN notification.date_lecture IS 'Date de lecture / d’accusé';
CREATE INDEX idx_notification_etape_planifiee_id ON notification (etape_planifiee_id);

CREATE TABLE donnee_pluviometrique (
  id                           uuid DEFAULT gen_random_uuid(),
  date_mesure                  date NOT NULL,
  pluie_mm                     numeric(6,1) NOT NULL,
  source                       varchar(60) NOT NULL,
  zone_id                      uuid NOT NULL,
  CONSTRAINT pk_donnee_pluviometrique PRIMARY KEY (id),
  CONSTRAINT fk_donnee_pluviometrique_zone_id FOREIGN KEY (zone_id) REFERENCES zone(id)
);
COMMENT ON TABLE donnee_pluviometrique IS 'Relevé journalier par zone, base du calcul du déficit de pluie (RF-25).';
COMMENT ON COLUMN donnee_pluviometrique.id IS 'Identifiant technique';
COMMENT ON COLUMN donnee_pluviometrique.date_mesure IS 'Jour du relevé';
COMMENT ON COLUMN donnee_pluviometrique.pluie_mm IS 'Hauteur de pluie';
COMMENT ON COLUMN donnee_pluviometrique.source IS 'Station ou fournisseur';

CREATE TABLE message_sensibilisation (
  id                           uuid DEFAULT gen_random_uuid(),
  titre                        varchar(160) NOT NULL,
  contenu_mg                   text NOT NULL,
  contenu_fr                   text NOT NULL,
  date_debut                   date NOT NULL,
  date_fin                     date NOT NULL,
  statut                       varchar(16) NOT NULL,
  auteur_id                    uuid,
  CONSTRAINT pk_message_sensibilisation PRIMARY KEY (id),
  CONSTRAINT ck_message_sensibilisation_statut CHECK (statut IN ('brouillon', 'actif', 'clos')),
  CONSTRAINT fk_message_sensibilisation_auteur_id FOREIGN KEY (auteur_id) REFERENCES utilisateur(id)
);
COMMENT ON TABLE message_sensibilisation IS 'Message de sensibilisation ciblé par commune ou Fokontany (RF-18).';
COMMENT ON COLUMN message_sensibilisation.id IS 'Identifiant technique';
COMMENT ON COLUMN message_sensibilisation.titre IS 'Titre';
COMMENT ON COLUMN message_sensibilisation.contenu_mg IS 'Contenu en malagasy';
COMMENT ON COLUMN message_sensibilisation.contenu_fr IS 'Contenu en français';
COMMENT ON COLUMN message_sensibilisation.date_debut IS 'Début de diffusion';
COMMENT ON COLUMN message_sensibilisation.date_fin IS 'Fin de diffusion';
COMMENT ON COLUMN message_sensibilisation.statut IS 'État';
CREATE INDEX idx_message_sensibilisation_auteur_id ON message_sensibilisation (auteur_id);

CREATE TABLE ciblage_message (
  id                           uuid DEFAULT gen_random_uuid(),
  message_id                   uuid NOT NULL,
  zone_id                      uuid NOT NULL,
  CONSTRAINT pk_ciblage_message PRIMARY KEY (id),
  CONSTRAINT fk_ciblage_message_message_id FOREIGN KEY (message_id) REFERENCES message_sensibilisation(id) ON DELETE CASCADE,
  CONSTRAINT fk_ciblage_message_zone_id FOREIGN KEY (zone_id) REFERENCES zone(id) ON DELETE CASCADE
);
COMMENT ON TABLE ciblage_message IS 'Zones destinataires d''un message de sensibilisation (RF-18).';
COMMENT ON COLUMN ciblage_message.id IS 'Identifiant technique';
CREATE INDEX idx_ciblage_message_zone_id ON ciblage_message (zone_id);

-- ==================================================================
-- D5 — Matériel agricole (modules M6)
-- ==================================================================

CREATE TABLE type_materiel (
  id                           uuid DEFAULT gen_random_uuid(),
  code                         varchar(32) NOT NULL,
  libelle                      varchar(120) NOT NULL,
  categorie                    varchar(24) NOT NULL,
  description                  text NOT NULL,
  CONSTRAINT pk_type_materiel PRIMARY KEY (id),
  CONSTRAINT uk_type_materiel_code UNIQUE (code),
  CONSTRAINT ck_type_materiel_categorie CHECK (categorie IN ('travail_sol', 'semis', 'repiquage', 'sarclage', 'moisson', 'battage', 'transport'))
);
COMMENT ON TABLE type_materiel IS 'Référentiel des équipements : angady, charrue, herse, motoculteur, sarcleuse, faucille, batteuse (RF-06, RF-16, RF-26).';
COMMENT ON COLUMN type_materiel.id IS 'Identifiant technique';
COMMENT ON COLUMN type_materiel.code IS 'Code du type';
COMMENT ON COLUMN type_materiel.libelle IS 'Libellé';
COMMENT ON COLUMN type_materiel.categorie IS 'Étape concernée';
COMMENT ON COLUMN type_materiel.description IS 'Usage et coût indicatif';

CREATE TABLE equipement (
  id                           uuid DEFAULT gen_random_uuid(),
  libelle                      varchar(160) NOT NULL,
  mode                         varchar(16) NOT NULL,
  tarif_journalier_mga         numeric(10,0),
  etat                         varchar(16) NOT NULL,
  quantite                     integer NOT NULL,
  type_materiel_id             uuid NOT NULL,
  proprietaire_org_id          uuid,
  zone_id                      uuid NOT NULL,
  CONSTRAINT pk_equipement PRIMARY KEY (id),
  CONSTRAINT ck_equipement_mode CHECK (mode IN ('location', 'pret', 'collectif')),
  CONSTRAINT ck_equipement_etat CHECK (etat IN ('disponible', 'reserve', 'maintenance', 'hors_service')),
  CONSTRAINT fk_equipement_type_materiel_id FOREIGN KEY (type_materiel_id) REFERENCES type_materiel(id),
  CONSTRAINT fk_equipement_proprietaire_org_id FOREIGN KEY (proprietaire_org_id) REFERENCES organisation(id),
  CONSTRAINT fk_equipement_zone_id FOREIGN KEY (zone_id) REFERENCES zone(id)
);
COMMENT ON TABLE equipement IS 'Matériel réel mis à disposition par le CFAMA, une coopérative, une ONG ou un Fokontany (RF-26 à RF-29).';
COMMENT ON COLUMN equipement.id IS 'Identifiant technique';
COMMENT ON COLUMN equipement.libelle IS 'Désignation';
COMMENT ON COLUMN equipement.mode IS 'Modalité de mise à disposition';
COMMENT ON COLUMN equipement.tarif_journalier_mga IS 'Tarif indicatif par jour';
COMMENT ON COLUMN equipement.etat IS 'Disponibilité';
COMMENT ON COLUMN equipement.quantite IS 'Nombre d’unités identiques';
CREATE INDEX idx_equipement_type_materiel_id ON equipement (type_materiel_id);
CREATE INDEX idx_equipement_proprietaire_org_id ON equipement (proprietaire_org_id);
CREATE INDEX idx_equipement_zone_id ON equipement (zone_id);

CREATE TABLE reservation (
  id                           uuid DEFAULT gen_random_uuid(),
  date_debut                   date NOT NULL,
  date_fin                     date NOT NULL,
  statut                       varchar(16) NOT NULL,
  date_demande                 timestamptz NOT NULL,
  date_reponse                 timestamptz,
  motif_refus                  varchar(240),
  equipement_id                uuid NOT NULL,
  demandeur_id                 uuid NOT NULL,
  CONSTRAINT pk_reservation PRIMARY KEY (id),
  CONSTRAINT ck_reservation_statut CHECK (statut IN ('demandee', 'confirmee', 'refusee', 'annulee', 'terminee')),
  CONSTRAINT fk_reservation_equipement_id FOREIGN KEY (equipement_id) REFERENCES equipement(id),
  CONSTRAINT fk_reservation_demandeur_id FOREIGN KEY (demandeur_id) REFERENCES utilisateur(id)
);
COMMENT ON TABLE reservation IS 'Demande de location ou de prêt sur une période, confirmée par le propriétaire (RF-27, RF-28).';
COMMENT ON COLUMN reservation.id IS 'Identifiant technique';
COMMENT ON COLUMN reservation.date_debut IS 'Début de la période';
COMMENT ON COLUMN reservation.date_fin IS 'Fin de la période';
COMMENT ON COLUMN reservation.statut IS 'État';
COMMENT ON COLUMN reservation.date_demande IS 'Date de la demande';
COMMENT ON COLUMN reservation.date_reponse IS 'Date de la réponse';
COMMENT ON COLUMN reservation.motif_refus IS 'Motif éventuel';

CREATE TABLE maintenance (
  id                           uuid DEFAULT gen_random_uuid(),
  date_intervention            date NOT NULL,
  type_maintenance             varchar(16) NOT NULL,
  cout_mga                     numeric(10,0),
  description                  text,
  statut                       varchar(16) NOT NULL,
  equipement_id                uuid NOT NULL,
  CONSTRAINT pk_maintenance PRIMARY KEY (id),
  CONSTRAINT ck_maintenance_type_maintenance CHECK (type_maintenance IN ('preventive', 'corrective')),
  CONSTRAINT ck_maintenance_statut CHECK (statut IN ('planifiee', 'en_cours', 'terminee')),
  CONSTRAINT fk_maintenance_equipement_id FOREIGN KEY (equipement_id) REFERENCES equipement(id)
);
COMMENT ON TABLE maintenance IS 'Suivi de l''état et des interventions sur le matériel (RF-29).';
COMMENT ON COLUMN maintenance.id IS 'Identifiant technique';
COMMENT ON COLUMN maintenance.date_intervention IS 'Date prévue ou réalisée';
COMMENT ON COLUMN maintenance.type_maintenance IS 'Nature';
COMMENT ON COLUMN maintenance.cout_mga IS 'Coût de l’intervention';
COMMENT ON COLUMN maintenance.description IS 'Travaux réalisés';
COMMENT ON COLUMN maintenance.statut IS 'État';

-- ==================================================================
-- D6 — GCV, stocks, crédit et prix (modules M7)
-- ==================================================================

CREATE TABLE gcv (
  id                           uuid DEFAULT gen_random_uuid(),
  nom                          varchar(160) NOT NULL,
  capacite_t                   numeric(8,2),
  reglement                    text NOT NULL,
  date_ouverture               date,
  statut                       varchar(16) NOT NULL,
  organisation_id              uuid,
  responsable_id               uuid NOT NULL,
  zone_id                      uuid NOT NULL,
  CONSTRAINT pk_gcv PRIMARY KEY (id),
  CONSTRAINT ck_gcv_statut CHECK (statut IN ('ouvert', 'suspendu', 'ferme')),
  CONSTRAINT fk_gcv_organisation_id FOREIGN KEY (organisation_id) REFERENCES organisation(id),
  CONSTRAINT fk_gcv_responsable_id FOREIGN KEY (responsable_id) REFERENCES utilisateur(id),
  CONSTRAINT fk_gcv_zone_id FOREIGN KEY (zone_id) REFERENCES zone(id)
);
COMMENT ON TABLE gcv IS 'Grenier Commun Villageois : membres, dépôts, retraits et valeur du stock (RF-31).';
COMMENT ON COLUMN gcv.id IS 'Identifiant technique';
COMMENT ON COLUMN gcv.nom IS 'Nom du grenier';
COMMENT ON COLUMN gcv.capacite_t IS 'Capacité de stockage (tonnes)';
COMMENT ON COLUMN gcv.reglement IS 'Règles de fonctionnement et de décision collective';
COMMENT ON COLUMN gcv.date_ouverture IS 'Date d’ouverture';
COMMENT ON COLUMN gcv.statut IS 'État';
CREATE INDEX idx_gcv_organisation_id ON gcv (organisation_id);
CREATE INDEX idx_gcv_responsable_id ON gcv (responsable_id);
CREATE INDEX idx_gcv_zone_id ON gcv (zone_id);

CREATE TABLE membre_gcv (
  id                           uuid DEFAULT gen_random_uuid(),
  role_membre                  varchar(24) NOT NULL,
  date_adhesion                date NOT NULL,
  statut                       varchar(16) NOT NULL,
  exploitation_id              uuid NOT NULL,
  gcv_id                       uuid NOT NULL,
  CONSTRAINT pk_membre_gcv PRIMARY KEY (id),
  CONSTRAINT ck_membre_gcv_role_membre CHECK (role_membre IN ('membre', 'tresorier', 'president')),
  CONSTRAINT ck_membre_gcv_statut CHECK (statut IN ('actif', 'sorti')),
  CONSTRAINT fk_membre_gcv_exploitation_id FOREIGN KEY (exploitation_id) REFERENCES exploitation(id),
  CONSTRAINT fk_membre_gcv_gcv_id FOREIGN KEY (gcv_id) REFERENCES gcv(id)
);
COMMENT ON TABLE membre_gcv IS 'Adhésion d''une exploitation à un grenier, avec rôle interne (RF-31).';
COMMENT ON COLUMN membre_gcv.id IS 'Identifiant technique';
COMMENT ON COLUMN membre_gcv.role_membre IS 'Fonction dans le grenier';
COMMENT ON COLUMN membre_gcv.date_adhesion IS 'Date d’adhésion';
COMMENT ON COLUMN membre_gcv.statut IS 'État';

CREATE TABLE decision_collective (
  id                           uuid DEFAULT gen_random_uuid(),
  objet                        varchar(160) NOT NULL,
  date_decision                date NOT NULL,
  quorum_pct                   integer,
  proces_verbal                text,
  gcv_id                       uuid NOT NULL,
  secretaire_id                uuid NOT NULL,
  CONSTRAINT pk_decision_collective PRIMARY KEY (id),
  CONSTRAINT fk_decision_collective_gcv_id FOREIGN KEY (gcv_id) REFERENCES gcv(id),
  CONSTRAINT fk_decision_collective_secretaire_id FOREIGN KEY (secretaire_id) REFERENCES utilisateur(id)
);
COMMENT ON TABLE decision_collective IS 'Décision de l''assemblée du grenier autorisant un retrait ou une mise en garantie (RG-06).';
COMMENT ON COLUMN decision_collective.id IS 'Identifiant technique';
COMMENT ON COLUMN decision_collective.objet IS 'Objet de la décision';
COMMENT ON COLUMN decision_collective.date_decision IS 'Date de l’assemblée';
COMMENT ON COLUMN decision_collective.quorum_pct IS 'Quorum atteint';
COMMENT ON COLUMN decision_collective.proces_verbal IS 'Compte rendu';
CREATE INDEX idx_decision_collective_secretaire_id ON decision_collective (secretaire_id);

CREATE TABLE mouvement_stock (
  id                           uuid DEFAULT gen_random_uuid(),
  type_mouvement               varchar(8) NOT NULL,
  quantite_kg                  numeric(10,2) NOT NULL,
  qualite                      varchar(16),
  date_mouvement               timestamptz NOT NULL,
  membre_id                    uuid NOT NULL,
  enregistre_par_id            uuid NOT NULL,
  decision_id                  uuid,
  CONSTRAINT pk_mouvement_stock PRIMARY KEY (id),
  CONSTRAINT ck_mouvement_stock_type_mouvement CHECK (type_mouvement IN ('depot', 'retrait')),
  CONSTRAINT ck_mouvement_stock_qualite CHECK (qualite IN ('bonne', 'moyenne', 'faible')),
  CONSTRAINT fk_mouvement_stock_membre_id FOREIGN KEY (membre_id) REFERENCES membre_gcv(id),
  CONSTRAINT fk_mouvement_stock_enregistre_par_id FOREIGN KEY (enregistre_par_id) REFERENCES utilisateur(id),
  CONSTRAINT fk_mouvement_stock_decision_id FOREIGN KEY (decision_id) REFERENCES decision_collective(id)
);
COMMENT ON TABLE mouvement_stock IS 'Dépôt ou retrait de paddy, avec reçu numérique et décision collective éventuelle (RF-31, RF-32, RG-06).';
COMMENT ON COLUMN mouvement_stock.id IS 'Identifiant technique';
COMMENT ON COLUMN mouvement_stock.type_mouvement IS 'Sens du mouvement';
COMMENT ON COLUMN mouvement_stock.quantite_kg IS 'Poids de paddy';
COMMENT ON COLUMN mouvement_stock.qualite IS 'Qualité constatée';
COMMENT ON COLUMN mouvement_stock.date_mouvement IS 'Horodatage';
CREATE INDEX idx_mouvement_stock_enregistre_par_id ON mouvement_stock (enregistre_par_id);
CREATE INDEX idx_mouvement_stock_decision_id ON mouvement_stock (decision_id);

CREATE TABLE recu (
  id                           uuid DEFAULT gen_random_uuid(),
  numero                       varchar(24) NOT NULL,
  date_emission                timestamptz NOT NULL,
  url_pdf                      text,
  mouvement_id                 uuid NOT NULL,
  CONSTRAINT pk_recu PRIMARY KEY (id),
  CONSTRAINT uk_recu_numero UNIQUE (numero),
  CONSTRAINT fk_recu_mouvement_id FOREIGN KEY (mouvement_id) REFERENCES mouvement_stock(id) ON DELETE CASCADE
);
COMMENT ON TABLE recu IS 'Reçu remis pour chaque dépôt ou retrait (RF-32), numéro unique et PDF archivable.';
COMMENT ON COLUMN recu.id IS 'Identifiant technique';
COMMENT ON COLUMN recu.numero IS 'Numéro de reçu';
COMMENT ON COLUMN recu.date_emission IS 'Date d’émission';
COMMENT ON COLUMN recu.url_pdf IS 'Document généré';

CREATE TABLE demande_credit (
  id                           uuid DEFAULT gen_random_uuid(),
  montant_demande_mga          numeric(12,0) NOT NULL,
  montant_accorde_mga          numeric(12,0),
  objet                        varchar(160),
  statut                       varchar(16) NOT NULL,
  date_demande                 date NOT NULL,
  date_decision                date,
  exploitation_id              uuid NOT NULL,
  imf_organisation_id          uuid NOT NULL,
  campagne_id                  uuid NOT NULL,
  instructeur_id               uuid,
  CONSTRAINT pk_demande_credit PRIMARY KEY (id),
  CONSTRAINT ck_demande_credit_statut CHECK (statut IN ('soumise', 'etude', 'accordee', 'refusee', 'decaissee', 'remboursee')),
  CONSTRAINT fk_demande_credit_exploitation_id FOREIGN KEY (exploitation_id) REFERENCES exploitation(id),
  CONSTRAINT fk_demande_credit_imf_organisation_id FOREIGN KEY (imf_organisation_id) REFERENCES organisation(id),
  CONSTRAINT fk_demande_credit_campagne_id FOREIGN KEY (campagne_id) REFERENCES campagne(id),
  CONSTRAINT fk_demande_credit_instructeur_id FOREIGN KEY (instructeur_id) REFERENCES utilisateur(id)
);
COMMENT ON TABLE demande_credit IS 'Dossier de crédit de campagne déposé auprès d''une IMF, avec le stock comme garantie (RF-33).';
COMMENT ON COLUMN demande_credit.id IS 'Identifiant technique';
COMMENT ON COLUMN demande_credit.montant_demande_mga IS 'Montant sollicité';
COMMENT ON COLUMN demande_credit.montant_accorde_mga IS 'Montant accordé';
COMMENT ON COLUMN demande_credit.objet IS 'Semences, main-d’œuvre, location…';
COMMENT ON COLUMN demande_credit.statut IS 'Avancement';
COMMENT ON COLUMN demande_credit.date_demande IS 'Date de dépôt';
COMMENT ON COLUMN demande_credit.date_decision IS 'Date de décision';
CREATE INDEX idx_demande_credit_imf_organisation_id ON demande_credit (imf_organisation_id);
CREATE INDEX idx_demande_credit_campagne_id ON demande_credit (campagne_id);
CREATE INDEX idx_demande_credit_instructeur_id ON demande_credit (instructeur_id);

CREATE TABLE garantie_stock (
  id                           uuid DEFAULT gen_random_uuid(),
  quantite_kg                  numeric(10,2) NOT NULL,
  valeur_mga                   numeric(12,0) NOT NULL,
  demande_credit_id            uuid NOT NULL,
  gcv_id                       uuid NOT NULL,
  CONSTRAINT pk_garantie_stock PRIMARY KEY (id),
  CONSTRAINT fk_garantie_stock_demande_credit_id FOREIGN KEY (demande_credit_id) REFERENCES demande_credit(id) ON DELETE CASCADE,
  CONSTRAINT fk_garantie_stock_gcv_id FOREIGN KEY (gcv_id) REFERENCES gcv(id) ON DELETE CASCADE
);
COMMENT ON TABLE garantie_stock IS 'Stock de paddy affecté en garantie d''un crédit (RF-33), valorisé au prix du marché.';
COMMENT ON COLUMN garantie_stock.id IS 'Identifiant technique';
COMMENT ON COLUMN garantie_stock.quantite_kg IS 'Quantité nantie';
COMMENT ON COLUMN garantie_stock.valeur_mga IS 'Valorisation retenue';
CREATE INDEX idx_garantie_stock_demande_credit_id ON garantie_stock (demande_credit_id);
CREATE INDEX idx_garantie_stock_gcv_id ON garantie_stock (gcv_id);

CREATE TABLE prix_marche (
  id                           uuid DEFAULT gen_random_uuid(),
  date_releve                  date NOT NULL,
  prix_kg_mga                  numeric(8,0) NOT NULL,
  marche                       varchar(120) NOT NULL,
  source                       varchar(60) NOT NULL,
  zone_id                      uuid NOT NULL,
  variete_id                   uuid NOT NULL,
  campagne_id                  uuid NOT NULL,
  CONSTRAINT pk_prix_marche PRIMARY KEY (id),
  CONSTRAINT fk_prix_marche_zone_id FOREIGN KEY (zone_id) REFERENCES zone(id),
  CONSTRAINT fk_prix_marche_variete_id FOREIGN KEY (variete_id) REFERENCES variete(id),
  CONSTRAINT fk_prix_marche_campagne_id FOREIGN KEY (campagne_id) REFERENCES campagne(id)
);
COMMENT ON TABLE prix_marche IS 'Relevé de prix du riz par marché et par variété (RF-34, RF-35).';
COMMENT ON COLUMN prix_marche.id IS 'Identifiant technique';
COMMENT ON COLUMN prix_marche.date_releve IS 'Date du relevé';
COMMENT ON COLUMN prix_marche.prix_kg_mga IS 'Prix au kilo';
COMMENT ON COLUMN prix_marche.marche IS 'Marché ou lieu de vente';
COMMENT ON COLUMN prix_marche.source IS 'Source du relevé';
CREATE INDEX idx_prix_marche_variete_id ON prix_marche (variete_id);
CREATE INDEX idx_prix_marche_campagne_id ON prix_marche (campagne_id);

-- ==================================================================
-- D7 — Suivi de production, sinistres et infrastructures (modules M8 · M9)
-- ==================================================================

CREATE TABLE sinistre (
  id                           uuid DEFAULT gen_random_uuid(),
  type_sinistre                varchar(16) NOT NULL,
  date_survenance              date NOT NULL,
  superficie_touchee_ha        numeric(6,2) NOT NULL,
  description                  text,
  latitude                     numeric(9,6),
  longitude                    numeric(9,6),
  statut                       varchar(16) NOT NULL,
  date_transmission            timestamptz NOT NULL,
  parcelle_id                  uuid NOT NULL,
  alerte_id                    uuid,
  declarant_id                 uuid NOT NULL,
  CONSTRAINT pk_sinistre PRIMARY KEY (id),
  CONSTRAINT ck_sinistre_type_sinistre CHECK (type_sinistre IN ('inondation', 'cyclone', 'secheresse', 'ravageurs')),
  CONSTRAINT ck_sinistre_statut CHECK (statut IN ('signale', 'transmis', 'en_traitement', 'cloture')),
  CONSTRAINT fk_sinistre_parcelle_id FOREIGN KEY (parcelle_id) REFERENCES parcelle(id),
  CONSTRAINT fk_sinistre_alerte_id FOREIGN KEY (alerte_id) REFERENCES alerte(id),
  CONSTRAINT fk_sinistre_declarant_id FOREIGN KEY (declarant_id) REFERENCES utilisateur(id)
);
COMMENT ON TABLE sinistre IS 'Déclaration d''inondation, cyclone, sécheresse ou ravageurs avec photo et position (RF-42, RF-43).';
COMMENT ON COLUMN sinistre.id IS 'Identifiant technique';
COMMENT ON COLUMN sinistre.type_sinistre IS 'Nature';
COMMENT ON COLUMN sinistre.date_survenance IS 'Date du phénomène';
COMMENT ON COLUMN sinistre.superficie_touchee_ha IS 'Superficie impactée';
COMMENT ON COLUMN sinistre.description IS 'Description des dégâts';
COMMENT ON COLUMN sinistre.latitude IS 'Position GPS';
COMMENT ON COLUMN sinistre.longitude IS 'Position GPS';
COMMENT ON COLUMN sinistre.statut IS 'Traitement';
COMMENT ON COLUMN sinistre.date_transmission IS 'Transmission au BNGRC';
CREATE INDEX idx_sinistre_alerte_id ON sinistre (alerte_id);
CREATE INDEX idx_sinistre_declarant_id ON sinistre (declarant_id);

CREATE TABLE photo_sinistre (
  id                           uuid DEFAULT gen_random_uuid(),
  url                          text NOT NULL,
  date_prise                   timestamptz NOT NULL,
  sinistre_id                  uuid NOT NULL,
  CONSTRAINT pk_photo_sinistre PRIMARY KEY (id),
  CONSTRAINT fk_photo_sinistre_sinistre_id FOREIGN KEY (sinistre_id) REFERENCES sinistre(id) ON DELETE CASCADE
);
COMMENT ON TABLE photo_sinistre IS 'Preuve photographique d''un sinistre (RF-42), collectée même hors ligne puis synchronisée.';
COMMENT ON COLUMN photo_sinistre.id IS 'Identifiant technique';
COMMENT ON COLUMN photo_sinistre.url IS 'Fichier stocké';
COMMENT ON COLUMN photo_sinistre.date_prise IS 'Date de prise de vue';
CREATE INDEX idx_photo_sinistre_sinistre_id ON photo_sinistre (sinistre_id);

CREATE TABLE infrastructure (
  id                           uuid DEFAULT gen_random_uuid(),
  nom                          varchar(160) NOT NULL,
  type_infrastructure          varchar(16) NOT NULL,
  longueur_m                   numeric(8,1),
  etat                         varchar(16) NOT NULL,
  latitude                     numeric(9,6),
  longitude                    numeric(9,6),
  zone_id                      uuid NOT NULL,
  CONSTRAINT pk_infrastructure PRIMARY KEY (id),
  CONSTRAINT ck_infrastructure_type_infrastructure CHECK (type_infrastructure IN ('digue', 'barrage', 'canal')),
  CONSTRAINT ck_infrastructure_etat CHECK (etat IN ('bon', 'degrade', 'hors_service')),
  CONSTRAINT fk_infrastructure_zone_id FOREIGN KEY (zone_id) REFERENCES zone(id)
);
COMMENT ON TABLE infrastructure IS 'Digue, barrage ou canal d''irrigation à entretenir (RF-44, RF-45).';
COMMENT ON COLUMN infrastructure.id IS 'Identifiant technique';
COMMENT ON COLUMN infrastructure.nom IS 'Nom de l’ouvrage';
COMMENT ON COLUMN infrastructure.type_infrastructure IS 'Type';
COMMENT ON COLUMN infrastructure.longueur_m IS 'Linéaire';
COMMENT ON COLUMN infrastructure.etat IS 'État constaté';
COMMENT ON COLUMN infrastructure.latitude IS 'Position GPS';
COMMENT ON COLUMN infrastructure.longitude IS 'Position GPS';
CREATE INDEX idx_infrastructure_zone_id ON infrastructure (zone_id);

CREATE TABLE signalement_infra (
  id                           uuid DEFAULT gen_random_uuid(),
  description                  text NOT NULL,
  gravite                      varchar(16) NOT NULL,
  statut                       varchar(16) NOT NULL,
  date_signalement             timestamptz NOT NULL,
  date_traitement              timestamptz,
  url_photo                    text,
  infrastructure_id            uuid NOT NULL,
  auteur_id                    uuid NOT NULL,
  CONSTRAINT pk_signalement_infra PRIMARY KEY (id),
  CONSTRAINT ck_signalement_infra_gravite CHECK (gravite IN ('faible', 'moyenne', 'forte')),
  CONSTRAINT ck_signalement_infra_statut CHECK (statut IN ('nouveau', 'transmis', 'en_reparation', 'repare')),
  CONSTRAINT fk_signalement_infra_infrastructure_id FOREIGN KEY (infrastructure_id) REFERENCES infrastructure(id),
  CONSTRAINT fk_signalement_infra_auteur_id FOREIGN KEY (auteur_id) REFERENCES utilisateur(id)
);
COMMENT ON TABLE signalement_infra IS 'Signalement d''une infrastructure à réparer, suivi jusqu''à la réparation (RF-44).';
COMMENT ON COLUMN signalement_infra.id IS 'Identifiant technique';
COMMENT ON COLUMN signalement_infra.description IS 'Désordre constaté';
COMMENT ON COLUMN signalement_infra.gravite IS 'Gravité';
COMMENT ON COLUMN signalement_infra.statut IS 'Traitement';
COMMENT ON COLUMN signalement_infra.date_signalement IS 'Date du signalement';
COMMENT ON COLUMN signalement_infra.date_traitement IS 'Date de clôture';
COMMENT ON COLUMN signalement_infra.url_photo IS 'Photo jointe';
CREATE INDEX idx_signalement_infra_infrastructure_id ON signalement_infra (infrastructure_id);
CREATE INDEX idx_signalement_infra_auteur_id ON signalement_infra (auteur_id);

CREATE TABLE rapport_visite (
  id                           uuid DEFAULT gen_random_uuid(),
  date_visite                  date NOT NULL,
  duree_min                    integer,
  conseils                     text NOT NULL,
  nb_exploitants               integer,
  agent_id                     uuid NOT NULL,
  exploitation_id              uuid NOT NULL,
  CONSTRAINT pk_rapport_visite PRIMARY KEY (id),
  CONSTRAINT fk_rapport_visite_agent_id FOREIGN KEY (agent_id) REFERENCES utilisateur(id),
  CONSTRAINT fk_rapport_visite_exploitation_id FOREIGN KEY (exploitation_id) REFERENCES exploitation(id)
);
COMMENT ON TABLE rapport_visite IS 'Compte rendu de la visite d''un agent de terrain : exploitants rencontrés, conseils donnés (RF-41).';
COMMENT ON COLUMN rapport_visite.id IS 'Identifiant technique';
COMMENT ON COLUMN rapport_visite.date_visite IS 'Date de la visite';
COMMENT ON COLUMN rapport_visite.duree_min IS 'Durée';
COMMENT ON COLUMN rapport_visite.conseils IS 'Conseils et observations';
COMMENT ON COLUMN rapport_visite.nb_exploitants IS 'Nombre d’exploitants rencontrés';
CREATE INDEX idx_rapport_visite_agent_id ON rapport_visite (agent_id);

-- ==================================================================
-- INDEX SECONDAIRES (PERFORMANCE)
-- ==================================================================
-- Index composites, partiels, couvrants et spécialisés (GiST, GIN, BRIN).
-- Les index de clés étrangères couverts par le préfixe gauche ne sont pas dupliqués.

-- Liste des destinataires d’une alerte par zone, sans lecture de la table (RF-23, RG-04).
CREATE INDEX idx_utilisateur_actif_zone ON utilisateur (zone_id) INCLUDE (telephone) WHERE statut = 'actif';

-- Un seul rôle actif par couple utilisateur/rôle ; contrôle des droits en une lecture (RF-02, RG-07).
CREATE UNIQUE INDEX idx_utilisateur_role_actif ON utilisateur_role (utilisateur_id, role_id) WHERE actif;

-- Un seul seuil actif par zone et type (RF-50) ; lu par v_indicateur_pluie.
CREATE UNIQUE INDEX idx_seuil_alerte_actif ON seuil_alerte (zone_id, type_alerte) WHERE actif;

-- Historique d’un objet précis, du plus récent au plus ancien (RF-49).
CREATE INDEX idx_journal_audit_entite ON journal_audit (entite, entite_id, date_action DESC);

-- Table append-only : BRIN tient en quelques pages et sert les purges et extractions par période.
CREATE INDEX idx_journal_audit_date ON journal_audit USING brin (date_action);

-- Tableaux de bord et ciblage par zone (RF-05, RF-38).
CREATE INDEX idx_exploitation_zone ON exploitation (zone_id, statut);

-- Liste et somme des surfaces d’une exploitation sans lire la table (RF-05, RF-37).
CREATE INDEX idx_parcelle_exploitation ON parcelle (exploitation_id, statut) INCLUDE (superficie_ha);

-- Intersection parcelle / zone sinistrée et cartographie (RF-08, RF-45).
CREATE INDEX idx_parcelle_geometrie ON parcelle USING gist (geometrie) WHERE geometrie IS NOT NULL;

-- Calendrier d’une parcelle pour une campagne (RF-09, RG-01).
CREATE INDEX idx_cycle_cultural_parcelle ON cycle_cultural (parcelle_id, campagne_id);

-- Étapes d’un cycle dans l’ordre chronologique (RF-09, RF-12).
CREATE INDEX idx_etape_planifiee_cycle ON etape_planifiee (cycle_id, date_prevue);

-- Rappels du jour : l’index ne contient que les étapes à venir (RF-12).
CREATE INDEX idx_etape_planifiee_rappels ON etape_planifiee (date_prevue) INCLUDE (cycle_id, etape_code) WHERE statut = 'prevue';

-- File des décalages en attente de validation (RF-11, RG-05).
CREATE INDEX idx_decalage_a_valider ON decalage (statut, date_proposee) WHERE statut = 'propose';

-- Dernière récolte d’un cycle, rendement et historique (RF-37).
CREATE INDEX idx_recolte_cycle_date ON recolte (cycle_id, date_recolte DESC);

-- Matériel déclaré par une exploitation, utilisé pour les conseils (RF-06, RF-39).
CREATE INDEX idx_possession_exploitation ON possession_materiel (exploitation_id, type_materiel_id);

-- Fiches publiées d’une étape culturale, les plus récentes d’abord (RF-14).
CREATE INDEX idx_fiche_technique_etape ON fiche_technique (etape_code, statut, date_publication DESC);

-- Recherche libre (ILIKE « %mot% ») dans les fiches sans parcours complet (RF-14).
CREATE INDEX idx_fiche_technique_recherche ON fiche_technique USING gin (titre_fr gin_trgm_ops, resume_fr gin_trgm_ops);

-- Illustrations, vidéos et audios d’une fiche par type (RF-15).
CREATE INDEX idx_media_fiche ON media (fiche_id, type_media);

-- Progression d’un apprenant dans ses formations (RF-17).
CREATE INDEX idx_inscription_utilisateur ON inscription_formation (utilisateur_id, statut);

-- Une seule inscription par utilisateur et par formation (RF-17).
CREATE UNIQUE INDEX idx_inscription_unique ON inscription_formation (utilisateur_id, formation_id);

-- Bandeau des alertes en cours, les plus récentes d’abord (RF-20, RG-04).
CREATE INDEX idx_alerte_emise ON alerte (date_emission DESC) WHERE statut = 'emise';

-- Évite de diffuser deux fois la même alerte dans la même zone (RF-23, RG-04).
CREATE UNIQUE INDEX idx_ciblage_alerte_unique ON ciblage_alerte (alerte_id, zone_id);

-- Évite les doublons de ciblage d’un message (RF-18).
CREATE UNIQUE INDEX idx_ciblage_message_unique ON ciblage_message (message_id, zone_id);

-- Boîte de réception d’un utilisateur, la plus récente d’abord (RF-21, RF-24).
CREATE INDEX idx_notification_utilisateur ON notification (utilisateur_id, date_envoi DESC);

-- File d’envoi : ne stocke que les messages à traiter, balayage d’index seul (RF-21, RF-24).
CREATE INDEX idx_notification_a_envoyer ON notification (date_envoi) INCLUDE (utilisateur_id, canal, alerte_id) WHERE statut IN ('en_attente', 'echec');

-- Compteur de messages non lus, sans lire l’historique complet (RF-24).
CREATE INDEX idx_notification_non_lues ON notification (utilisateur_id) INCLUDE (date_envoi) WHERE date_lecture IS NULL;

-- Suivi de la diffusion d’une alerte (envoyés, échecs) (RG-04).
CREATE INDEX idx_notification_alerte ON notification (alerte_id, statut);

-- Cumuls à 10 et 20 jours par zone (v_indicateur_pluie) et rejet des imports en double (RF-25).
CREATE UNIQUE INDEX idx_pluie_zone_date_source ON donnee_pluviometrique (zone_id, date_mesure DESC, source);

-- Recherche d’un matériel disponible dans une zone (v_disponibilite_materiel, RF-26, RF-27).
CREATE INDEX idx_equipement_disponible ON equipement (zone_id, type_materiel_id) INCLUDE (quantite, tarif_journalier_mga) WHERE etat = 'disponible';

-- Détection des chevauchements de réservation et calcul de disponibilité (RF-27).
CREATE INDEX idx_reservation_periode ON reservation (equipement_id, date_debut, date_fin) INCLUDE (statut);

-- Suivi des demandes d’un exploitant (RF-28).
CREATE INDEX idx_reservation_demandeur ON reservation (demandeur_id, statut);

-- Dernière maintenance et coût par équipement (RF-29).
CREATE INDEX idx_maintenance_equipement ON maintenance (equipement_id, date_intervention DESC);

-- Membres actifs d’un grenier (RF-31, RF-32).
CREATE INDEX idx_membre_gcv_gcv ON membre_gcv (gcv_id, statut);

-- Greniers fréquentés par une exploitation (RF-32).
CREATE INDEX idx_membre_gcv_exploitation ON membre_gcv (exploitation_id, statut);

-- Agrégat de v_stock_gcv calculé par balayage d’index seul, sans lire la table (RF-31).
CREATE INDEX idx_mouvement_stock_membre ON mouvement_stock (membre_id, qualite) INCLUDE (type_mouvement, quantite_kg);

-- Journal append-only : BRIN pour les états et purges par période (RF-31, RF-32).
CREATE INDEX idx_mouvement_stock_date ON mouvement_stock USING brin (date_mouvement);

-- Dernières décisions d’un grenier, préalables à un retrait (RF-34, RG-06).
CREATE INDEX idx_decision_collective_gcv ON decision_collective (gcv_id, date_decision DESC);

-- Un seul reçu par mouvement (association 1,1 A59, RF-32).
CREATE UNIQUE INDEX idx_recu_mouvement ON recu (mouvement_id);

-- File d’instruction des demandes de crédit (RF-33).
CREATE INDEX idx_demande_credit_file ON demande_credit (statut, date_demande) WHERE statut IN ('soumise', 'etude');

-- Crédits d’une exploitation pour une campagne (RF-33, RF-36).
CREATE INDEX idx_demande_credit_exploitation ON demande_credit (exploitation_id, campagne_id);

-- Dernier prix connu par zone et variété (RF-35).
CREATE INDEX idx_prix_marche_lookup ON prix_marche (zone_id, variete_id, date_releve DESC);

-- File de traitement BNGRC, du sinistre le plus récent au plus ancien (RF-43).
CREATE INDEX idx_sinistre_statut ON sinistre (statut, date_survenance DESC);

-- Sinistralité d’une parcelle sur plusieurs campagnes (RF-42, RF-45).
CREATE INDEX idx_sinistre_parcelle ON sinistre (parcelle_id, date_survenance DESC);

-- Suivi des signalements d’infrastructure par état (RF-44).
CREATE INDEX idx_signalement_statut ON signalement_infra (statut, date_signalement DESC);

-- Dernières visites d’une exploitation (RF-41).
CREATE INDEX idx_rapport_visite_exploitation ON rapport_visite (exploitation_id, date_visite DESC);

-- ==================================================================
-- PARAMÈTRES DE STOCKAGE ET D’AUTOVACUUM
-- ==================================================================

-- 5 à 10 M lignes/an, statut et date_lecture modifiés en continu.
ALTER TABLE notification SET (fillfactor = 85, autovacuum_vacuum_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.02);

-- Dates réelles et statuts mis à jour au fil de la campagne.
ALTER TABLE etape_planifiee SET (fillfactor = 90, autovacuum_analyze_scale_factor = 0.05);

-- Changements de statut fréquents (demandée → confirmée → close).
ALTER TABLE reservation SET (fillfactor = 90);

-- État et quantité réévalués à chaque réservation.
ALTER TABLE equipement SET (fillfactor = 90);

-- Passage signalé → transmis → traité, avec pièces jointes.
ALTER TABLE sinistre SET (fillfactor = 90);

-- Ligne complétée à la fin de chaque synchronisation.
ALTER TABLE synchronisation SET (fillfactor = 90);

-- Peu de mises à jour, mais diffusion massive en lecture.
ALTER TABLE alerte SET (fillfactor = 95);

-- Insertion seule : pages pleines, purge mensuelle.
ALTER TABLE journal_audit SET (fillfactor = 100, autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.05);

-- Insertion seule : écritures comptables jamais modifiées.
ALTER TABLE mouvement_stock SET (fillfactor = 100, autovacuum_analyze_scale_factor = 0.05);

-- ==================================================================
-- VUES ET CALCULS DÉRIVÉS
-- ==================================================================

-- v_stock_gcv : Stock de paddy par grenier, membre et qualité : Σ dépôts − Σ retraits (RF-31, RF-32).
CREATE VIEW v_stock_gcv AS
SELECT  m.gcv_id,
        s.membre_id,
        s.qualite,
        SUM(CASE WHEN s.type_mouvement = 'depot' THEN s.quantite_kg ELSE -s.quantite_kg END) AS stock_kg,
        SUM(CASE WHEN s.type_mouvement = 'depot' THEN s.quantite_kg ELSE -s.quantite_kg END) * 1000 AS stock_valeur_mga
FROM    mouvement_stock s
JOIN    membre_gcv m ON m.id = s.membre_id
GROUP BY m.gcv_id, s.membre_id, s.qualite;

-- v_indicateur_pluie : Cumuls de pluie à 10 et 20 jours et déficit par rapport au seuil de la zone (RF-25).
CREATE VIEW v_indicateur_pluie AS
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
GROUP BY p.zone_id, z.id, s.cumul_10j_mm, s.cumul_20j_mm;

-- v_rendement_parcelle : Rendement en t/ha par parcelle et campagne, comparable au matériel déclaré (RF-37, RF-39).
CREATE VIEW v_rendement_parcelle AS
SELECT  pa.id            AS parcelle_id,
        pa.exploitation_id,
        cy.campagne_id,
        cy.variete_id,
        pa.superficie_ha,
        r.quantite_paddy_kg,
        ROUND(r.quantite_paddy_kg / 1000 / NULLIF(pa.superficie_ha, 0), 2) AS rendement_t_ha
FROM    parcelle pa
JOIN    cycle_cultural cy ON cy.parcelle_id = pa.id
LEFT JOIN recolte r ON r.cycle_id = cy.id;

-- v_disponibilite_materiel : Équipements réellement disponibles à une date donnée, réservations confirmées déduites (RF-26, RF-27).
CREATE VIEW v_disponibilite_materiel AS
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
WHERE   e.etat = 'disponible';

-- v_tableau_bord_zone : Indicateurs agrégés par région/district pour le MAEP et le BNGRC (RF-38, RF-40, RG-07).
CREATE MATERIALIZED VIEW v_tableau_bord_zone AS
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
GROUP BY z.id, z.code, z.nom, z.type_zone, c.id;

-- Rafraîchissement concurrent et lecture par zone/campagne (RF-38, RF-40).
CREATE UNIQUE INDEX idx_v_tableau_bord_zone ON v_tableau_bord_zone (zone_id, campagne_id);

-- Filtre par campagne dans les tableaux de bord nationaux.
CREATE INDEX idx_v_tableau_bord_campagne ON v_tableau_bord_zone (campagne_id);

-- Rafraîchissement nocturne, sans bloquer les lectures.
-- REFRESH MATERIALIZED VIEW CONCURRENTLY v_tableau_bord_zone;
