package com.example.notesapp.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    @NotBlank
    private String frontendUrl;

    private final Auth auth = new Auth();

    private final Jwt jwt = new Jwt();

    @Getter
    @Setter
    public static class Auth {
        private final Cookies cookies = new Cookies();
    }

    @Getter
    @Setter
    public static class Jwt {
        @NotBlank
        private String secret;

        @Min(1)
        private long accessTokenMinutes = 15;

        @Min(1)
        private long refreshTokenDays = 14;

        @Min(1)
        private long resetTokenMinutes = 60;
    }

    @Getter
    @Setter
    public static class Cookies {
        @NotBlank
        private String accessTokenName = "access_token";

        @NotBlank
        private String refreshTokenName = "refresh_token";

        @NotBlank
        private String sameSite = "Lax";

        private boolean secure = false;

        private String domain;
    }
}
