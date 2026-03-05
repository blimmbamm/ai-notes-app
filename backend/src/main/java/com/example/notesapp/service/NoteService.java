package com.example.notesapp.service;

import com.example.notesapp.dto.NoteRequest;
import com.example.notesapp.dto.NoteResponse;
import com.example.notesapp.entity.NoteEntity;
import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.exception.NotFoundException;
import com.example.notesapp.repository.NoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final CurrentUserService currentUserService;

    public NoteService(NoteRepository noteRepository, CurrentUserService currentUserService) {
        this.noteRepository = noteRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> listNotes() {
        UserEntity user = currentUserService.getCurrentUser();
        return noteRepository.findByUserOrderByUpdatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public NoteResponse create(NoteRequest request) {
        UserEntity user = currentUserService.getCurrentUser();
        Instant now = Instant.now();

        NoteEntity note = NoteEntity.builder()
                .user(user)
                .title(request.title().trim())
                .content(request.content().trim())
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public NoteResponse update(Long id, NoteRequest request) {
        UserEntity user = currentUserService.getCurrentUser();
        NoteEntity note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new NotFoundException("Note not found"));

        note.setTitle(request.title().trim());
        note.setContent(request.content().trim());
        note.setUpdatedAt(Instant.now());

        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public void delete(Long id) {
        UserEntity user = currentUserService.getCurrentUser();
        NoteEntity note = noteRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new NotFoundException("Note not found"));
        noteRepository.delete(note);
    }

    private NoteResponse toResponse(NoteEntity note) {
        return new NoteResponse(
                note.getId(),
                note.getTitle(),
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt());
    }
}
