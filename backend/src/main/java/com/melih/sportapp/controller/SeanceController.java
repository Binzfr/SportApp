package com.melih.sportapp.controller;

import com.melih.sportapp.model.Seance;
import com.melih.sportapp.model.Exercice;
import com.melih.sportapp.model.User;
import com.melih.sportapp.repository.SeanceRepository;
import com.melih.sportapp.repository.ExerciceRepository;
import com.melih.sportapp.repository.UserRepository;
import com.melih.sportapp.service.YouTubeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/seances")
public class SeanceController {

    private final SeanceRepository repository;
    private final ExerciceRepository exerciceRepository;
    private final UserRepository userRepository;

    public SeanceController(SeanceRepository repository, ExerciceRepository exerciceRepository, UserRepository userRepository) {
        this.repository = repository;
        this.exerciceRepository = exerciceRepository;
        this.userRepository = userRepository;
    }

    @Autowired
    private YouTubeService youTubeService;

    @GetMapping
    public List<Seance> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Seance create(@RequestBody Seance seance, @RequestParam Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        seance.setUser(user);
        return repository.save(seance);
    }

    @PostMapping("/{seanceId}/exercices")
    public ResponseEntity<Seance> addExerciceToSeance(
            @PathVariable Long seanceId,
            @RequestBody Exercice exercice) {
        // Recherche automatique d'une vidéo courte si videoUrl vide
        if (exercice.getVideoUrl() == null || exercice.getVideoUrl().isBlank()) {
            try {
                String url = youTubeService.searchShortVideoUrl(exercice.getNom());
                if (url != null) exercice.setVideoUrl(url);
            } catch (Exception e) {
                exercice.setVideoUrl("");
                // log l’erreur si besoin
            }
        }
        return repository.findById(seanceId)
                .map(seance -> {
                    seance.getExercices().add(exercice);
                    repository.save(seance);
                    return ResponseEntity.ok(seance);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{seanceId}/exercices/{exerciceId}")
    public ResponseEntity<Seance> updateExerciceInSeance(
            @PathVariable Long seanceId,
            @PathVariable Long exerciceId,
            @RequestBody Exercice updatedExercice) {
        return repository.findById(seanceId)
                .map(seance -> {
                    seance.getExercices().stream()
                            .filter(exo -> exo.getId().equals(exerciceId))
                            .findFirst()
                            .ifPresent(exo -> {
                                exo.setNom(updatedExercice.getNom());
                                exo.setSeries(updatedExercice.getSeries());
                                exo.setRepetitions(updatedExercice.getRepetitions());
                                exo.setTempsRepos(updatedExercice.getTempsRepos());
                                exo.setVideoUrl(updatedExercice.getVideoUrl());
                            });
                    repository.save(seance);
                    return ResponseEntity.ok(seance);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{seanceId}/exercices/{exerciceId}")
    public ResponseEntity<Seance> deleteExerciceFromSeance(
            @PathVariable Long seanceId,
            @PathVariable Long exerciceId) {
        return repository.findById(seanceId)
                .map(seance -> {
                    seance.getExercices().removeIf(exo -> exo.getId().equals(exerciceId));
                    repository.save(seance);
                    return ResponseEntity.ok(seance);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me")
    public List<Seance> getMySeances() {
        var user = (com.melih.sportapp.model.User) org.springframework.security.core.context.SecurityContextHolder
            .getContext().getAuthentication().getPrincipal();
        return repository.findAll().stream()
            .filter(seance -> seance.getUser() != null && seance.getUser().getId().equals(user.getId()))
            .toList();
    }

    @PutMapping("/{seanceId}")
    public ResponseEntity<Seance> updateSeance(
            @PathVariable Long seanceId,
            @RequestBody Seance updatedSeance) {
        return repository.findById(seanceId)
                .map(seance -> {
                    seance.setDate(updatedSeance.getDate());
                    seance.setDescription(updatedSeance.getDescription());
                    repository.save(seance);
                    return ResponseEntity.ok(seance);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    
    @DeleteMapping("/{seanceId}")
    public ResponseEntity<Seance> deleteSeance(
            @PathVariable Long seanceId) {
        return repository.findById(seanceId)
                .map(seance -> {
                    repository.delete(seance);
                    return ResponseEntity.ok(seance);
                })
                .orElse(ResponseEntity.notFound().build());
    }

}
