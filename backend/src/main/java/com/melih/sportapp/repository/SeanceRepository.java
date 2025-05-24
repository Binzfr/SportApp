package com.melih.sportapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.melih.sportapp.model.Seance;

public interface SeanceRepository extends JpaRepository<Seance, Long> {}
