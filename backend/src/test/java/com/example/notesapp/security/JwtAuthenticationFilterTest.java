package com.example.notesapp.security;

import com.example.notesapp.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private AuthCookieService authCookieService;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @org.junit.jupiter.api.BeforeEach
    void setup() {
        when(authCookieService.readAccessToken(any()))
                .thenReturn(java.util.Optional.empty());
    }

    @Test
    void doFilterInternalSkipsWhenAuthorizationHeaderMissing() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(jwtService, never()).extractUsername(anyString());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternalSkipsWhenTokenCannotBeParsed() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer invalid");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(jwtService.extractUsername("invalid")).thenThrow(new RuntimeException("bad token"));

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }

    @Test
    void doFilterInternalSetsAuthenticationWhenTokenValid() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        UserDetails userDetails = User.builder()
                .username("u@example.com")
                .password("hash")
                .roles("USER")
                .build();

        when(jwtService.extractUsername("valid-token")).thenReturn("u@example.com");
        when(userDetailsService.loadUserByUsername("u@example.com")).thenReturn(userDetails);
        when(jwtService.isTokenValid("valid-token", "u@example.com")).thenReturn(true);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertEquals("u@example.com", SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @Test
    void doFilterInternalDoesNotReplaceExistingAuthentication() throws ServletException, IOException {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("existing@example.com", null)
        );

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(jwtService.extractUsername("valid-token")).thenReturn("u@example.com");

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        assertEquals("existing@example.com", SecurityContextHolder.getContext().getAuthentication().getName());
    }
}
