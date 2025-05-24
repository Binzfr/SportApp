# 🏋️‍♂️ SportApp – ToDo List

## ✅ Fait

- [x] Création du projet Spring Boot
- [x] Dépendances Spring Boot (web, data-jpa, security, lombok, h2, validation, jjwt)
- [x] Configuration H2 + console accessible
- [x] Entité `User` (username, email, password)
- [x] Entité `Seance` (id, date, description, user)
- [x] Entité `Exercice` (nom, séries, répétitions, tempsRepos, videoUrl)
- [x] Repository `UserRepository`
- [x] Repository `SeanceRepository`
- [x] Repository `ExerciceRepository`
- [x] Contrôleur `HelloController` (test)
- [x] Contrôleur `SeanceController` (GET/POST)
- [x] Endpoint pour ajouter un exercice à une séance
- [x] Endpoint pour modifier un exercice d’une séance
- [x] Endpoint pour supprimer un exercice d’une séance
- [x] Endpoint pour modifier une séance
- [x] Endpoint pour supprimer une séance
- [x] Authentification : `/auth/register` et `/auth/login` (avec JWT)
- [x] Hash du mot de passe avec BCrypt
- [x] Lier chaque séance à un utilisateur (`@ManyToOne User` dans `Seance`)
- [x] Sécuriser les endpoints (JWT obligatoire sauf `/auth/**` et `/h2-console/**`)
- [x] Récupérer les séances de l’utilisateur connecté
- [x] Service pour rechercher une vidéo YouTube (RestTemplate)
- [x] Enregistrer automatiquement l’URL de la vidéo dans `Exercice` si non fournie

---

## 🟡 À faire

### 💪 Gestion des séances & exercices
- [ ] Endpoint pour créer une séance avec plusieurs exercices

### 🎥 YouTube API
- [ ] Améliorer la pertinence de la recherche vidéo (ex : filtrer sur la durée, la langue, etc.)

### 📊 Frontend (React + Vite + TailwindCSS)
- [ ] Créer le projet frontend
- [ ] Pages : Login/Register, Dashboard, Création séance, Détail séance, Ajout exercice
- [ ] Afficher un graphe (nombre de séances/mois)

### 🐳 Dockerisation
- [ ] Dockerfile backend
- [ ] Dockerfile frontend
- [ ] docker-compose.yml (backend, frontend, PostgreSQL)

---

## 🧪 Bonus (optionnel)
- [ ] Timer sur la page d’exécution d’une séance
- [ ] Export PDF d’une séance
- [ ] Profil utilisateur avec photo

---

**N’hésite pas à cocher au fur et à mesure !**