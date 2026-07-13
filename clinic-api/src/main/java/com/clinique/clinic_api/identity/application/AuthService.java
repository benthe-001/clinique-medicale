package com.clinique.clinic_api.identity.application;

import com.clinique.clinic_api.identity.domain.User;
import com.clinique.clinic_api.identity.infrastructure.UserJpaRepository;
import com.clinique.clinic_api.identity.interfaces.dto.AuthResponse;
import com.clinique.clinic_api.identity.interfaces.dto.LoginRequest;
import com.clinique.clinic_api.identity.interfaces.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserJpaRepository userRepo;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse register(RegisterRequest req) {
        if (userRepo.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email déjà utilisé");
        }
        User user = User.builder()
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .nom(req.nom())
                .prenom(req.prenom())
                .role(req.role())
                .build();
        User savedUser = userRepo.save(user);
        String token = jwtService.generateToken(savedUser.getEmail(), savedUser.getRole().name(), savedUser.getId());
        return new AuthResponse(token, savedUser.getRole().name(), savedUser.getNom(), savedUser.getId());
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepo.findByEmail(req.email())
                .orElseThrow(() -> new IllegalArgumentException("Email ou mot de passe incorrect"));
        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new IllegalArgumentException("Email ou mot de passe incorrect");
        }
        if (!user.isActif()) {
            throw new IllegalArgumentException("Ce compte a été désactivé");
        }
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        return new AuthResponse(token, user.getRole().name(), user.getNom(), user.getId());
    }
}