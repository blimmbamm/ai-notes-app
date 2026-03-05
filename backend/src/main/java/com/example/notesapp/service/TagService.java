package com.example.notesapp.service;

import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.repository.TagRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
                .map(tag -> tag.getName())
                .toList();
    }
}
