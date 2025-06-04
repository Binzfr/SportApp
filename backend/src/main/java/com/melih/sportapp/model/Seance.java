package com.melih.sportapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Seance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime date;
    private String description;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "seance_id")
    private List<Exercice> exercices = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String frequencyDay; // ex: "Thursday"
    private Integer frequencyMonths; // ex: 5

    // Getters et setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Exercice> getExercices() {
        return exercices;
    }

    public void setExercices(List<Exercice> exercices) {
        this.exercices = exercices;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getFrequencyDay() {
        return frequencyDay;
    }

    public void setFrequencyDay(String frequencyDay) {
        this.frequencyDay = frequencyDay;
    }

    public Integer getFrequencyMonths() {
        return frequencyMonths;
    }

    public void setFrequencyMonths(Integer frequencyMonths) {
        this.frequencyMonths = frequencyMonths;
    }
}
