-- ==============================================================================
-- WildBook: 03_procedures.sql (Optimized 9-Table Procedures)
-- ==============================================================================

DELIMITER $$

-- ------------------------------------------------------------------------------
-- 1. PROCEDURE: sp_create_booking
-- Atomically checks slot capacity and creates a 10-minute PENDING hold + payment
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_create_booking$$
CREATE PROCEDURE sp_create_booking(
  IN  p_user_id       INT,
  IN  p_slot_id       INT,
  IN  p_people        INT,
  OUT p_booking_id    INT,
  OUT p_booking_code  VARCHAR(20),
  OUT p_total_amount  DECIMAL(10, 2),
  OUT p_status_code   VARCHAR(50)
)
proc_block: BEGIN
  DECLARE v_capacity INT;
  DECLARE v_price DECIMAL(10, 2);
  DECLARE v_taken INT;
  DECLARE v_new_code VARCHAR(20);
  DECLARE v_total DECIMAL(10, 2);
  DECLARE v_new_id INT;

  -- Default OUT parameters
  SET p_booking_id = NULL;
  SET p_booking_code = NULL;
  SET p_total_amount = NULL;
  SET p_status_code = 'ERROR';

  IF p_people <= 0 THEN
    SET p_status_code = 'INVALID_PEOPLE_COUNT';
    LEAVE proc_block;
  END IF;

  START TRANSACTION;

  -- 1. Lock the slot row to prevent concurrent race conditions
  SELECT s.capacity, a.price INTO v_capacity, v_price
  FROM slots s
  JOIN activities a ON a.activity_id = s.activity_id
  WHERE s.slot_id = p_slot_id AND s.is_active = TRUE
  FOR UPDATE;

  IF v_capacity IS NULL THEN
    ROLLBACK;
    SET p_status_code = 'SLOT_NOT_FOUND';
    LEAVE proc_block;
  END IF;

  -- 2. Count CONFIRMED seats plus active PENDING holds (future hold_expires_at)
  SELECT COALESCE(SUM(number_of_people), 0) INTO v_taken
  FROM bookings
  WHERE slot_id = p_slot_id
    AND (status = 'CONFIRMED' OR (status = 'PENDING' AND hold_expires_at > NOW()));

  -- 3. Reject if capacity exceeded
  IF (v_taken + p_people) > v_capacity THEN
    ROLLBACK;
    SET p_status_code = 'NOT_ENOUGH_SEATS';
    LEAVE proc_block;
  END IF;

  -- 4. Calculate total amount
  SET v_total = v_price * p_people;
  SET v_new_code = CONCAT('WB-', UPPER(SUBSTRING(MD5(CONCAT(UUID(), RAND())), 1, 8)));

  -- 5. Insert booking with 10-minute hold
  INSERT INTO bookings (
    booking_code, user_id, slot_id, number_of_people, status, total_amount, hold_expires_at, booked_at
  ) VALUES (
    v_new_code, p_user_id, p_slot_id, p_people, 'PENDING', v_total, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW()
  );

  SET v_new_id = LAST_INSERT_ID();
  SET v_new_code = CONCAT('WB-', LPAD(v_new_id, 6, '0'));
  UPDATE bookings SET booking_code = v_new_code WHERE booking_id = v_new_id;

  -- 6. Insert corresponding PENDING payment row (1:1)
  INSERT INTO payments (
    booking_id, amount, payment_status
  ) VALUES (
    v_new_id, v_total, 'PENDING'
  );

  COMMIT;

  SET p_booking_id = v_new_id;
  SET p_booking_code = v_new_code;
  SET p_total_amount = v_total;
  SET p_status_code = 'SUCCESS';
END$$

-- ------------------------------------------------------------------------------
-- 2. PROCEDURE: sp_confirm_payment
-- Confirms booking, clears hold expiration, and marks payment PAID
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_confirm_payment$$
CREATE PROCEDURE sp_confirm_payment(
  IN  p_booking_id      INT,
  IN  p_transaction_ref VARCHAR(100),
  OUT p_status_code     VARCHAR(50)
)
proc_block: BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_hold DATETIME;

  SET p_status_code = 'ERROR';

  START TRANSACTION;

  SELECT status, hold_expires_at INTO v_status, v_hold
  FROM bookings
  WHERE booking_id = p_booking_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    ROLLBACK;
    SET p_status_code = 'BOOKING_NOT_FOUND';
    LEAVE proc_block;
  END IF;

  IF v_status = 'CONFIRMED' THEN
    ROLLBACK;
    SET p_status_code = 'ALREADY_CONFIRMED';
    LEAVE proc_block;
  END IF;

  IF v_status = 'PENDING' THEN
    IF v_hold IS NOT NULL AND v_hold <= NOW() THEN
      -- Expired hold
      UPDATE bookings SET status = 'EXPIRED' WHERE booking_id = p_booking_id;
      UPDATE payments SET payment_status = 'FAILED' WHERE booking_id = p_booking_id;
      COMMIT;
      SET p_status_code = 'HOLD_EXPIRED';
      LEAVE proc_block;
    ELSE
      -- Valid hold: confirm booking and record payment
      UPDATE bookings 
      SET status = 'CONFIRMED', hold_expires_at = NULL 
      WHERE booking_id = p_booking_id;

      UPDATE payments 
      SET payment_status = 'PAID', 
          transaction_ref = p_transaction_ref, 
          paid_at = NOW() 
      WHERE booking_id = p_booking_id;

      COMMIT;
      SET p_status_code = 'SUCCESS';
      LEAVE proc_block;
    END IF;
  ELSE
    ROLLBACK;
    SET p_status_code = 'INVALID_BOOKING_STATUS';
    LEAVE proc_block;
  END IF;
