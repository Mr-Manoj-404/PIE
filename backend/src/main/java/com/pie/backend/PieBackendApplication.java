package com.pie.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PieBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(PieBackendApplication.class, args);
    }

}
