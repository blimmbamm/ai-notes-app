package com.example.notesapp.controller;

import com.example.notesapp.dto.AccountResponse;
import com.example.notesapp.dto.MessageResponse;
import com.example.notesapp.service.AccountService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/me")
    public AccountResponse me() {
        return accountService.getCurrentAccount();
    }

    @PostMapping("/password-reset-request")
    public MessageResponse requestPasswordReset() {
        accountService.requestPasswordResetForCurrentUser();
        return new MessageResponse("If the email is registered, a password reset link has been sent.");
    }

    @DeleteMapping
    public MessageResponse deleteAccount() {
        accountService.deleteCurrentAccount();
        return new MessageResponse("Account deleted");
    }
}
