package com.clinique.clinic_api.appointment.application;

import com.clinique.clinic_api.appointment.domain.Appointment;
import com.clinique.clinic_api.appointment.domain.AppointmentStatus;
import com.clinique.clinic_api.appointment.domain.TimeSlot;
import com.clinique.clinic_api.appointment.infrastructure.AppointmentJpaRepository;
import com.clinique.clinic_api.appointment.interfaces.dto.AppointmentRequest;
import com.clinique.clinic_api.appointment.interfaces.dto.AppointmentResponse;
import com.clinique.clinic_api.messaging.application.MessageService;
import com.clinique.clinic_api.messaging.domain.Message.MessageType;
import com.clinique.clinic_api.patient.infrastructure.PatientJpaRepository;
import com.clinique.clinic_api.shared.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentJpaRepository appointmentRepo;
    private final MessageService messageService;
    private final PatientJpaRepository patientRepo;
    private final EmailService emailService;

    @Transactional
    public AppointmentResponse creerRdv(AppointmentRequest req) {

        if (appointmentRepo.existsConflitMedecin(
                req.medecinId(), req.debut(), req.fin())) {
            throw new IllegalStateException(
                    "Le médecin a déjà un rendez-vous sur ce créneau");
        }

        if (appointmentRepo.existsConflitPatientMemeJour(
                req.patientId(), req.debut())) {
            throw new IllegalStateException(
                    "Ce patient a déjà un rendez-vous ce jour-là");
        }

        Appointment rdv = Appointment.builder()
                .patientId(req.patientId())
                .medecinId(req.medecinId())
                .timeSlot(new TimeSlot(req.debut(), req.fin()))
                .motif(req.motif())
                .salle(req.salle())
                .notes(req.notes())
                .build();

        Appointment saved = appointmentRepo.save(rdv);

        String contenu = "Nouveau RDV le " +
                saved.getTimeSlot().getDebut()
                        .format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));
        if (req.motif() != null) contenu += " — " + req.motif();

        messageService.envoyerNotification(
                req.medecinId(),
                contenu,
                MessageType.NOTIFICATION
        );

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listerTous() {
        return appointmentRepo.findAllWithActivePatient()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listerParMedecin(String medecinId) {
        return appointmentRepo.findByMedecinIdWithActivePatient(medecinId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listerParPatient(String patientId) {
        return appointmentRepo
                .findByPatientIdAndStatusNot(patientId, AppointmentStatus.ANNULE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listerParPeriode(
            LocalDateTime debut, LocalDateTime fin) {
        return appointmentRepo.findByPeriode(debut, fin)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AppointmentResponse confirmer(String id) {
        Appointment rdv = getOrThrow(id);
        rdv.setStatus(AppointmentStatus.CONFIRME);
        return toResponse(appointmentRepo.save(rdv));
    }

    @Transactional
    public AppointmentResponse annuler(String id) {

        Appointment rdv = getOrThrow(id);

        if (LocalDateTime.now().isAfter(
                rdv.getTimeSlot().getDebut().minusHours(24))) {
            throw new IllegalStateException(
                    "Annulation impossible moins de 24h avant le rendez-vous");
        }

        rdv.setStatus(AppointmentStatus.ANNULE);
        return toResponse(appointmentRepo.save(rdv));
    }

    @Transactional
    public AppointmentResponse terminer(String id) {
        Appointment rdv = getOrThrow(id);
        rdv.setStatus(AppointmentStatus.TERMINE);
        return toResponse(appointmentRepo.save(rdv));
    }

    /**
     * Envoie un rappel (notification in-app au médecin + email au patient) pour tout RDV
     * actif dont le début tombe dans les 24h à venir et qui n'a pas déjà été rappelé.
     * Appelée périodiquement par AppointmentReminderScheduler.
     */
    @Transactional
    public void envoyerRappels() {
        LocalDateTime maintenant = LocalDateTime.now();
        LocalDateTime limite = maintenant.plusHours(24);

        List<Appointment> aRappeler = appointmentRepo.findRdvARappeler(
                List.of(AppointmentStatus.ANNULE, AppointmentStatus.TERMINE),
                maintenant,
                limite
        );

        for (Appointment rdv : aRappeler) {
            String dateFormatee = rdv.getTimeSlot().getDebut()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));

            try {
                messageService.envoyerNotification(
                        rdv.getMedecinId(),
                        "Rappel : RDV le " + dateFormatee + (rdv.getMotif() != null ? " — " + rdv.getMotif() : ""),
                        MessageType.RAPPEL
                );
            } catch (Exception e) {
                System.err.println("Échec notification rappel médecin pour RDV " + rdv.getId() + " : " + e.getMessage());
            }

            patientRepo.findById(rdv.getPatientId()).ifPresent(patient -> {
                if (patient.getEmail() != null && !patient.getEmail().isBlank()) {
                    try {
                        emailService.envoyerEmail(
                                patient.getEmail(),
                                "Rappel de rendez-vous - Clinique Médicale",
                                "Bonjour " + patient.getPrenom() + ",\n\n" +
                                        "Nous vous rappelons votre rendez-vous prévu le " + dateFormatee +
                                        (rdv.getSalle() != null ? " (salle " + rdv.getSalle() + ")" : "") + ".\n\n" +
                                        "Merci de vous présenter quelques minutes en avance.\n\n" +
                                        "Clinique Médicale"
                        );
                    } catch (Exception e) {
                        System.err.println("Échec email rappel pour RDV " + rdv.getId() + " : " + e.getMessage());
                    }
                }
            });

            rdv.setRappelEnvoye(true);
            appointmentRepo.save(rdv);
        }
    }

    private Appointment getOrThrow(String id) {
        return appointmentRepo.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Rendez-vous introuvable"));
    }

    private AppointmentResponse toResponse(Appointment a) {
        return new AppointmentResponse(
                a.getId(),
                a.getPatientId(),
                a.getMedecinId(),
                a.getTimeSlot().getDebut(),
                a.getTimeSlot().getFin(),
                a.getMotif(),
                a.getSalle(),
                a.getNotes(),
                a.getStatus(),
                a.getCreatedAt()
        );
    }
}