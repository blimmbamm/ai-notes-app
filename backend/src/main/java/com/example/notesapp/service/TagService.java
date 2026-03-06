package com.example.notesapp.service;

import com.example.notesapp.entity.TagEntity;
import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.exception.BadRequestException;
import com.example.notesapp.exception.NotFoundException;
import com.example.notesapp.repository.TagRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class TagService {

    private final TagRepository tagRepository;
    private final CurrentUserService currentUserService;

    public TagService(TagRepository tagRepository, CurrentUserService currentUserService) {
        this.tagRepository = tagRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<String> listAll() {
        UserEntity user = currentUserService.getCurrentUser();

        return tagRepository.findByUserOrderByNameAsc(user)
                .stream()
                .map(TagEntity::getName)
                .toList();
    }

    @Transactional
    public void create(String rawName) {
        UserEntity user = currentUserService.getCurrentUser();
        String name = normalizeName(rawName);

        if (tagRepository.existsByUserAndName(user, name)) {
            throw new BadRequestException("Tag already exists");
        }

        tagRepository.save(TagEntity.builder().user(user).name(name).build());
    }

    @Transactional
    public void rename(String rawCurrentName, String rawNewName) {
        UserEntity user = currentUserService.getCurrentUser();
        String currentName = normalizeName(rawCurrentName);
        String newName = normalizeName(rawNewName);

        TagEntity tag = tagRepository.findByUserAndName(user, currentName)
                .orElseThrow(() -> new NotFoundException("Tag not found"));

        if (!currentName.equals(newName) && tagRepository.existsByUserAndName(user, newName)) {
            throw new BadRequestException("Tag already exists");
        }

        tag.setName(newName);
        tagRepository.save(tag);
    }

    @Transactional
    public void delete(String rawName) {
        UserEntity user = currentUserService.getCurrentUser();
        String name = normalizeName(rawName);

        TagEntity tag = tagRepository.findByUserAndName(user, name)
                .orElseThrow(() -> new NotFoundException("Tag not found"));

        tagRepository.delete(tag);
    }

    private String normalizeName(String rawName) {
        if (rawName == null) {
            throw new BadRequestException("Tag name is required");
        }

        String normalized = rawName.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            throw new BadRequestException("Tag name is required");
        }

        if (normalized.length() > 40) {
            throw new BadRequestException("Tag name must be at most 40 characters");
        }

        return normalized;
    }
}
