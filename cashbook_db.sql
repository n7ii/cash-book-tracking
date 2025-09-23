-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: db:3306
-- Generation Time: Sep 23, 2025 at 01:26 AM
-- Server version: 8.0.43
-- PHP Version: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cashbook_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_log`
--

CREATE TABLE `activity_log` (
  `AID` int NOT NULL,
  `user_id` int NOT NULL,
  `action_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `target_id` int NOT NULL,
  `target_table` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_log`
--

INSERT INTO `activity_log` (`AID`, `user_id`, `action_type`, `details`, `target_id`, `target_table`, `ip_address`, `created_at`) VALUES
(1, 8, 'DELETE_INCOME', NULL, 2, 'tbincome', '::ffff:127.0.0.1', '2025-09-18 03:47:16'),
(2, 8, 'CREATE_EXPENSE', '{\"total\":25000}', 1, 'tbexpenses', '::ffff:127.0.0.1', '2025-09-18 05:44:28'),
(3, 8, 'UPDATE_EXPENSE', '{\"updated_total\":30000,\"updated_notes\":\"Updated fuel amount.\",\"reason\":\"Made a mistake on the initial entry.\"}', 1, 'tbexpenses', '::ffff:127.0.0.1', '2025-09-18 05:45:02'),
(4, 8, 'DELETE_EXPENSE', '{\"reason\":\"Expense was submitted to the wrong category.\",\"deleted_record\":{\"EID\":1,\"user_id\":8,\"expense_type\":\"Fuel\",\"amount\":30000,\"photo_url\":null,\"created_at\":\"2025-09-17T22:44:28.000Z\",\"notes\":\"Updated fuel amount.\"}}', 1, 'tbexpenses', '::ffff:127.0.0.1', '2025-09-18 05:45:53'),
(5, 9, 'USER_REGISTER', '{\"username\":\"BCT Admin\",\"role_id\":1}', 9, 'tbuser', '::ffff:127.0.0.1', '2025-09-22 03:12:38'),
(6, 9, 'ADMIN_UPDATE_USER_STATUS', '{\"updated_user_id\":\"8\",\"new_status\":0}', 8, 'tbuser', '::ffff:127.0.0.1', '2025-09-22 03:43:32'),
(7, 9, 'ADMIN_UPDATE_USER_STATUS', '{\"updated_user_id\":\"8\",\"new_status\":1}', 8, 'tbuser', '::ffff:127.0.0.1', '2025-09-22 03:43:51'),
(8, 9, 'CREATE_EXPENSE', '{\"total\":25000}', 2, 'tbexpenses', '::ffff:127.0.0.1', '2025-09-22 04:26:47'),
(9, 9, 'ADMIN_RESET_PASSWORD', NULL, 8, 'tbuser', '::ffff:127.0.0.1', '2025-09-22 04:50:38'),
(10, 9, 'ADMIN_UPDATE_INCOME', '{\"updated_total\":65000,\"reason\":\"Employee made a typo in the original entry.\"}', 1, 'tbincome', '::ffff:127.0.0.1', '2025-09-22 06:18:25'),
(11, 9, 'ADMIN_DELETE_INCOME', '{\"reason\":\"Data entered on the wrong date by employee.\",\"deleted_record\":{\"IID\":1,\"member_id\":2,\"user_id\":1,\"total\":65000,\"photo_url\":null,\"notes\":\"Admin corrected the amount.\",\"market_id\":1,\"created_at\":\"2025-09-16T01:06:45.000Z\"}}', 1, 'tbincome', '::ffff:127.0.0.1', '2025-09-22 06:40:06'),
(12, 9, 'ADMIN_UPDATE_EXPENSE', '{\"updated_amount\":40000,\"reason\":\"Original receipt amount was unclear.\"}', 2, 'tbexpenses', '::ffff:127.0.0.1', '2025-09-22 06:41:03'),
(13, 9, 'ADMIN_DELETE_EXPENSE', '{\"reason\":\"This expense was a duplicate entry.\",\"deleted_record\":{\"EID\":2,\"user_id\":9,\"expense_type\":\"Fuel\",\"amount\":40000,\"photo_url\":null,\"created_at\":\"2025-09-21T21:26:47.000Z\",\"notes\":\"Admin correction: updated fuel cost.\"}}', 2, 'tbexpenses', '::ffff:127.0.0.1', '2025-09-22 06:41:39'),
(14, 9, 'CREATE_INCOME', '{\"total\":50000,\"member_id\":2}', 3, 'tbincome', '::ffff:127.0.0.1', '2025-09-22 06:43:02'),
(15, 9, 'CREATE_EXPENSE', '{\"total\":25000}', 3, 'tbexpenses', '::ffff:127.0.0.1', '2025-09-22 06:43:26'),
(16, 9, 'CREATE_LOAN', '{\"member_id\":1,\"total\":500000}', 2, 'tbloans', '::ffff:127.0.0.1', '2025-09-22 10:11:35'),
(17, 9, 'ADMIN_CREATE_CUSTOMER', '{\"customer_name\":\"Some One\"}', 3, 'tbmember', '::ffff:127.0.0.1', '2025-09-22 10:58:25'),
(18, 9, 'ADMIN_UPDATE_CUSTOMER', '{\"reason\":\"Customer changed their last name.\"}', 3, 'tbmember', '::ffff:127.0.0.1', '2025-09-22 10:59:06'),
(19, 9, 'ADMIN_DELETE_CUSTOMER', '{\"reason\":\"Customer account closed.\",\"deleted_record\":{\"MID\":3,\"Fname\":\"Some\",\"Lname\":\"Newname\",\"market_id\":1,\"role_id\":2,\"is_active\":1,\"created_at\":\"2025-09-22T03:58:25.000Z\"}}', 3, 'tbmember', '::ffff:127.0.0.1', '2025-09-22 10:59:37'),
(20, 9, 'CREATE_CUSTOMER', '{\"customer_name\":\"Test Customer\"}', 4, 'tbmember', '::ffff:127.0.0.1', '2025-09-22 12:20:30'),
(21, 9, 'UPDATE_CUSTOMER', '{\"reason\":\"Corrected customer\'s last name.\"}', 4, 'tbmember', '::ffff:127.0.0.1', '2025-09-22 12:21:05'),
(22, 9, 'DELETE_CUSTOMER', '{\"reason\":\"Customer has moved to another province.\",\"deleted_record\":{\"MID\":4,\"Fname\":\"Test\",\"Lname\":\"CustomerUpdated\",\"market_id\":1,\"role_id\":2,\"is_active\":1,\"created_at\":\"2025-09-22T05:20:30.000Z\"}}', 4, 'tbmember', '::ffff:127.0.0.1', '2025-09-22 12:21:27'),
(23, 9, 'CREATE_INCOME', '{\"total\":50000,\"detail_count\":1}', 6, 'tbincome', '::ffff:127.0.0.1', '2025-09-22 13:33:24'),
(24, 9, 'UPDATE_INCOME_DETAIL', '{\"reason\":\"Typo in original entry.\",\"updated_amount\":55000,\"for_member_id\":\"1\"}', 6, 'tbincome_details', '::ffff:127.0.0.1', '2025-09-22 14:28:29'),
(25, 9, 'CREATE_MARKET', '{\"market_name\":\"Phonthan Market\",\"responsible_user\":8}', 2, 'tbmarkets', '::ffff:127.0.0.1', '2025-09-22 14:43:32'),
(26, 9, 'UPDATE_MARKET', '{\"reason\":\"Corrected the official market name.\"}', 2, 'tbmarkets', '::ffff:127.0.0.1', '2025-09-22 14:44:01');

-- --------------------------------------------------------

--
-- Table structure for table `employee_market_assignments`
--

CREATE TABLE `employee_market_assignments` (
  `employee_id` int NOT NULL,
  `market_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employee_market_assignments`
--

INSERT INTO `employee_market_assignments` (`employee_id`, `market_id`) VALUES
(8, 2);

-- --------------------------------------------------------

--
-- Table structure for table `tbdistricts`
--

CREATE TABLE `tbdistricts` (
  `DID` int NOT NULL,
  `Dname` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `province_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbdistricts`
--

INSERT INTO `tbdistricts` (`DID`, `Dname`, `province_id`) VALUES
(1, 'ຫາດຊາຍຟອງ', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbexpenses`
--