END$$

-- ------------------------------------------------------------------------------
-- 3. PROCEDURE: sp_cancel_booking
-- Cancels a confirmed future booking: 40% cancellation fee, 60% refund
-- Writes directly into bookings table (eliminating cancellations table)
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_cancel_booking$$
CREATE PROCEDURE sp_cancel_booking(
  IN  p_booking_id    INT,
  IN  p_user_id       INT,
  OUT p_status_code   VARCHAR(50),
  OUT p_fee_amount    DECIMAL(10, 2),
  OUT p_refund_amount DECIMAL(10, 2)
)
proc_block: BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_amount DECIMAL(10, 2);
  DECLARE v_slot_date DATE;
  DECLARE v_slot_time TIME;
  DECLARE v_fee DECIMAL(10, 2);
  DECLARE v_refund DECIMAL(10, 2);

  SET p_status_code = 'ERROR';
  SET p_fee_amount = 0.00;
  SET p_refund_amount = 0.00;

  START TRANSACTION;

  SELECT b.status, b.total_amount, s.slot_date, s.slot_time
  INTO v_status, v_amount, v_slot_date, v_slot_time
  FROM bookings b
  JOIN slots s ON b.slot_id = s.slot_id
  WHERE b.booking_id = p_booking_id
    AND (p_user_id IS NULL OR b.user_id = p_user_id)
  FOR UPDATE;

  IF v_status IS NULL THEN
    ROLLBACK;
    SET p_status_code = 'BOOKING_NOT_FOUND';
    LEAVE proc_block;
  END IF;

  IF v_status <> 'CONFIRMED' THEN
    ROLLBACK;
    SET p_status_code = 'ONLY_CONFIRMED_CAN_BE_CANCELLED';
    LEAVE proc_block;
  END IF;

  -- Ensure slot is in the future
  IF TIMESTAMP(v_slot_date, v_slot_time) <= NOW() THEN
    ROLLBACK;
    SET p_status_code = 'CANNOT_CANCEL_PAST_BOOKING';
    LEAVE proc_block;
  END IF;

  -- 40% cancellation fee, 60% refund
  SET v_fee = ROUND(v_amount * 0.40, 2);
  SET v_refund = v_amount - v_fee;

  -- Update booking with cancellation details directly
  UPDATE bookings 
  SET status = 'CANCELLED',
      cancelled_at = NOW(),
      cancellation_reason = 'Cancelled by guest',
      cancellation_fee = v_fee,
      refund_amount = v_refund
  WHERE booking_id = p_booking_id;

  -- Mark payment PARTIALLY_REFUNDED
  UPDATE payments 
  SET payment_status = 'PARTIALLY_REFUNDED' 
  WHERE booking_id = p_booking_id;

  COMMIT;

  SET p_status_code = 'SUCCESS';
  SET p_fee_amount = v_fee;
  SET p_refund_amount = v_refund;
END$$

-- ------------------------------------------------------------------------------
-- 4. PROCEDURE: sp_expire_pending_bookings
-- Marks expired holds as EXPIRED and payments as FAILED
-- ------------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_expire_pending_bookings$$
CREATE PROCEDURE sp_expire_pending_bookings(
  OUT p_expired_count INT
)
BEGIN
  SET p_expired_count = 0;

  UPDATE payments p
  JOIN bookings b ON p.booking_id = b.booking_id
  SET p.payment_status = 'FAILED'
  WHERE b.status = 'PENDING'
    AND b.hold_expires_at <= NOW();

  UPDATE bookings
  SET status = 'EXPIRED'
  WHERE status = 'PENDING'
    AND hold_expires_at <= NOW();

  SET p_expired_count = ROW_COUNT();
END$$

-- ------------------------------------------------------------------------------
-- 5. MYSQL EVENT: Runs every 1 minute to release abandoned holds automatically
-- ------------------------------------------------------------------------------
DROP EVENT IF EXISTS evt_expire_pending_bookings$$
CREATE EVENT evt_expire_pending_bookings
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
  CALL sp_expire_pending_bookings(@cnt);
END$$

DELIMITER ;
