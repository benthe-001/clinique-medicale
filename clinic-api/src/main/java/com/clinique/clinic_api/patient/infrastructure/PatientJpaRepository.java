package com.clinique.clinic_api.patient.infrastructure;

import com.clinique.clinic_api.patient.domain.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PatientJpaRepository extends JpaRepository<Patient, String> {

    Optional<Patient> findByEmail(String email);

    boolean existsByEmail(String email);

    // Recherche par nom ou prénom (insensible à la casse)
    @Query("SELECT p FROM Patient p WHERE " +
            "p.actif = true AND (" +
            "LOWER(p.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.prenom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Patient> searchPatients(@Param("search") String search);

    List<Patient> findByActifTrue();


}