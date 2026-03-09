package com.example.notesapp.service;

import com.example.notesapp.dto.NoteRequest;
import com.example.notesapp.dto.NoteResponse;
import com.example.notesapp.entity.NoteEntity;
import com.example.notesapp.entity.TagEntity;
import com.example.notesapp.entity.UserEntity;
import com.example.notesapp.exception.NotFoundException;
import com.example.notesapp.repository.NoteRepository;
import com.example.notesapp.repository.TagRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private CurrentUserService currentUserService;

    @InjectMocks
    private NoteService noteService;

    @Test
    void listNotesMapsToResponseWithSortedTagNames() {
        UserEntity user = UserEntity.builder().id(1L).email("u@example.com").build();
        NoteEntity note = NoteEntity.builder()
                .id(10L)
                .user(user)
                .title("Title")
                .content("Body")
                .notesColor("#aabbcc")
                .createdAt(Instant.parse("2026-01-01T00:00:00Z"))
                .updatedAt(Instant.parse("2026-01-02T00:00:00Z"))
                .tags(new LinkedHashSet<>(Set.of(
                        TagEntity.builder().name("zeta").build(),
                        TagEntity.builder().name("alpha").build()
                )))
                .build();

        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(noteRepository.findByUserOrderByUpdatedAtDesc(user)).thenReturn(List.of(note));

        List<NoteResponse> result = noteService.listNotes();

        assertEquals(1, result.size());
        assertEquals(List.of("alpha", "zeta"), result.get(0).tagNames());
    }

    @Test
    void createNormalizesFieldsAndCreatesMissingTags() {
        UserEntity user = UserEntity.builder().id(1L).email("u@example.com").build();
        TagEntity existingTag = TagEntity.builder().id(11L).user(user).name("existing").build();
        TagEntity newTagSaved = TagEntity.builder().id(12L).user(user).name("newtag").build();

        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(tagRepository.findByUserAndNameIn(eq(user), anyCollection())).thenReturn(List.of(existingTag));
        when(tagRepository.saveAll(any())).thenReturn(List.of(newTagSaved));
        when(noteRepository.save(any(NoteEntity.class))).thenAnswer(invocation -> {
            NoteEntity note = invocation.getArgument(0);
            note.setId(99L);
            return note;
        });

        NoteRequest request = new NoteRequest(
                "  My Note  ",
                "  Content  ",
                "  #AaBbCc  ",
                Arrays.asList(" existing ", "NEWTAG", "existing", " ", null)
        );

        NoteResponse response = noteService.create(request);

        ArgumentCaptor<NoteEntity> noteCaptor = ArgumentCaptor.forClass(NoteEntity.class);
        verify(noteRepository).save(noteCaptor.capture());
        NoteEntity savedNote = noteCaptor.getValue();

        assertEquals("My Note", savedNote.getTitle());
        assertEquals("Content", savedNote.getContent());
        assertEquals("#aabbcc", savedNote.getNotesColor());
        assertEquals(List.of("existing", "newtag"), response.tagNames());
    }

    @Test
    void updateThrowsWhenNoteNotFound() {
        UserEntity user = UserEntity.builder().id(1L).email("u@example.com").build();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(noteRepository.findByIdAndUser(42L, user)).thenReturn(Optional.empty());

        NoteRequest request = new NoteRequest("Title", "Body", "#ffffff", List.of("a"));
        assertThrows(NotFoundException.class, () -> noteService.update(42L, request));
        verify(noteRepository, never()).save(any(NoteEntity.class));
    }

    @Test
    void deleteThrowsWhenNoteNotFound() {
        UserEntity user = UserEntity.builder().id(1L).email("u@example.com").build();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(noteRepository.findByIdAndUser(42L, user)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> noteService.delete(42L));
        verify(noteRepository, never()).delete(any(NoteEntity.class));
    }

    @Test
    void createStoresNullColorWhenInputBlank() {
        UserEntity user = UserEntity.builder().id(1L).email("u@example.com").build();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(noteRepository.save(any(NoteEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NoteRequest request = new NoteRequest("Title", "Body", "   ", List.of());
        noteService.create(request);

        ArgumentCaptor<NoteEntity> noteCaptor = ArgumentCaptor.forClass(NoteEntity.class);
        verify(noteRepository).save(noteCaptor.capture());
        assertNull(noteCaptor.getValue().getNotesColor());
    }

    @Test
    void createWithNullTagsDoesNotResolveOrCreateTags() {
        UserEntity user = UserEntity.builder().id(1L).email("u@example.com").build();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(noteRepository.save(any(NoteEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NoteRequest request = new NoteRequest("Title", "Body", "#ffffff", null);
        NoteResponse response = noteService.create(request);

        verify(tagRepository, never()).findByUserAndNameIn(any(), anyCollection());
        verify(tagRepository, never()).saveAll(any());
        assertEquals(List.of(), response.tagNames());
    }

    @Test
    void updateReplacesFieldsAndTagSet() {
        UserEntity user = UserEntity.builder().id(1L).email("u@example.com").build();
        NoteEntity note = NoteEntity.builder()
                .id(42L)
                .user(user)
                .title("old")
                .content("old-content")
                .notesColor("#111111")
                .createdAt(Instant.parse("2026-01-01T00:00:00Z"))
                .updatedAt(Instant.parse("2026-01-01T00:00:00Z"))
                .tags(new LinkedHashSet<>(Set.of(TagEntity.builder().name("oldtag").build())))
                .build();
        TagEntity work = TagEntity.builder().id(10L).user(user).name("work").build();

        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(noteRepository.findByIdAndUser(42L, user)).thenReturn(Optional.of(note));
        when(tagRepository.findByUserAndNameIn(eq(user), anyCollection())).thenReturn(List.of(work));
        when(noteRepository.save(any(NoteEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NoteRequest request = new NoteRequest("  New Title  ", "  New Content  ", "  #ABCDEF ", List.of(" WORK ", "work"));
        NoteResponse response = noteService.update(42L, request);

        assertEquals("New Title", note.getTitle());
        assertEquals("New Content", note.getContent());
        assertEquals("#abcdef", note.getNotesColor());
        assertEquals(List.of("work"), response.tagNames());
    }
}
