-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `reclawatch` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `reclawatch`;

-- 1. Table users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'surveyor', 'auditor') NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table lahan (Master Data Spasial & Lahan)
CREATE TABLE IF NOT EXISTS `lahan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_blok` VARCHAR(100) NOT NULL,
  `target_luas` DECIMAL(10, 2) NOT NULL,
  `geom` GEOMETRY NOT NULL,
  `geojson_str` LONGTEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table surveyor_assignments
CREATE TABLE IF NOT EXISTS `surveyor_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `surveyor_id` INT NOT NULL,
  `lahan_id` INT NOT NULL,
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`surveyor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lahan_id`) REFERENCES `lahan`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table laporan
CREATE TABLE IF NOT EXISTS `laporan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lahan_id` INT NOT NULL,
  `surveyor_id` INT NOT NULL,
  `tahapan` ENUM('Penataan Lahan', 'Penyebaran Tanah Pucuk', 'Pengendalian Erosi', 'Revegetasi') NOT NULL,
  `luas_realisasi` DECIMAL(10, 2) NOT NULL,
  `foto_url` VARCHAR(255) NOT NULL,
  `latitude` DECIMAL(10, 8) NULL,
  `longitude` DECIMAL(11, 8) NULL,
  `geotag_timestamp` DATETIME NULL,
  `status` ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  `catatan_auditor` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`lahan_id`) REFERENCES `lahan`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`surveyor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table audit_logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table settings
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(50) UNIQUE NOT NULL,
  `value` VARCHAR(255) NOT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Users
-- admin / admin123
-- surveyor / surveyor123
-- auditor / auditor123
INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', '$2y$10$iFInm6fZ8WOFZQABnmnT9OKRdOUy34GC2rTEk/AQETsq4CKci2b0e', 'admin'),
(2, 'surveyor', '$2y$10$dWGn5CoLqLewZgueTW.tweDTFXPoZs7XQtsdFjrUXbgTXOz8rVVSG', 'surveyor'),
(3, 'auditor', '$2y$10$bzFpVhpYqYZWlFZcAYKDj.s5iKUC2O00pbbNhCd.s59JCEyMC/nyq', 'auditor')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- Seed Settings
INSERT INTO `settings` (`key`, `value`) VALUES
('sla_days', '7')
ON DUPLICATE KEY UPDATE `value`=`value`;
