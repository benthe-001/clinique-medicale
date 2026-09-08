package com.clinique.clinic_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class ClinicApiApplication {


	public static void main(String[] args) {
		BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
		String hash = encoder.encode("Admin123!");
		System.out.println("MON NOUVEAU HASH : " + hash);
		SpringApplication.run(ClinicApiApplication.class, args);
	}

}
