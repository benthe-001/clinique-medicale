package com.clinique.clinic_api.appointment.infrastructure;

import com.clinique.clinic_api.appointment.domain.Appointment;
import com.clinique.clinic_api.appointment.domain.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentJpaRepository extends JpaRepository<Appointment, String> {

    // Vérifie doublon médecin
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE " +
            "a.medecinId = :medecinId AND " +
            "a.status != 'ANNULE' AND " +
            "a.timeSlot.debut < :fin AND " +
            "a.timeSlot.fin > :debut")
    boolean existsConflitMedecin(
            @Param("medecinId") String medecinId,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );

    // Vérifie doublon patient même jour
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE " +
            "a.patientId = :patientId AND " +
            "a.status != 'ANNULE' AND " +
            "CAST(a.timeSlot.debut AS date) = CAST(:debut AS date)")
    boolean existsConflitPatientMemeJour(
            @Param("patientId") String patientId,
            @Param("debut") LocalDateTime debut
    );

    // RDV d'un médecin
    List<Appointment> findByMedecinIdAndStatusNot(
            String medecinId,
            AppointmentStatus status
    );

    // RDV d'un patient
    List<Appointment> findByPatientIdAndStatusNot(
            String patientId,
            AppointmentStatus status
    );

    // RDV entre deux dates
    @Query("SELECT a FROM Appointment a WHERE " +
            "a.timeSlot.debut >= :debut AND " +
            "a.timeSlot.debut <= :fin AND " +
            "a.status != 'ANNULE'")
    List<Appointment> findByPeriode(
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin
    );

    // RDV à rappeler : actifs, pas déjà rappelés, dont le début tombe dans la fenêtre [maintenant, limite]
    @Query("SELECT a FROM Appointment a WHERE " +
            "a.status NOT IN :statutsExclus AND " +
            "a.rappelEnvoye = false AND " +
            "a.timeSlot.debut <= :limite AND " +
            "a.timeSlot.debut > :maintenant")
    List<Appointment> findRdvARappeler(
            @Param("statutsExclus") List<AppointmentStatus> statutsExclus,
            @Param("maintenant") LocalDateTime maintenant,
            @Param("limite") LocalDateTime limite
    );

    @Query("SELECT a FROM Appointment a WHERE " +
            "EXISTS (SELECT p FROM Patient p WHERE p.id = a.patientId AND p.actif = true)")
    List<Appointment> findAllWithActivePatient();

    // Et la variante par médecin
    @Query("SELECT a FROM Appointment a WHERE " +
            "a.medecinId = :medecinId AND " +
            "a.status != 'ANNULE' AND " +
            "EXISTS (SELECT p FROM Patient p WHERE p.id = a.patientId AND p.actif = true)")
    List<Appointment> findByMedecinIdWithActivePatient(
            @Param("medecinId") String medecinId
    );
}