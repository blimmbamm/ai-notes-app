-- Cleanup obsolete schema from old note-color relation model.
ALTER TABLE IF EXISTS notes DROP COLUMN IF EXISTS note_color_id;
DROP TABLE IF EXISTS note_colors;
