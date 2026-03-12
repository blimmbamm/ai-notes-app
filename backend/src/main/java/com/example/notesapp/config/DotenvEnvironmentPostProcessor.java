package com.example.notesapp.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Dotenv dotenv = loadDotenv();

        Map<String, Object> values = new HashMap<>();
        dotenv.entries().forEach(entry -> values.put(entry.getKey(), entry.getValue()));

        if (!values.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource("dotenv", values));
        }
    }

    private Dotenv loadDotenv() {
        Path cwd = Paths.get("").toAbsolutePath().normalize();
        List<Path> candidates = List.of(
                cwd,
                cwd.resolve("backend"),
                cwd.resolve("..").resolve("backend").normalize()
        );

        for (Path candidate : candidates) {
            if (Files.exists(candidate.resolve(".env"))) {
                return Dotenv.configure()
                        .directory(candidate.toString())
                        .ignoreIfMissing()
                        .load();
            }
        }

        return Dotenv.configure()
                .ignoreIfMissing()
                .load();
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
