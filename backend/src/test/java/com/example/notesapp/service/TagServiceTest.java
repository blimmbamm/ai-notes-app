package com.example.notesapp.service;

import com.example.notesapp.entity.TagEntity;
import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.exception.BadRequestException;
import com.example.notesapp.exception.NotFoundException;
import com.example.notesapp.repository.TagRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TagServiceTest {

    @Mock
    private TagRepository tagRepository;

    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private TagService tagService;

    @Test
    void createNormalizesNameAndSavesTag() {
        UserEntity user = UserEntity.builder().id(1L).email("u@example.com").build();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(tagRepository.existsByUserAndName(user, "work")).thenReturn(false);

        tagService.create("  WoRk  ");

        ArgumentCaptor<TagEntity> captor = ArgumentCaptor.forClass(TagEntity.class);
        verify(tagRepository).save(captor.capture());
        assertEquals("work", captor.getValue().getName());
        assertEquals(user, captor.getValue().getUser());
    }

    @Test
    void createThrowsWhenTagAlreadyExists() {
        UserEntity user = UserEntity.builder().id(1L).email("u@example.com").build();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(tagRepository.existsByUserAndName(user, "work")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> tagService.create("work"));
        verify(tagRepository, never()).save(any(TagEntity.class));
    }

    @Test
    void createThrowsWhenNameBlank() {
        assertThrows(BadRequestException.class, () -> tagService.create("   "));
        verify(tagRepository, never()).save(any(TagEntity.class));
    }

    @Test
    void renameThrowsWhenTagNotFound() {
        UserEntity user = UserEntity.builder().id(1L).email("u@example.com").build();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(tagRepository.findByUserAndName(user, "current")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> tagService.rename("current", "new"));
        verify(tagRepository, never()).save(any(TagEntity.class));
    }

    @Test
    void renameThrowsWhenNewNameAlreadyExists() {
        UserEntity user = UserEntity.builder().id(1L).email("u@example.com").build();
        TagEntity existing = TagEntity.builder().id(5L).user(user).name("current").build();

        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(tagRepository.findByUserAndName(user, "current")).thenReturn(Optional.of(existing));
        when(tagRepository.existsByUserAndName(user, "new")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> tagService.rename(" current ", " new "));
        verify(tagRepository, never()).save(any(TagEntity.class));
    }

    @Test
    void deleteFindsAndDeletesNormalizedName() {
        UserEntity user = UserEntity.builder().id(1L).email("u@example.com").build();
        TagEntity existing = TagEntity.builder().id(5L).user(user).name("work").build();

        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(tagRepository.findByUserAndName(user, "work")).thenReturn(Optional.of(existing));

        tagService.delete("  WORK ");

        verify(tagRepository).findByUserAndName(eq(user), eq("work"));
        verify(tagRepository).delete(existing);
    }
}
