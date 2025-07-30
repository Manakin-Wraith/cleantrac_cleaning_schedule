-- Fix TaskInstance primary key sequence synchronization
-- Run this SQL to reset the sequence to the correct next value

-- First, check the current sequence value
SELECT currval('core_taskinstance_id_seq');

-- Check the actual highest ID in the table
SELECT MAX(id) FROM core_taskinstance;

-- Reset the sequence to be higher than the max ID
-- Replace XXXXX with the actual max ID + 1
SELECT setval('core_taskinstance_id_seq', (SELECT MAX(id) FROM core_taskinstance) + 1);

-- Verify the fix
SELECT currval('core_taskinstance_id_seq');
