markdown

\# Clinique Médicale — Plateforme de gestion



Application de gestion d'une clinique : patients, rendez-vous, ordonnances,

facturation et messagerie interne.



Le projet expose deux interfaces distinctes consommant la même API :

un front Angular et un front React.



\## Architecture



| Composant | Technologie | Dossier |

|---|---|---|

| API | Spring Boot 3.3 / Java 21, Spring Modulith, JWT | `clinic-api` |

| Front Angular | Angular 19, Tailwind | `clinic-frontend` |

| Front React | React 19, Vite, TanStack Query | `clinique-medicale-front` |

| Base de données | PostgreSQL 16 | conteneur |



Les migrations de schéma sont gérées par Flyway et s'appliquent

automatiquement au démarrage du backend.



\## Prérequis



\- Docker Desktop (avec Docker Compose v2)

\- Les ports 80, 81, 8081 et 5432 libres sur la machine hôte



Aucune installation de Java, Node ou PostgreSQL n'est nécessaire :

tout est construit dans les conteneurs.



\## Démarrage



Copier le fichier d'exemple de configuration :



copy .env.example .env





Sous Linux ou macOS : `cp .env.example .env`



Ouvrir `.env` et renseigner au minimum ces deux variables, qui n'ont

pas de valeur par défaut et bloqueront le démarrage si elles sont vides :



| Variable | Description |

|---|---|

| `POSTGRES\_PASSWORD` | Mot de passe du compte PostgreSQL, libre |

| `JWT\_SECRET` | Clé de signature des jetons, 32 caractères minimum |



Les variables `MAIL\_USERNAME` et `MAIL\_PASSWORD` peuvent rester vides :

les notifications par email sont alors simplement désactivées.



Construire et lancer :



docker compose up -d --build





Le premier lancement prend plusieurs minutes : compilation Maven et

installation des dépendances npm des deux fronts.



Suivre le démarrage :



docker compose ps





Attendre que `clinic\_backend` affiche `healthy`. Le backend accepte

les connexions avant d'être marqué comme tel, mais les migrations

Flyway doivent être terminées pour que les comptes soient disponibles.



\## URLs d'accès



| Interface | URL |

|---|---|

| Front Angular | http://localhost |

| Front React | http://localhost:81 |

| Documentation API (Swagger) | http://localhost:8081/swagger-ui.html |

| Santé de l'API | http://localhost:8081/actuator/health |



\## Comptes de test



Ces comptes sont créés par la migration Flyway `V10\_\_seed\_test\_accounts.sql`.

Ils sont recréés automatiquement après un `docker compose down -v`.



| Email | Mot de passe | Rôle |

|---|---|---|

| admin@clinique.com | Passer@123 | ADMIN |

| medecin@clinique.com | Passer@123 | MEDECIN |

| medecin2@clinique.com | Passer@123 | MEDECIN |

| secretaire@clinique.com | Passer@123 | SECRETAIRE |



\## Arrêt



Arrêter les conteneurs en conservant les données :



docker compose down





Tout supprimer, y compris la base de données :



docker compose down -v





\## Dépannage



\*\*Un port est déjà occupé\*\*



Le message ressemble à `bind: address already in use`. Le port 80 est

fréquemment pris sous Windows par IIS ou un autre service. Modifier les

ports dans le `.env` :



ANGULAR\_PORT=4200

REACT\_PORT=4201

API\_PORT=8081

DB\_PORT=5432





Puis relancer avec `docker compose up -d`. Les ports internes des

conteneurs ne changent pas, la communication entre services reste

inchangée.



\*\*Le démarrage échoue avec `POSTGRES\_PASSWORD manquant`\*\*



Le fichier `.env` n'a pas été créé ou la variable n'est pas renseignée.

Reprendre l'étape de copie du `.env.example`.



\*\*Le backend reste en `health: starting` ou redémarre en boucle\*\*



Consulter les journaux :



docker compose logs backend --tail 50





Une erreur `Could not resolve placeholder` indique une variable absente

du `.env`. Une erreur Flyway `Validate failed` signifie que la base

contient un état incompatible : `docker compose down -v` puis relancer.



\*\*Une modification du code n'a aucun effet\*\*



Les fichiers de configuration sont empaquetés dans les images au moment

de la construction. Après toute modification d'`application.yml`, d'un

`nginx.conf` ou du code source, reconstruire explicitement :



docker compose up -d --build





Si le cache Docker persiste : `docker compose build --no-cache <service>`.



\*\*Une page reste blanche ou renvoie une erreur de connexion\*\*



Vérifier que le conteneur concerné tourne réellement :



docker compose ps

docker compose logs frontend-react --tail 30





Un statut `Restarting` indique une erreur de configuration nginx.



\*\*Erreurs CORS ou 403 depuis un front\*\*



Les fronts appellent l'API en URL relative, via le proxy nginx. Si un

appel part vers `http://localhost:8081` en direct, c'est qu'un fichier

`.env` local a été inclus dans l'image de construction. Vérifier le

`.dockerignore` du front concerné.



\## Notes techniques



Les deux fronts sont servis par nginx, qui assure le proxy vers l'API

sur les chemins `/api` et `/ws`. Les appels restent donc same-origin

et aucune configuration CORS n'est nécessaire côté navigateur.



Les jetons JWT ont une durée de validité de 24 heures, configurable

via `JWT\_EXPIRATION` dans le `.env`.

