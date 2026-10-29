Cahier des charges — RizConnect Madagascar
Cahier des charges — RizConnect
Madagascar
Plateforme numérique d’appui aux riziculteurs malagasy · Version 1.0 · 20 octobre 2026
Document établi à partir du rapport « Les freins au développement de la riziculture à
Madagascar » (Projet transversal, Licence 2 Management de l’Environnement et Gestion
de Projet, ESMIA, 2019/2020). Le nom RizConnect est provisoire.
1. Présentation du projet
1.1 Contexte
Le riz est la culture principale de Madagascar. Le rapport source établit les constats
suivants :
le riz occupe environ 40 % des terres agricoles et représente la source de revenus de
86 % des ménages ruraux ;
plus de 70 % des producteurs sont riziculteurs, sur plus de 1,3 million d’hectares (78,8
% en riziculture irriguée, 8,4 % en pluviale, 12,9 % sur brûlis) ;
un Malagasy consomme en moyenne 110 à 140 kg de riz par an, mais la production ne
suit pas la croissance démographique ;
le rendement moyen reste d’environ 2 t/ha avec les techniques traditionnelles (FAO) ;
97,3 % des riziculteurs utilisent l’angady, tandis que tracteurs et motoculteurs sont peu
répandus ;
4 à 5 cyclones touchent l’île chaque année et la saison cyclonique (décembre à avril,
risque fort de janvier à mars) recoupe les périodes de repiquage et de sarclage ; la
sécheresse peut aussi retarder les semis, jusqu’à deux mois au lac Alaotra.
Le rapport conclut que les freins sont d’abord techniques (pratiques et outils
traditionnels) et climatiques. Il recommande de former et d’encadrer les paysans, de
mettre du matériel à leur disposition, de développer les Greniers Communs Villageois
(GCV), de diffuser des calendriers culturaux adaptés et de renforcer le rôle du BNGRC.
Ce cahier des charges traduit ces recommandations en un système d’information.
Page 1 of 10
1.2 Freins identifiés et réponses attendues
Les modules M1 à M10 sont décrits au § 3.
1.3 Objectifs
Objectif général : améliorer la productivité et la résilience de la riziculture malagasy en
donnant aux riziculteurs, aux agents de terrain et aux institutions des outils numériques
d’information, d’alerte et de coordination.
Objectifs spécifiques :
diffuser les techniques et le matériel adaptés à chacune des cinq étapes de la culture
(semis, repiquage, sarclage, moisson, battage) ;
alerter les exploitants avant les aléas climatiques et ajuster leur calendrier cultural ;
faciliter l’accès au matériel, au crédit et au stockage collectif ;
fournir au MAEP et au BNGRC des données actualisées sur les superficies, la
production et les sinistres.
Code Frein identifié dans le rapport Réponse attendue de la plateforme
F1 Techniques et outils traditionnels, faible
mécanisation, rendement d’environ 2
t/ha
Fiches techniques par étape et outils
modernes équivalents (M4)
F2 Outils améliorés peu connus (Kassine,
sous-soleuse, trisoc)
Catalogue et mutualisation du matériel
(M2, M6)
F3 Changement climatique, sécheresse,
variation des pluies
Calendrier adaptatif et alertes (M3, M5)
F4 Cyclones coïncidant avec le repiquage
et le sarclage
Alertes cycloniques et signalement des
sinistres (M5, M9)
F5 Faible capital, accès limité au crédit et
au stockage
GCV, stocks et demandes de crédit (M7)
F6 Encadrement et sensibilisation
insuffisants
Formation, messages de sensibilisation,
appui des agents (M1, M4, M8)
F7 Infrastructures hydrauliques à
entretenir, reconstruction après
catastrophe
Signalement et suivi des infrastructures
(M9)
F8 Données anciennes (2007-2010) et
absence d’enquête de terrain (COVID
19)
Collecte continue des données de
production (M2, M8)
Cahier des charges — RizConnect Madagascar
Page 2 of 10
1.4 Périmètre
Inclus : application mobile Android utilisable hors ligne, interface web de gestion, canaux
SMS et USSD, pilote dans les trois régions étudiées dans le rapport (Vakinankaratra,
Alaotra Mangoro, Sofia).
Exclus de la phase 1 : paiement mobile intégré, vente de riz en ligne, imagerie satellite,
application iOS, cultures autres que le riz.
1.5 Hypothèses de travail
Le rapport source est une étude documentaire et ne décrit pas de logiciel : la plateforme
est donc une interprétation de ses recommandations. Les volumes, tarifs et cibles
chiffrés de ce document sont des hypothèses à valider avec les parties prenantes.
2. Parties prenantes et acteurs
Acteur Rôle dans le système Besoins principaux
Riziculteur (exploitant) Utilisateur final de
l’application mobile
Conseils techniques,
calendrier, alertes, accès au
matériel et au crédit
Agent de terrain (MAEP,
ONG)
Accompagne les
exploitants des Fokontany
Saisir des données, former,
diffuser les messages
Responsable de
coopérative ou de GCV
Gère les stocks et le
matériel collectifs
Suivi des stocks, réservations,
reçus
Institution de
microfinance
Octroie les crédits de
campagne
Dossiers de demande,
garanties en stock
MAEP Pilote la politique rizicole Statistiques, diffusion des
calendriers
BNGRC Gestion des risques et des
catastrophes
Émettre des alertes, recevoir
les signalements
CFAMA et fournisseurs Formation et machines
agricoles
Catalogue, demandes de
location
Administrateur technique Exploite la plateforme Comptes, contenus,
supervision
Cahier des charges — RizConnect Madagascar
Page 3 of 10
3. Besoins fonctionnels
Priorités : M = indispensable (Must), S = important (Should), C = souhaitable (Could). La
colonne « Frein » renvoie aux codes du § 1.2.
3.1 M1 — Comptes et utilisateurs
3.2 M2 — Exploitations et parcelles
ID Exigence Prio. Frein
RF-01 Inscription par numéro de téléphone avec code de
vérification par SMS, en malagasy ou en français
M F6
RF-02 Gestion des profils et des rôles (exploitant, agent,
coopérative, IMF, MAEP, BNGRC, administrateur)
avec droits d’accès distincts
M —
RF-03 Rattachement de l’utilisateur à une zone
administrative (région, district, commune,
Fokontany)
M F3
RF-04 Inscription assistée par un agent de terrain pour les
exploitants sans smartphone
S F6
ID Exigence Prio. Frein
RF-05 Création d’une exploitation et de ses parcelles :
superficie, type (irriguée, pluviale, sur brûlis),
localisation
M F8
RF-06 Déclaration du matériel possédé (angady, charrue
et herse à bœufs, motoculteur, sarcleuse, faucille,
etc.)
M F1, F2
RF-07 Historique de campagne par parcelle : variété,
dates, intrants, rendement
S F8
RF-08 Tracé de la parcelle sur une carte pour calculer sa
superficie
C F8
Cahier des charges — RizConnect Madagascar
Page 4 of 10
3.3 M3 — Calendrier cultural
3.4 M4 — Bibliothèque technique et formation
ID Exigence Prio. Frein
RF-09 Génération d’un calendrier cultural par parcelle
(travail du sol, semis, repiquage, sarclage, moisson,
battage) selon la région et le type de riziculture
M F3, F4
RF-10 Affichage du calendrier superposé à la saison
cyclonique (décembre à avril, risque fort de janvier
à mars)
M F4
RF-11 Proposition de décalage des dates en cas de retard
des pluies, de sécheresse ou d’alerte, soumise à la
validation de l’exploitant
M F3, F4
RF-12 Rappels par notification ou SMS avant chaque
étape
M F1
RF-13 Diffusion par le MAEP d’un calendrier commun à un
même périmètre rizicole
S F3
ID Exigence Prio. Frein
RF-14 Fiches pratiques pour chacune des cinq étapes :
technique, outil traditionnel, outil moderne
équivalent
M F1
RF-15 Contenus en malagasy et en français avec
illustrations, courtes vidéos et lecture audio
M F6
RF-16 Présentation des outils peu connus (Kassine, sous
soleuse, trisoc, rayonneur, moissonneuse-batteuse,
batteuse) : usage, coût indicatif, lieux d’acquisition
M F2
RF-17 Modules de formation courts avec quiz et suivi de
progression
S F6
RF-18 Messages de sensibilisation (pratiques à adopter
ou à éviter) ciblés par commune ou Fokontany
S F6
RF-19 Recommandation de pratiques selon le matériel
déclaré et l’étape en cours
C F1
Cahier des charges — RizConnect Madagascar
Page 5 of 10
3.5 M5 — Alertes climatiques
3.6 M6 — Matériel agricole
ID Exigence Prio. Frein
RF-20 Réception de bulletins et d’alertes (cyclone, fortes
pluies, sécheresse) pour la zone de chaque
exploitant
M F3, F4
RF-21 Envoi des alertes par notification, par SMS et par
USSD en l’absence de données mobiles
M F4
RF-22 Alertes adaptées à l’étape en cours (par exemple
repiquage en période à risque) avec consignes de
protection
M F4
RF-23 Saisie d’alertes par le BNGRC ou le service
météorologique avec ciblage géographique
M F4
RF-24 Historique des alertes et accusé de réception S F4
RF-25 Indicateur de déficit de pluie sur 10 et 20 jours à
partir des données pluviométriques disponibles
C F3
ID Exigence Prio. Frein
RF-26 Catalogue de matériel (type, localisation, tarif,
disponibilité) alimenté par le CFAMA, les
coopératives, les ONG et les Fokontany
M F2
RF-27 Demande de réservation ou de location d’un
équipement pour une période donnée, avec
confirmation du propriétaire
M F1, F2
RF-28 Gestion du matériel collectif mis à disposition
gratuitement (planning, tour de rôle)
S F1
RF-29 Suivi de l’état et de la maintenance du matériel C F1
RF-30 Mise en relation avec les formations à l’usage des
machines agricoles
C F2
Cahier des charges — RizConnect Madagascar
Page 6 of 10
3.7 M7 — Financement, GCV et stocks
3.8 M8 — Suivi de production et tableaux de bord
ID Exigence Prio. Frein
RF-31 Gestion d’un GCV : membres, dépôts, retraits et
valeur du stock
M F5
RF-32 Registre des stocks en temps réel avec reçu
numérique pour chaque dépôt
M F5
RF-33 Demande de crédit de campagne auprès d’une
institution de microfinance, avec le stock comme
garantie, et suivi du statut
S F5
RF-34 Publication des prix du riz sur les marchés de la
région
S F5
RF-35 Alerte de prix favorable pour appuyer la décision
collective de vente
C F5
RF-36 Estimation du coût prévisionnel de campagne
(semences, main-d’œuvre, location)
C F5
ID Exigence Prio. Frein
RF-37 Déclaration de récolte par parcelle et calcul du
rendement en t/ha
M F8
RF-38 Tableau de bord par région et district : superficies,
production, rendement moyen, étapes en cours
M F8
RF-39 Comparaison des rendements selon le matériel et
les pratiques déclarés
S F1, F8
RF-40 Export des statistiques (CSV, PDF) pour le MAEP
et les partenaires
S F8
RF-41 Rapports de visite des agents de terrain (date,
exploitants rencontrés, conseils donnés)
S F6
Cahier des charges — RizConnect Madagascar
Page 7 of 10
3.9 M9 — Sinistres et infrastructures
3.10 M10 — Administration, notifications et synchronisation
3.11 Règles de gestion
RG-01 Un calendrier est rattaché à une parcelle, une région et un type de riziculture.
RG-02 Le premier sarclage est planifié 8 à 10 jours après le repiquage, un second au
moins deux semaines plus tard (valeurs par défaut issues du rapport, modifiables).
RG-03 Le repiquage est proposé lorsque les pousses atteignent 15 à 20 cm.
ID Exigence Prio. Frein
RF-42 Déclaration d’un sinistre (inondation, cyclone,
sécheresse, ravageurs) avec photo, position et
superficie touchée
M F4
RF-43 Transmission des signalements au BNGRC et à
l’agent de la zone, avec suivi du traitement
M F4, F7
RF-44 Signalement des digues, barrages et canaux
d’irrigation à réparer
S F7
RF-45 Cartographie des zones sinistrées à l’usage des
décideurs
S F4, F7
ID Exigence Prio. Frein
RF-46 Fonctionnement hors ligne de l’application et
synchronisation automatique au retour du réseau
M —
RF-47 Gestion centralisée des contenus (fiches,
messages, calendriers types) par des
administrateurs agronomes
M F6
RF-48 Passerelle SMS et USSD pour les fonctions
essentielles (alertes, calendrier, déclaration de
récolte)
M F4
RF-49 Journalisation des actions, sauvegardes et gestion
des droits
M —
RF-50 Paramétrage des régions, saisons, variétés et seuils
d’alerte
S F3
Cahier des charges — RizConnect Madagascar
Page 8 of 10
Cahier des charges — RizConnect Madagascar
RG-04 Une alerte cyclonique est prioritaire sur tous les autres messages et touche
toutes les exploitations de la zone ciblée.
RG-05 Un décalage de calendrier n’est jamais appliqué sans validation de l’exploitant
ou de son agent.
RG-06 Un retrait de stock du GCV suit la décision collective prévue par les règles du
grenier.
RG-07 Un exploitant ne voit que ses données, un agent celles de sa zone ; le MAEP et le
BNGRC accèdent à des données agrégées.
3.12 Scénarios d’usage principaux
Alerte cyclonique : le BNGRC saisit une alerte pour une liste de communes ; la
plateforme l’envoie par notification et par SMS aux exploitants concernés, rappelle les
consignes selon l’étape en cours et propose un décalage du calendrier.
Location de matériel : un exploitant consulte le catalogue de son Fokontany, réserve
une charrue ou un motoculteur pour deux jours et reçoit la confirmation du
propriétaire.
Stockage collectif : le responsable du GCV enregistre un dépôt de paddy, remet un
reçu numérique et, après décision collective, présente le stock comme garantie d’une
demande de crédit de campagne.
4. Besoins non fonctionnels
Catégorie
Exigence
Connectivité
Performance
Capacité
Disponibilité
Consultation et saisie possibles hors ligne ;
synchronisation automatique tolérante aux
connexions 2G/3G instables
Écran affiché en moins de 3 secondes sur un
smartphone Android 8 avec 2 Go de RAM ;
application de moins de 30 Mo
100 000 utilisateurs inscrits, 3 000 connexions
simultanées, envoi de 50 000 SMS d’alerte en
moins de 15 minutes
99 % par mois ; alerte cyclonique diffusée moins de
15 minutes après sa saisie
Page 9 of 10
5. Contraintes
Réseau : couverture mobile inégale en zone rurale, d’où le mode hors ligne et les canaux
SMS et USSD.
Équipement et alphabétisation : smartphones d’entrée de gamme, appareils souvent
partagés dans le foyer, niveaux de lecture variables.
Données : l’accès aux données météorologiques et aux statistiques agricoles dépend
de conventions avec le MAEP, le BNGRC et le service météorologique.
Enquête de terrain : le rapport source n’a pas pu en réaliser (pandémie de COVID-19) ;
une enquête auprès des riziculteurs et des agents est nécessaire avant la conception
détaillée.
Calendrier agricole : le pilote doit coïncider avec une campagne rizicole (préparation
du sol, semis, repiquage) ; la date de démarrage du projet est à caler en conséquence.
Financement : à rechercher auprès de partenaires (État, ONG, institutions de
microfinance, bailleurs).
Catégorie Exigence
Ergonomie Interface à icônes, gros boutons, lecture audio en
malagasy ; au moins 80 % de tâches réussies lors
des tests avec des riziculteurs
Langues Malagasy et français, ajout d’une langue sans
nouveau développement
Sécurité Authentification par code SMS, chiffrement des
échanges (TLS) et des données sensibles,
sauvegarde quotidienne, journal d’audit
Protection des données Conformité à la législation malgache sur les
données personnelles, consentement explicite,
localisation des parcelles non publique
Compatibilité Android 8 et plus, navigateurs web récents, SMS et
USSD sur tous les opérateurs
Maintenabilité Code documenté, tests automatisés couvrant au
moins 70 % du code, déploiement continu
Interopérabilité API REST ouvertes pour le MAEP, le BNGRC et le
service météorologique
Évolutivité Ajout de régions, saisons et variétés par simple
paramétrage
Cahier des charges — RizConnect Madagascar
Page 10 of 10