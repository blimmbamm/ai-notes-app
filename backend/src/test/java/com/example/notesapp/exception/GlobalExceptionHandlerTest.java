package com.example.notesapp.exception;

import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.lang.reflect.Method;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleValidationReturnsBadRequestWithFieldErrors() throws Exception {
        Method method = DummyController.class.getDeclaredMethod("dummy", String.class);
        MethodParameter parameter = new MethodParameter(method, 0);
        BeanPropertyBindingResult result = new BeanPropertyBindingResult("", "request");
        result.addError(new FieldError("request", "email", "must not be blank"));

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, result);

        ResponseEntity<Map<String, Object>> response = handler.handleValidation(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Validation failed", response.getBody().get("message"));
        Map<?, ?> errors = (Map<?, ?>) response.getBody().get("errors");
        assertEquals("must not be blank", errors.get("email"));
        assertNotNull(response.getBody().get("timestamp"));
    }

    @Test
    void handleBadRequestReturnsStatusAndMessage() {
        ResponseEntity<Map<String, Object>> response = handler.handleBadRequest(new BadRequestException("bad"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("bad", response.getBody().get("message"));
    }

    @Test
    void handleNotFoundReturnsStatusAndMessage() {
        ResponseEntity<Map<String, Object>> response = handler.handleNotFound(new NotFoundException("missing"));

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("missing", response.getBody().get("message"));
    }

    @Test
    void handleBadCredentialsReturnsGenericUnauthorizedMessage() {
        ResponseEntity<Map<String, Object>> response = handler.handleBadCredentials(new BadCredentialsException("details"));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Invalid credentials", response.getBody().get("message"));
    }

    @Test
    void handleAuthenticationReturnsUnauthorizedWithExceptionMessage() {
        ResponseEntity<Map<String, Object>> response = handler.handleAuthentication(
                new InsufficientAuthenticationException("need auth")
        );

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("need auth", response.getBody().get("message"));
    }

    @Test
    void handleOtherReturnsInternalServerError() {
        ResponseEntity<Map<String, Object>> response = handler.handleOther(new RuntimeException("boom"));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("boom", response.getBody().get("message"));
    }

    private static class DummyController {
        @SuppressWarnings("unused")
        void dummy(String body) {
        }
    }
}
