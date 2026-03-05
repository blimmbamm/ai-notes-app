package com.example.notesapp.repository;

import com.example.notesapp.entity.TagEntity;
import com.example.notesapp.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TagRepository extends JpaRepository<TagEntity, Long> {
    List<TagEntity> findByUserAndNameIn(UserEntity user, Collection<String> names);
    List<TagEntity> findByUserOrderByNameAsc(UserEntity user);
    void deleteByUser(UserEntity user);
}
