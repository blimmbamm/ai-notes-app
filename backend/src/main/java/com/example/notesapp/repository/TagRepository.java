package com.example.notesapp.repository;

import com.example.notesapp.entity.TagEntity;
import com.example.notesapp.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<TagEntity, Long> {
    List<TagEntity> findByUserAndNameIn(UserEntity user, Collection<String> names);
    List<TagEntity> findByUserOrderByNameAsc(UserEntity user);
    Optional<TagEntity> findByUserAndName(UserEntity user, String name);
    boolean existsByUserAndName(UserEntity user, String name);
    void deleteByUser(UserEntity user);
}