CREATE TABLE `tbexpenses` (
  `EID` int NOT NULL,
  `user_id` int NOT NULL,
  `expense_type` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` bigint NOT NULL,
  `photo_url` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbexpenses`
--

INSERT INTO `tbexpenses` (`EID`, `user_id`, `expense_type`, `amount`, `photo_url`, `created_at`, `notes`) VALUES
(3, 9, 'Fuel', 25000, NULL, '2025-09-22 06:43:26', 'Fuel for motorbike for market visits.');

-- --------------------------------------------------------

--
-- Table structure for table `tbincome`
--

CREATE TABLE `tbincome` (
  `IID` int NOT NULL,
  `member_id` int NOT NULL,
  `user_id` int NOT NULL,
  `total` bigint NOT NULL,
  `photo_url` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `market_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbincome`
--

INSERT INTO `tbincome` (`IID`, `member_id`, `user_id`, `total`, `photo_url`, `notes`, `market_id`, `created_at`) VALUES
(3, 2, 9, 50000, NULL, 'Daily payment collected.', 1, '2025-09-22 06:43:02'),
(6, 2, 9, 50000, NULL, 'Collection from Morning Market.', 1, '2025-09-22 13:33:24');

-- --------------------------------------------------------

--
-- Table structure for table `tbincome_details`
--

CREATE TABLE `tbincome_details` (
  `income_id` int NOT NULL,
  `member_id` int NOT NULL,
  `amount` bigint NOT NULL,
  `photo_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbincome_details`
--

INSERT INTO `tbincome_details` (`income_id`, `member_id`, `amount`, `photo_url`, `notes`) VALUES
(3, 1, 33000, NULL, NULL),
(6, 1, 55000, NULL, 'Corrected amount.');

-- --------------------------------------------------------

--
-- Table structure for table `tbloans`
--

CREATE TABLE `tbloans` (
  `LID` int NOT NULL,
  `member_id` int NOT NULL,
  `total` bigint NOT NULL,
  `start_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` date DEFAULT NULL,
  `status` tinyint(1) NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbloans`
--

INSERT INTO `tbloans` (`LID`, `member_id`, `total`, `start_date`, `end_date`, `status`, `created_by`) VALUES
(1, 1, 33000, '2025-09-16 08:01:25', NULL, 0, 8),
(2, 1, 500000, '2025-09-22 10:11:35', '2026-09-22', 1, 9);

-- --------------------------------------------------------

--
-- Table structure for table `tbmarkets`
--

CREATE TABLE `tbmarkets` (
  `MkID` int NOT NULL,
  `Mname` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Address` int NOT NULL,
  `responsible_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbmarkets`
--

INSERT INTO `tbmarkets` (`MkID`, `Mname`, `Address`, `responsible_by`) VALUES
(1, 'ຕະຫຼາດທ່ານາແລ້ງ', 1, 1),
(2, 'Thongkhankham Morning Market', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbmember`
--

CREATE TABLE `tbmember` (
  `MID` int NOT NULL,
  `Fname` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Lname` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `market_id` int NOT NULL,
  `role_id` int NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbmember`
--

INSERT INTO `tbmember` (`MID`, `Fname`, `Lname`, `market_id`, `role_id`, `is_active`, `created_at`) VALUES
(1, 'ຄຳສະໄໝ', 'ແສນສຸກສັນ', 1, 2, 1, '2025-09-16 06:59:05'),
(2, 'ອ້າຍ', 'ໃຫຍ່', 1, 3, 1, '2025-09-16 08:08:56');

-- --------------------------------------------------------

--
-- Table structure for table `tbprovinces`
--

CREATE TABLE `tbprovinces` (
  `PID` int NOT NULL,
  `Pname` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbprovinces`
--

INSERT INTO `tbprovinces` (`PID`, `Pname`) VALUES
(1, 'ນະຄອນຫຼວງວຽງຈັນ');

-- --------------------------------------------------------

--
-- Table structure for table `tbroles`
--

CREATE TABLE `tbroles` (
  `RID` int NOT NULL,
  `Rname` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_user` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbroles`
--

INSERT INTO `tbroles` (`RID`, `Rname`, `is_user`) VALUES
(1, 'Admin', 1),
(2, 'Member', 0),
(3, 'Collector', 0),
(4, 'Employee', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbuser`
--

CREATE TABLE `tbuser` (
  `UID` int NOT NULL,
  `Fname` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Lname` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birth_date` date NOT NULL,
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` int NOT NULL,
  `role_id` int NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbuser`
--

INSERT INTO `tbuser` (`UID`, `Fname`, `Lname`, `username`, `password`, `phone`, `birth_date`, `gender`, `address`, `role_id`, `is_active`, `created_at`) VALUES
(1, 'ແມັກ', 'ເຕັມແລ້ວ', 'StartByN-CloseBy-er', 'Number', '2041993755', '1887-09-10', 'ຊາຍແທ້', 1, 1, 1, '2025-09-16 07:43:38'),
(8, 'Sokdee', 'Lao', 'sokdee.lao', '$2b$10$utiHr.9KJeuB85n6NN49bOqQcETwJjguPG8XLLo1Q50jVkZtjs9DO', '0201234567', '1995-05-20', 'Male', 1, 3, 1, '2025-09-17 03:53:11'),
(9, 'Book Cash', 'Tracking', 'BCT Admin', '$2b$10$eiMTnFcVXYRWFbtTQf3lMu/si3WhjXYKyxXTFFud1Ai2fbkyzwH1m', '02096542635', '2025-09-04', 'Male', 1, 1, 1, '2025-09-22 03:12:38');

-- --------------------------------------------------------

--
-- Table structure for table `tbvillages`
--

CREATE TABLE `tbvillages` (
  `VID` int NOT NULL,
  `Vname` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `district_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbvillages`
--

INSERT INTO `tbvillages` (`VID`, `Vname`, `district_id`) VALUES
(1, 'ທ່ານາແລ້ງ', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD PRIMARY KEY (`AID`),
  ADD KEY `user_action` (`user_id`);

--
-- Indexes for table `employee_market_assignments`
--
ALTER TABLE `employee_market_assignments`
  ADD PRIMARY KEY (`employee_id`,`market_id`),
  ADD KEY `market_id` (`market_id`);

--
-- Indexes for table `tbdistricts`
--
ALTER TABLE `tbdistricts`
  ADD PRIMARY KEY (`DID`),
  ADD KEY `province_id` (`province_id`);

--
-- Indexes for table `tbexpenses`
--
ALTER TABLE `tbexpenses`
  ADD PRIMARY KEY (`EID`),
  ADD KEY `user_expense` (`user_id`);

--
-- Indexes for table `tbincome`
--
ALTER TABLE `tbincome`
  ADD PRIMARY KEY (`IID`),
  ADD KEY `user_incharge` (`user_id`),
  ADD KEY `member_pay` (`member_id`),
  ADD KEY `from_market` (`market_id`);

--
-- Indexes for table `tbincome_details`
--
ALTER TABLE `tbincome_details`
  ADD KEY `from_income` (`income_id`),
  ADD KEY `from_member` (`member_id`);

--
-- Indexes for table `tbloans`
--
ALTER TABLE `tbloans`
  ADD PRIMARY KEY (`LID`),
  ADD KEY `member` (`member_id`),
  ADD KEY `loan_created_by` (`created_by`);

--
-- Indexes for table `tbmarkets`
--
ALTER TABLE `tbmarkets`
  ADD PRIMARY KEY (`MkID`),
  ADD KEY `village_id` (`Address`),
  ADD KEY `user_response` (`responsible_by`);

--
-- Indexes for table `tbmember`
--
ALTER TABLE `tbmember`
  ADD PRIMARY KEY (`MID`),
  ADD KEY `market_id` (`market_id`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `tbprovinces`
--
ALTER TABLE `tbprovinces`
  ADD PRIMARY KEY (`PID`);

--
-- Indexes for table `tbroles`
--
ALTER TABLE `tbroles`
  ADD PRIMARY KEY (`RID`);

--
-- Indexes for table `tbuser`
--
ALTER TABLE `tbuser`
  ADD PRIMARY KEY (`UID`),
  ADD KEY `user_role` (`role_id`),
  ADD KEY `user_address` (`address`);

--
-- Indexes for table `tbvillages`
--
ALTER TABLE `tbvillages`
  ADD PRIMARY KEY (`VID`),
  ADD KEY `district_id` (`district_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_log`
--
ALTER TABLE `activity_log`
  MODIFY `AID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `tbdistricts`
--
ALTER TABLE `tbdistricts`
  MODIFY `DID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbexpenses`
--
ALTER TABLE `tbexpenses`
  MODIFY `EID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbincome`
--
ALTER TABLE `tbincome`
  MODIFY `IID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tbloans`
--
ALTER TABLE `tbloans`
  MODIFY `LID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbmarkets`
--
ALTER TABLE `tbmarkets`
  MODIFY `MkID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbmember`
--
ALTER TABLE `tbmember`
  MODIFY `MID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbprovinces`
--
ALTER TABLE `tbprovinces`
  MODIFY `PID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbroles`
--
ALTER TABLE `tbroles`
  MODIFY `RID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbuser`
--
ALTER TABLE `tbuser`
  MODIFY `UID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `tbvillages`
--
ALTER TABLE `tbvillages`
  MODIFY `VID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_log`
--
ALTER TABLE `activity_log`
  ADD CONSTRAINT `user_action` FOREIGN KEY (`user_id`) REFERENCES `tbuser` (`UID`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `employee_market_assignments`
--
ALTER TABLE `employee_market_assignments`
  ADD CONSTRAINT `employee_market_assignments_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `tbuser` (`UID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `employee_market_assignments_ibfk_2` FOREIGN KEY (`market_id`) REFERENCES `tbmarkets` (`MkID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbdistricts`
--
ALTER TABLE `tbdistricts`
  ADD CONSTRAINT `province_id` FOREIGN KEY (`province_id`) REFERENCES `tbprovinces` (`PID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbexpenses`
--
ALTER TABLE `tbexpenses`
  ADD CONSTRAINT `user_expense` FOREIGN KEY (`user_id`) REFERENCES `tbuser` (`UID`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `tbincome`
--
ALTER TABLE `tbincome`
  ADD CONSTRAINT `from_market` FOREIGN KEY (`market_id`) REFERENCES `tbmarkets` (`MkID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `member_pay` FOREIGN KEY (`member_id`) REFERENCES `tbmember` (`MID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_incharge` FOREIGN KEY (`user_id`) REFERENCES `tbuser` (`UID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbincome_details`
--
ALTER TABLE `tbincome_details`
  ADD CONSTRAINT `from_income` FOREIGN KEY (`income_id`) REFERENCES `tbincome` (`IID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `from_member` FOREIGN KEY (`member_id`) REFERENCES `tbmember` (`MID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbloans`
--
ALTER TABLE `tbloans`
  ADD CONSTRAINT `loan_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbuser` (`UID`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `member` FOREIGN KEY (`member_id`) REFERENCES `tbmember` (`MID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbmarkets`
--
ALTER TABLE `tbmarkets`
  ADD CONSTRAINT `user_response` FOREIGN KEY (`responsible_by`) REFERENCES `tbuser` (`UID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `village_id` FOREIGN KEY (`Address`) REFERENCES `tbvillages` (`VID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbmember`
--
ALTER TABLE `tbmember`
  ADD CONSTRAINT `market_id` FOREIGN KEY (`market_id`) REFERENCES `tbmarkets` (`MkID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `role_id` FOREIGN KEY (`role_id`) REFERENCES `tbroles` (`RID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbuser`
--
ALTER TABLE `tbuser`
  ADD CONSTRAINT `user_address` FOREIGN KEY (`address`) REFERENCES `tbvillages` (`VID`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `user_role` FOREIGN KEY (`role_id`) REFERENCES `tbroles` (`RID`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `tbvillages`
--
ALTER TABLE `tbvillages`
  ADD CONSTRAINT `district_id` FOREIGN KEY (`district_id`) REFERENCES `tbdistricts` (`DID`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
