-- ==============================================================================
-- WildBook: 02_triggers.sql (Optimized 9-Table Triggers)
-- ==============================================================================

DELIMITER $$

-- ------------------------------------------------------------------------------
-- 1. TRIGGER: Slot capacity <= vehicle capacity (INSERT & UPDATE)
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_slot_capacity_insert$$
CREATE TRIGGER trg_slot_capacity_insert
BEFORE INSERT ON slots
FOR EACH ROW
BEGIN
  DECLARE v_veh_capacity INT;
  
  SELECT capacity INTO v_veh_capacity 
  FROM vehicles 
  WHERE vehicle_id = NEW.vehicle_id;
  
  IF v_veh_capacity IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Specified vehicle does not exist';
  ELSEIF NEW.capacity > v_veh_capacity THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Slot capacity cannot exceed vehicle capacity';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_slot_capacity_update$$
CREATE TRIGGER trg_slot_capacity_update
BEFORE UPDATE ON slots
FOR EACH ROW
BEGIN
  DECLARE v_veh_capacity INT;
  
  SELECT capacity INTO v_veh_capacity 
  FROM vehicles 
  WHERE vehicle_id = NEW.vehicle_id;
  
  IF v_veh_capacity IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Specified vehicle does not exist';
  ELSEIF NEW.capacity > v_veh_capacity THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Slot capacity cannot exceed vehicle capacity';
  END IF;
END$$

-- ------------------------------------------------------------------------------
-- 2. TRIGGER: Vehicle, guide, and activity must belong to the same sanctuary
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_slot_sanctuary_consistency_insert$$
CREATE TRIGGER trg_slot_sanctuary_consistency_insert
BEFORE INSERT ON slots
FOR EACH ROW
BEGIN
  DECLARE v_act_sanctuary INT;
  DECLARE v_veh_sanctuary INT;
  DECLARE v_gui_sanctuary INT;

  SELECT sanctuary_id INTO v_act_sanctuary FROM activities WHERE activity_id = NEW.activity_id;
  SELECT sanctuary_id INTO v_veh_sanctuary FROM vehicles WHERE vehicle_id = NEW.vehicle_id;
  SELECT sanctuary_id INTO v_gui_sanctuary FROM guides WHERE guide_id = NEW.guide_id;

  IF v_act_sanctuary IS NULL OR v_veh_sanctuary IS NULL OR v_gui_sanctuary IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Activity, vehicle, or guide not found';
  ELSEIF (v_act_sanctuary <> v_veh_sanctuary) OR (v_act_sanctuary <> v_gui_sanctuary) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Vehicle, guide, and activity must belong to the same sanctuary';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_slot_sanctuary_consistency_update$$
CREATE TRIGGER trg_slot_sanctuary_consistency_update
BEFORE UPDATE ON slots
FOR EACH ROW
BEGIN
  DECLARE v_act_sanctuary INT;
  DECLARE v_veh_sanctuary INT;
  DECLARE v_gui_sanctuary INT;

  SELECT sanctuary_id INTO v_act_sanctuary FROM activities WHERE activity_id = NEW.activity_id;
  SELECT sanctuary_id INTO v_veh_sanctuary FROM vehicles WHERE vehicle_id = NEW.vehicle_id;
  SELECT sanctuary_id INTO v_gui_sanctuary FROM guides WHERE guide_id = NEW.guide_id;

  IF v_act_sanctuary IS NULL OR v_veh_sanctuary IS NULL OR v_gui_sanctuary IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Activity, vehicle, or guide not found';
  ELSEIF (v_act_sanctuary <> v_veh_sanctuary) OR (v_act_sanctuary <> v_gui_sanctuary) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Vehicle, guide, and activity must belong to the same sanctuary';
  END IF;
END$$

-- ------------------------------------------------------------------------------
-- 3. TRIGGER: Only an APPROVED admin can add slots
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_slot_admin_approved_insert$$
CREATE TRIGGER trg_slot_admin_approved_insert
BEFORE INSERT ON slots
FOR EACH ROW
BEGIN
  DECLARE v_admin_status VARCHAR(20);
  DECLARE v_admin_role VARCHAR(20);

  SELECT u.account_status, u.role INTO v_admin_status, v_admin_role
  FROM activities a
  JOIN sanctuaries s ON a.sanctuary_id = s.sanctuary_id
  JOIN users u ON s.admin_id = u.user_id
  WHERE a.activity_id = NEW.activity_id;

  IF v_admin_status IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Sanctuary administrator not found for this activity';
  ELSEIF v_admin_status <> 'APPROVED' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Only an APPROVED admin can add slots';
  END IF;
END$$

DELIMITER ;
