package com.example.notesapp.controller;

import com.example.notesapp.dto.CreateTagRequest;
import com.example.notesapp.dto.RenameTagRequest;
import com.example.notesapp.service.TagService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    public List<String> listAll() {
        return tagService.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void create(@Valid @RequestBody CreateTagRequest request) {
        tagService.create(request.name());
    }

    @PutMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rename(@Valid @RequestBody RenameTagRequest request) {
        tagService.rename(request.currentName(), request.newName());
    }

    @DeleteMapping("/{tagName}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String tagName) {
        tagService.delete(tagName);
    }
}
