-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: db:3306
-- Generation Time: Oct 23, 2025 at 03:02 AM
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
  `action_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `target_id` int NOT NULL,
  `target_table` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
(26, 9, 'UPDATE_MARKET', '{\"reason\":\"Corrected the official market name.\"}', 2, 'tbmarkets', '::ffff:127.0.0.1', '2025-09-22 14:44:01'),
(27, 10, 'USER_REGISTER', '{\"username\":\"ອອນໄຊ\",\"role_id\":4}', 10, 'tbuser', '::ffff:127.0.0.1', '2025-09-29 01:36:38'),
(28, 11, 'USER_REGISTER', '{\"username\":\"ສີບັດ\",\"role_id\":4}', 11, 'tbuser', '::ffff:127.0.0.1', '2025-09-29 01:48:25'),
(29, 12, 'USER_REGISTER', '{\"username\":\"ສອນໄຊ\",\"role_id\":4}', 12, 'tbuser', '::ffff:127.0.0.1', '2025-09-29 01:49:42'),
(30, 13, 'USER_REGISTER', '{\"username\":\"ສົມກ້ຽວ\",\"role_id\":4}', 13, 'tbuser', '::ffff:127.0.0.1', '2025-09-29 01:50:50'),
(31, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::ffff:127.0.0.1', '2025-09-29 02:32:38'),
(32, 9, 'ADMIN_RESET_PASSWORD', NULL, 8, 'tbuser', '::ffff:127.0.0.1', '2025-09-29 02:33:55'),
(33, 9, 'CREATE_CUSTOMER', '{\"customer_name\":\"ນ້ຳຫວານ ເຄັມ\"}', 6, 'tbmember', '::ffff:127.0.0.1', '2025-09-29 02:48:09'),
(34, 9, 'CREATE_CUSTOMER', '{\"customer_name\":\"ສົມສັກ ສວນ\"}', 7, 'tbmember', '::ffff:127.0.0.1', '2025-09-29 02:52:51'),
(35, 9, 'CREATE_CUSTOMER', '{\"customer_name\":\"ຕະ ລອນສິນ\"}', 8, 'tbmember', '::ffff:127.0.0.1', '2025-09-29 02:53:30'),
(36, 9, 'CREATE_CUSTOMER', '{\"customer_name\":\"ກອນ ລາໄຊ\"}', 9, 'tbmember', '::ffff:127.0.0.1', '2025-09-29 02:54:12'),
(37, 9, 'CREATE_CUSTOMER', '{\"customer_name\":\"ມາກ ລີຊອນ\"}', 11, 'tbmember', '::ffff:127.0.0.1', '2025-09-29 02:54:58'),
(38, 9, 'CREATE_CUSTOMER', '{\"customer_name\":\"ຈອນ ອາລອງ\"}', 12, 'tbmember', '::ffff:127.0.0.1', '2025-09-29 02:55:56'),
(39, 9, 'CREATE_CUSTOMER', '{\"customer_name\":\"ບິກ ທະລາ\"}', 13, 'tbmember', '::ffff:127.0.0.1', '2025-09-29 02:56:14'),
(40, 9, 'CREATE_CUSTOMER', '{\"customer_name\":\"ສາ ລາໄຊ\"}', 15, 'tbmember', '::ffff:127.0.0.1', '2025-09-29 02:56:41'),
(41, 9, 'CREATE_CUSTOMER', '{\"customer_name\":\"ຍອງ ສະລາ\"}', 16, 'tbmember', '::ffff:127.0.0.1', '2025-09-29 02:57:02'),
(42, 9, 'CREATE_EXPENSE', '{\"total\":25000,\"has_photo\":false}', 4, 'tbexpenses', '::ffff:127.0.0.1', '2025-09-29 03:19:05'),
(43, 9, 'CREATE_LOAN', '{\"member_id\":6,\"total\":500000}', 4, 'tbloans', '::ffff:127.0.0.1', '2025-09-29 04:34:20'),
(44, 9, 'UPDATE_LOAN', '{\"reason\":\"Miss typo.\",\"new_status\":1}', 4, 'tbloans', '::ffff:127.0.0.1', '2025-09-29 04:35:28'),
(45, 9, 'ADMIN_DELETE_LOAN', '{\"reason\":\"Loan was created in error and needs to be removed.\",\"deleted_record\":{\"LID\":4,\"member_id\":6,\"total\":300000,\"start_date\":\"2025-09-28T21:34:20.000Z\",\"end_date\":\"2026-09-30T17:00:00.000Z\",\"status\":1,\"created_by\":9}}', 4, 'tbloans', '::ffff:127.0.0.1', '2025-09-29 04:36:00'),
(46, 9, 'ADMIN_ADD_FUNDS', '{\"total\":10000000,\"notes\":\"Add fund.\",\"type\":\"FUNDING\"}', 7, 'tbincome', '::ffff:127.0.0.1', '2025-09-29 05:05:54'),
(47, 9, 'CREATE_INCOME', '{\"total\":125000,\"detail_count\":2,\"has_photo\":false}', 9, 'tbincome', '::ffff:127.0.0.1', '2025-09-29 05:19:06'),
(48, 9, 'CREATE_INCOME', '{\"total\":510000,\"detail_count\":2,\"has_photo\":false}', 10, 'tbincome', '::ffff:127.0.0.1', '2025-09-29 05:19:41'),
(49, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-09-30 05:44:26'),
(50, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-09-30 05:50:18'),
(51, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-09-30 07:08:36'),
(52, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-01 05:43:57'),
(53, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::ffff:127.0.0.1', '2025-10-01 07:24:58'),
(54, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-01 08:08:37'),
(55, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-01 08:35:14'),
(56, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-02 06:53:26'),
(57, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-02 10:05:45'),
(58, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-03 06:33:23'),
(59, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-03 13:09:26'),
(60, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-04 05:29:23'),
(61, 9, 'ADMIN_UPDATE_USER', '{\"reason\":\"Updated via admin panel\",\"updated_user_id\":\"13\"}', 13, 'tbuser', '::1', '2025-10-04 06:18:07'),
(62, 9, 'ADMIN_UPDATE_USER', '{\"reason\":\"Updated via admin panel\",\"updated_user_id\":\"13\"}', 13, 'tbuser', '::1', '2025-10-04 06:18:13'),
(63, 9, 'ADMIN_UPDATE_USER', '{\"reason\":\"Updated via admin panel\",\"updated_user_id\":\"9\"}', 9, 'tbuser', '::1', '2025-10-04 06:19:18'),
(64, 9, 'ADMIN_UPDATE_USER', '{\"reason\":\"Updated via admin panel\",\"updated_user_id\":\"13\"}', 13, 'tbuser', '::1', '2025-10-04 06:19:33'),
(65, 9, 'ADMIN_UPDATE_USER', '{\"reason\":\"Updated via admin panel\",\"updated_user_id\":\"13\"}', 13, 'tbuser', '::1', '2025-10-04 06:19:51'),
(66, 9, 'ADMIN_UPDATE_USER', '{\"reason\":\"Updated via admin panel\",\"updated_user_id\":\"13\"}', 13, 'tbuser', '::1', '2025-10-04 06:20:26'),
(67, 9, 'ADMIN_UPDATE_USER_STATUS', '{\"updated_user_id\":\"11\",\"new_status\":0}', 11, 'tbuser', '::1', '2025-10-04 06:20:41'),
(68, 9, 'ADMIN_UPDATE_USER_STATUS', '{\"updated_user_id\":\"11\",\"new_status\":1}', 11, 'tbuser', '::1', '2025-10-04 06:20:51'),
(69, 9, 'ADMIN_UPDATE_USER', '{\"reason\":\"Updated via admin panel\",\"updated_user_id\":\"11\"}', 11, 'tbuser', '::1', '2025-10-04 06:27:57'),
(70, 9, 'ADMIN_UPDATE_USER', '{\"reason\":\"Updated via admin panel\",\"updated_user_id\":\"11\"}', 11, 'tbuser', '::1', '2025-10-04 06:28:19'),
(71, 9, 'ADMIN_UPDATE_USER_STATUS', '{\"updated_user_id\":\"11\",\"new_status\":0}', 11, 'tbuser', '::1', '2025-10-04 06:50:50'),
(72, 9, 'ADMIN_UPDATE_USER_STATUS', '{\"updated_user_id\":\"11\",\"new_status\":1}', 11, 'tbuser', '::1', '2025-10-04 06:50:52'),
(73, 9, 'ADMIN_UPDATE_USER_STATUS', '{\"updated_user_id\":\"11\",\"new_status\":0}', 11, 'tbuser', '::1', '2025-10-04 06:52:54'),
(74, 9, 'ADMIN_UPDATE_USER_STATUS', '{\"updated_user_id\":\"11\",\"new_status\":1}', 11, 'tbuser', '::1', '2025-10-04 06:52:57'),
(75, 9, 'ADMIN_UPDATE_USER_STATUS', '{\"updated_user_id\":\"11\",\"new_status\":0}', 11, 'tbuser', '::1', '2025-10-04 07:05:23'),
(76, 9, 'ADMIN_UPDATE_USER_STATUS', '{\"updated_user_id\":\"11\",\"new_status\":1}', 11, 'tbuser', '::1', '2025-10-04 07:05:27'),
(77, 9, 'ADMIN_UPDATE_USER_STATUS', '{\"updated_user_id\":\"11\",\"new_status\":0}', 11, 'tbuser', '::1', '2025-10-04 07:14:31'),
(78, 9, 'ADMIN_UPDATE_USER_STATUS', '{\"updated_user_id\":\"11\",\"new_status\":1}', 11, 'tbuser', '::1', '2025-10-04 07:14:33'),
(79, 9, 'ADMIN_UPDATE_USER_STATUS', '{\"updated_user_id\":\"11\",\"new_status\":0}', 11, 'tbuser', '::1', '2025-10-04 07:19:39'),
(80, 9, 'ADMIN_UPDATE_USER_STATUS', '{\"updated_user_id\":\"11\",\"new_status\":1}', 11, 'tbuser', '::1', '2025-10-04 07:19:43'),
(81, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-04 07:58:06'),
(82, 9, 'DELETE_EXPENSE', '{\"reason\":\"Test test\",\"deleted_record\":{\"EID\":3,\"user_id\":9,\"expense_type\":\"Fuel\",\"amount\":25000,\"photo_url\":null,\"created_at\":\"2025-09-21T23:43:26.000Z\",\"notes\":\"Fuel for motorbike for market visits.\",\"category\":null,\"payment_method\":\"CASH\",\"market_id\":null}}', 3, 'tbexpenses', '::1', '2025-10-04 09:33:26'),
(83, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-04 12:09:41'),
(84, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-05 07:45:49'),
(85, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-05 10:12:11'),
(86, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-05 11:30:09'),
(87, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-07 04:29:44'),
(88, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-07 05:35:41'),
(89, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-08 03:39:46'),
(90, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-11 06:40:19'),
(91, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-11 08:12:58'),
(92, 9, 'CREATE_RECONCILIATION', '{\"statement_date\":\"2025-10-11\",\"balance_difference\":0}', 1, 'tb_reconciliations', '::1', '2025-10-11 08:14:19'),
(93, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-11 08:50:40'),
(94, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-12 09:08:39'),
(95, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-12 15:16:31'),
(96, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-13 07:21:50'),
(97, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-14 02:06:30'),
(98, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-14 03:32:11'),
(99, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::ffff:127.0.0.1', '2025-10-14 04:46:30'),
(100, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-14 04:54:10'),
(101, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-14 06:08:50'),
(102, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-14 09:16:18'),
(103, 9, 'UPDATE_MARKET', '{\"reason\":\"change responsible\"}', 2, 'tbmarkets', '::1', '2025-10-14 09:16:42'),
(104, 9, 'UPDATE_MARKET', '{\"reason\":\"change responsible\"}', 2, 'tbmarkets', '::1', '2025-10-14 09:16:45'),
(105, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-14 16:45:46'),
(106, 9, 'CREATE_CUSTOMER', '{\"customer_name\":\"ຈິນດາ ບຸນຕັນ\"}', 17, 'tbmember', '::1', '2025-10-14 16:47:12'),
(107, 9, 'DELETE_CUSTOMER', '{\"reason\":\"remove member\",\"deleted_record\":{\"MID\":17,\"Fname\":\"ຈິນດາ\",\"Lname\":\"ບຸນຕັນ\",\"market_id\":5,\"role_id\":2,\"is_active\":1,\"created_at\":\"2025-10-14T09:47:12.000Z\"}}', 17, 'tbmember', '::1', '2025-10-14 17:17:23'),
(108, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-15 02:42:03'),
(109, 9, 'CREATE_MARKET', '{\"Mname\":\"m\",\"Address\":6,\"responsible_by\":null}', 7, 'tbmarkets', '::1', '2025-10-15 02:48:50'),
(110, 9, 'ADMIN_DELETE_MARKET', '{\"reason\":\"remove market\",\"deleted_record\":{\"MkID\":7,\"Mname\":\"m\",\"Address\":6,\"responsible_by\":null}}', 7, 'tbmarkets', '::1', '2025-10-15 02:49:06'),
(111, 9, 'CREATE_CUSTOMER', '{\"customer_name\":\"ກອນ ລາວັນ\"}', 18, 'tbmember', '::1', '2025-10-15 03:00:55'),
(112, 9, 'CREATE_MARKET', '{\"Mname\":\"ທ\",\"Address\":6,\"responsible_by\":null}', 8, 'tbmarkets', '::1', '2025-10-15 03:28:00'),
(113, 9, 'UPDATE_MARKET', '{\"reason\":\"ຊ\"}', 8, 'tbmarkets', '::1', '2025-10-15 03:28:21'),
(114, 9, 'ADMIN_DELETE_MARKET', '{\"reason\":\"remove market\",\"deleted_record\":{\"MkID\":8,\"Mname\":\"ທ\",\"Address\":3,\"responsible_by\":null}}', 8, 'tbmarkets', '::1', '2025-10-15 03:28:30'),
(115, 9, 'CREATE_CUSTOMER', '{\"customer_name\":\"ບາ ລີ\"}', 19, 'tbmember', '::1', '2025-10-15 03:37:21'),
(116, 9, 'UPDATE_MARKET', '{\"reason\":\"test\"}', 2, 'tbmarkets', '::1', '2025-10-15 04:39:04'),
(117, 9, 'UPDATE_MARKET', '{\"reason\":\"test\"}', 2, 'tbmarkets', '::1', '2025-10-15 04:39:30'),
(118, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-15 07:29:46'),
(119, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::ffff:127.0.0.1', '2025-10-15 07:33:43'),
(120, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-15 10:15:01'),
(121, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-15 10:31:07'),
(122, 9, 'CREATE_CUSTOMER', '{\"customer_name\":\"a b\"}', 20, 'tbmember', '::1', '2025-10-15 10:32:13'),
(123, 9, 'CREATE_LOAN', '{\"member_id\":20,\"total\":1000000,\"has_notes\":true}', 12, 'tbloans', '::1', '2025-10-15 10:33:08'),
(124, 9, 'CREATE_LOAN', '{\"member_id\":20,\"total\":100000,\"has_notes\":true}', 13, 'tbloans', '::1', '2025-10-15 10:35:31'),
(125, 9, 'DELETE_CUSTOMER', '{\"reason\":\"remove member\",\"deleted_record\":{\"MID\":20,\"Fname\":\"a\",\"Lname\":\"b\",\"birth_date\":\"2010-01-14T17:00:00.000Z\",\"market_id\":2,\"role_id\":2,\"is_active\":1,\"created_at\":\"2025-10-15T03:32:13.000Z\"}}', 20, 'tbmember', '::1', '2025-10-15 10:50:11'),
(126, 9, 'UPDATE_MARKET', '{\"reason\":\"change responsible\"}', 2, 'tbmarkets', '::1', '2025-10-15 10:50:30'),
(127, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-15 14:26:12'),
(128, 9, 'UPDATE_CUSTOMER', '{\"reason\":\"update member\"}', 16, 'tbmember', '::1', '2025-10-15 14:26:31'),
(129, 9, 'UPDATE_CUSTOMER', '{\"reason\":\"update member\"}', 16, 'tbmember', '::1', '2025-10-15 14:26:55'),
(130, 9, 'UPDATE_CUSTOMER', '{\"reason\":\"update member\"}', 6, 'tbmember', '::1', '2025-10-15 14:37:43'),
(131, 9, 'UPDATE_MARKET', '{\"reason\":\"test\"}', 2, 'tbmarkets', '::1', '2025-10-15 14:39:38'),
(132, 9, 'UPDATE_CUSTOMER', '{\"reason\":\"update member\"}', 16, 'tbmember', '::1', '2025-10-15 14:49:44'),
(133, 9, 'UPDATE_MARKET', '{\"reason\":\"test\"}', 2, 'tbmarkets', '::1', '2025-10-15 14:50:45'),
(134, 9, 'UPDATE_MARKET', '{\"reason\":\"test\"}', 2, 'tbmarkets', '::1', '2025-10-15 14:59:20'),
(135, 9, 'CREATE_MARKET', '{\"Mname\":\"ກ\",\"Address\":6,\"responsible_by\":null}', 9, 'tbmarkets', '::1', '2025-10-15 15:00:42'),
(136, 9, 'ADMIN_DELETE_MARKET', '{\"reason\":\"remove market\",\"deleted_record\":{\"MkID\":9,\"Mname\":\"ກ\",\"Address\":6,\"responsible_by\":null}}', 9, 'tbmarkets', '::1', '2025-10-15 15:00:54'),
(137, 9, 'ADMIN_DELETE_EXPENSE', '{\"reason\":\"ptwpt\",\"deleted_record\":{\"EID\":11,\"user_id\":11,\"expense_type\":\"Ma der pee nong\",\"amount\":50000,\"photo_url\":null,\"created_at\":\"2025-10-02T00:08:43.000Z\",\"notes\":null,\"category\":null,\"payment_method\":\"CASH\",\"market_id\":null}}', 11, 'tbexpenses', '::1', '2025-10-16 02:29:35'),
(138, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::ffff:127.0.0.1', '2025-10-16 03:08:57'),
(139, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-16 07:00:09'),
(140, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-17 02:06:22'),
(141, 9, 'ADMIN_DELETE_INCOME', '{\"reason\":\"jdh\",\"deleted_record\":{\"IID\":11,\"member_id\":6,\"user_id\":13,\"total\":33000,\"photo_url\":null,\"notes\":\"Moneyyy\",\"market_id\":3,\"created_at\":\"2025-09-30T01:37:11.000Z\",\"type\":\"COLLECTION\",\"category\":null,\"payment_method\":\"CASH\"}}', 11, 'tbincome', '::1', '2025-10-17 02:06:41'),
(142, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-17 05:58:38'),
(143, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-20 02:10:10'),
(144, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-22 06:18:42'),
(145, 9, 'ADMIN_DELETE_LOAN', '{\"reason\":\"testDelloan\",\"deleted_record\":{\"LID\":7,\"member_id\":6,\"total\":270000,\"paid_total\":0,\"start_date\":\"2025-09-28T21:42:25.000Z\",\"end_date\":\"2025-09-09T17:00:00.000Z\",\"status\":0,\"notes\":null,\"created_by\":12}}', 7, 'tbloans', '::1', '2025-10-22 06:21:49'),
(146, 9, 'ADMIN_DELETE_EXPENSE', '{\"reason\":\"expenseDelTest\",\"deleted_record\":{\"EID\":4,\"user_id\":9,\"expense_type\":\"ເຂົ້າ\",\"amount\":25000,\"photo_url\":null,\"created_at\":\"2025-09-28T20:19:05.000Z\",\"notes\":\"ມາເດີ້ພີ່ນ້ອງກິນເຂົ້າເຊົ້ານຳກັນ\",\"category\":null,\"payment_method\":\"CASH\",\"market_id\":null}}', 4, 'tbexpenses', '::1', '2025-10-22 06:22:08'),
(147, 9, 'ADMIN_DELETE_INCOME', '{\"reason\":\"IncomeDelTest\",\"deleted_record\":{\"IID\":9,\"member_id\":16,\"user_id\":9,\"total\":125000,\"photo_url\":null,\"notes\":\"Collection from Morning Market.\",\"market_id\":1,\"created_at\":\"2025-09-28T22:19:06.000Z\",\"type\":\"COLLECTION\",\"category\":null,\"payment_method\":\"CASH\"}}', 9, 'tbincome', '::1', '2025-10-22 06:22:18'),
(148, 9, 'USER_LOGIN_SUCCESS', NULL, 9, 'tbuser', '::1', '2025-10-23 02:32:24'),
(149, 9, 'CREATE_RECONCILIATION', '{\"statement_date\":\"2025-10-23\",\"balance_difference\":0}', 2, 'tb_reconciliations', '::1', '2025-10-23 02:32:52');

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
(13, 1),
(8, 2),
(13, 2),
(13, 3),
(13, 5),
(13, 6);

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
(1, 'ຫາດຊາຍຟອງ', 1),
(2, 'ໄຊທານີ', 1),
(3, 'ວຽງຈັນ', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbexpenses`
--

CREATE TABLE `tbexpenses` (
  `EID` int NOT NULL,
  `user_id` int NOT NULL,
  `expense_type` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `amount` bigint NOT NULL,
  `photo_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'CASH',
  `market_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbexpenses`
--

INSERT INTO `tbexpenses` (`EID`, `user_id`, `expense_type`, `amount`, `photo_url`, `created_at`, `notes`, `category`, `payment_method`, `market_id`) VALUES
(5, 11, 'SQL course', 300000, NULL, '2025-09-29 04:04:14', 'Buy SQL course', NULL, 'CASH', NULL),
(6, 13, 'Food ingredient', 110000, NULL, '2025-09-29 04:04:14', 'Buy food ingredient', NULL, 'CASH', NULL),
(7, 13, 'Shopping', 600000, NULL, '2025-09-29 04:06:27', 'Shopping for fun', NULL, 'CASH', NULL),
(8, 12, 'Electric Bill', 2300000, NULL, '2025-09-29 04:06:27', 'Electric bill last month', NULL, 'CASH', NULL),
(9, 11, 'Security', 300000, NULL, '2025-09-29 04:08:20', 'Office security', NULL, 'CASH', NULL),
(10, 10, 'Water bill', 20000, NULL, '2025-09-29 04:08:20', 'Water bill this month', NULL, 'CASH', NULL),
(12, 9, 'djg', 300000, NULL, '2025-10-03 11:12:29', 'yjhggj', NULL, 'CASH', NULL),
(13, 10, 'dhd', 300000, NULL, '2025-10-05 11:11:04', 'ghft', 'test', 'CASH', NULL),
(14, 13, 'test', 1000000, NULL, '2025-08-27 11:34:06', 'test', NULL, 'CASH', NULL),
(15, 11, 'test', 500000, NULL, '2025-08-19 11:38:51', 'test', 'test', 'CASH', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbincome`
--

CREATE TABLE `tbincome` (
  `IID` int NOT NULL,
  `member_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  `total` bigint NOT NULL,
  `photo_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `market_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'COLLECTION',
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'CASH'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbincome`
--

INSERT INTO `tbincome` (`IID`, `member_id`, `user_id`, `total`, `photo_url`, `notes`, `market_id`, `created_at`, `type`, `category`, `payment_method`) VALUES
(7, NULL, 9, 10000000, NULL, 'Add fund.', NULL, '2025-09-29 05:05:54', 'COLLECTION', NULL, 'CASH'),
(10, 15, 9, 510000, NULL, 'Collection from Morning Market.', 1, '2025-09-29 05:19:41', 'COLLECTION', NULL, 'CASH'),
(12, 8, 12, 620000, NULL, 'Say my name. Heinsenberg. You\'re god damn right!!!', 3, '2025-10-01 05:54:11', 'COLLECTION', NULL, 'CASH'),
(13, 9, 12, 600000, NULL, 'Hello world', 5, '2025-10-02 06:56:25', 'COLLECTION', NULL, 'CASH'),
(14, 12, 12, 1000000, NULL, 'tesy', NULL, '2025-08-27 11:32:32', 'COLLECTION', 'test\r\n', 'CASH');

-- --------------------------------------------------------

--
-- Table structure for table `tbincome_details`
--

CREATE TABLE `tbincome_details` (
  `income_id` int NOT NULL,
  `member_id` int NOT NULL,
  `status` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PAID',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbincome_details`
--

INSERT INTO `tbincome_details` (`income_id`, `member_id`, `status`, `notes`) VALUES
(10, 8, 'PAID', 'On time'),
(10, 9, 'PAID', 'Paid extra'),
(12, 11, 'NOT_PAID', NULL),
(12, 12, 'NOT_PAID', 'ມາເດີ້ກິນເຂົ້າ'),
(12, 16, 'PAID', 'ມາເດີ້ກິນເຂົ້າ'),
(13, 6, 'NOT_PAID', NULL),
(13, 8, 'NOT_PAID', NULL),
(13, 12, 'PAID', NULL),
(13, 16, 'NOT_PAID', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbloans`
--

CREATE TABLE `tbloans` (
  `LID` int NOT NULL,
  `member_id` int NOT NULL,
  `total` bigint DEFAULT NULL,
  `paid_total` bigint NOT NULL DEFAULT '0',
  `start_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` date DEFAULT NULL,
  `status` tinyint(1) NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbloans`
--

INSERT INTO `tbloans` (`LID`, `member_id`, `total`, `paid_total`, `start_date`, `end_date`, `status`, `notes`, `created_by`) VALUES
(5, 15, 300000, 0, '2025-09-29 04:41:19', '2025-09-30', 1, NULL, 11),
(6, 9, 350000, 0, '2025-09-29 04:41:19', '2025-10-15', 1, NULL, 11),
(8, 12, 540000, 0, '2025-09-29 04:42:25', '2025-10-25', 1, NULL, 10),
(9, 11, 460000, 0, '2025-09-29 04:43:34', '2025-10-29', 1, NULL, 13),
(10, 7, 420000, 0, '2025-09-29 04:43:34', '2025-10-13', 1, NULL, 11),
(11, 13, 300000, 0, '2025-10-02 07:12:43', '2025-10-23', 1, NULL, 11);

-- --------------------------------------------------------

--
-- Table structure for table `tbmarkets`
--

CREATE TABLE `tbmarkets` (
  `MkID` int NOT NULL,
  `Mname` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Address` int NOT NULL,
  `responsible_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbmarkets`
--

INSERT INTO `tbmarkets` (`MkID`, `Mname`, `Address`, `responsible_by`) VALUES
(1, 'ຕະຫຼາດເຊົ້າ', 3, 13),
(2, 'Thongkhankham Morning Market', 3, NULL),
(3, 'ຕະຫຼາດລາວ', 2, 13),
(5, 'ຕະຫຼາດຊຽງຄວນ', 3, 11),
(6, 'ຕະຫຼາດໜອງໜ່ຽງ', 5, 12);

-- --------------------------------------------------------

--
-- Table structure for table `tbmember`
--

CREATE TABLE `tbmember` (
  `MID` int NOT NULL,
  `Fname` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Lname` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `birth_date` date DEFAULT NULL,
  `market_id` int NOT NULL,
  `role_id` int NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbmember`
--

INSERT INTO `tbmember` (`MID`, `Fname`, `Lname`, `birth_date`, `market_id`, `role_id`, `is_active`, `created_at`) VALUES
(6, 'ນ້ຳຫວານ', 'ເຄັມ', '2015-01-15', 2, 2, 1, '2025-09-29 02:48:09'),
(7, 'ສົມສັກ', 'ສວນ', NULL, 1, 2, 1, '2025-09-29 02:52:51'),
(8, 'ຕະ', 'ລອນສິນ', NULL, 3, 2, 1, '2025-09-29 02:53:30'),
(9, 'ກອນ', 'ລາໄຊ', NULL, 3, 2, 1, '2025-09-29 02:54:12'),
(11, 'ມາກ', 'ລີຊອນ', NULL, 6, 2, 1, '2025-09-29 02:54:58'),
(12, 'ຈອນ', 'ອາລອງ', NULL, 5, 2, 1, '2025-09-29 02:55:56'),
(13, 'ບິກ', 'ທະລາ', NULL, 5, 2, 1, '2025-09-29 02:56:14'),
(15, 'ສາ', 'ລາໄຊ', NULL, 3, 3, 1, '2025-09-29 02:56:41'),
(16, 'ຍອງ', 'ສະລາ', '1999-12-31', 2, 3, 1, '2025-09-29 02:57:02'),
(18, 'ກອນ', 'ລາວັນ', NULL, 5, 3, 1, '2025-10-15 03:00:54'),
(19, 'ບາ', 'ລີ', NULL, 5, 2, 1, '2025-10-15 03:37:21');

-- --------------------------------------------------------

--
-- Table structure for table `tbprovinces`
--

CREATE TABLE `tbprovinces` (
  `PID` int NOT NULL,
  `Pname` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
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
  `Rname` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
  `Fname` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Lname` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` int NOT NULL,
  `role_id` int NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbuser`
--

INSERT INTO `tbuser` (`UID`, `Fname`, `Lname`, `username`, `password`, `phone`, `Email`, `address`, `role_id`, `is_active`, `created_at`) VALUES
(8, 'Sokdee', 'Lao', 'sokdee.lao', '$2b$10$F.fhdg5M/oQOhZFKC9xBaOgM0VhUTpaxHwEcmDoVhHHuOvSjEiz4G', '0201234567', NULL, 1, 3, 1, '2025-09-17 03:53:11'),
(9, 'Book Cash', 'Tracking', 'BCT Admin', '$2b$10$eiMTnFcVXYRWFbtTQf3lMu/si3WhjXYKyxXTFFud1Ai2fbkyzwH1m', '02096542635', NULL, 5, 1, 1, '2025-09-22 03:12:38'),
(10, 'ອອນ', 'ໄຊສີ', 'ອອນໄຊ', '$2b$10$HYM/SJXSG.W/Iiwy.1OIN.Y2DlWJb2T.8rZFt0.IcyL0.rDm/Nz6q', '0209876543', NULL, 1, 4, 1, '2025-09-29 01:36:38'),
(11, 'ສີ', 'ສົມບັດ', 'ສີບັດ', '$2b$10$.Mtq7MQ5fjyrzcyNFB7Iw.sNZ8Nu1Y1uP1WWaDWWvzGTUiOahCb9y', '02051252147', NULL, 6, 4, 1, '2025-09-29 01:48:25'),
(12, 'ສອນ', 'ໄຊສີ', 'ສອນໄຊ', '$2b$10$Gipf.h5AeE5N4qAa3nIgcexD7IU7psD0ohIfSKRbJWG5DK/llawz6', '02021363548', NULL, 3, 4, 1, '2025-09-29 01:49:42'),
(13, 'ສົມຊາຍລາ', 'ໝີ່ກຽ້ວຊາຍ', 'ສົມກ້ຽວ', '$2b$10$NarQsj7oqgKjfiUIBX1y2etsTRwS4QEH1c9QbdwVFrwzegZbYvyZK', '02096525454', NULL, 7, 4, 1, '2025-09-29 01:50:50');

-- --------------------------------------------------------

--
-- Table structure for table `tbvillages`
--

CREATE TABLE `tbvillages` (
  `VID` int NOT NULL,
  `Vname` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `district_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbvillages`
--

INSERT INTO `tbvillages` (`VID`, `Vname`, `district_id`) VALUES
(1, 'ທ່ານາແລ້ງ', 1),
(2, 'ບ້ານທ່າ', 1),
(3, 'ບ້ານຖີນຕົມ', 1),
(4, 'ດອນໜູນ', 2),
(5, 'ໂນນສະອາດ', 2),
(6, 'ຫ້ວຍຫົງ', 3),
(7, 'ໂພນຕ້ອງ', 3);

-- --------------------------------------------------------

--
-- Table structure for table `tb_reconciliations`
--

CREATE TABLE `tb_reconciliations` (
  `id` int NOT NULL,
  `reconciled_by_user_id` int NOT NULL,
  `statement_date` date NOT NULL,
  `system_balance` decimal(12,2) NOT NULL,
  `bank_balance` decimal(12,2) NOT NULL,
  `reconciled_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tb_reconciliations`
--

INSERT INTO `tb_reconciliations` (`id`, `reconciled_by_user_id`, `statement_date`, `system_balance`, `bank_balance`, `reconciled_at`) VALUES
(1, 9, '2025-10-11', 4443000.00, 4443000.00, '2025-10-11 08:14:19'),
(2, 9, '2025-10-23', 4630000.00, 4630000.00, '2025-10-23 02:32:52');

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
  ADD KEY `user_expense` (`user_id`),
  ADD KEY `idx_expense_market` (`market_id`);

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
  ADD PRIMARY KEY (`income_id`,`member_id`),
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
  ADD UNIQUE KEY `Email_UNIQUE` (`Email`),
  ADD KEY `user_role` (`role_id`),
  ADD KEY `user_address` (`address`);

--
-- Indexes for table `tbvillages`
--
ALTER TABLE `tbvillages`
  ADD PRIMARY KEY (`VID`),
  ADD KEY `district_id` (`district_id`);

--
-- Indexes for table `tb_reconciliations`
--
ALTER TABLE `tb_reconciliations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reconciled_by_user_id` (`reconciled_by_user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_log`
--
ALTER TABLE `activity_log`
  MODIFY `AID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=150;

--
-- AUTO_INCREMENT for table `tbdistricts`
--
ALTER TABLE `tbdistricts`
  MODIFY `DID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbexpenses`
--
ALTER TABLE `tbexpenses`
  MODIFY `EID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `tbincome`
--
ALTER TABLE `tbincome`
  MODIFY `IID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `tbloans`
--
ALTER TABLE `tbloans`
  MODIFY `LID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `tbmarkets`
--
ALTER TABLE `tbmarkets`
  MODIFY `MkID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `tbmember`
--
ALTER TABLE `tbmember`
  MODIFY `MID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

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
  MODIFY `UID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `tbvillages`
--
ALTER TABLE `tbvillages`
  MODIFY `VID` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `tb_reconciliations`
--
ALTER TABLE `tb_reconciliations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
  ADD CONSTRAINT `fk_expense_market` FOREIGN KEY (`market_id`) REFERENCES `tbmarkets` (`MkID`) ON DELETE SET NULL ON UPDATE CASCADE,
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

--
-- Constraints for table `tb_reconciliations`
--
ALTER TABLE `tb_reconciliations`
  ADD CONSTRAINT `tb_reconciliations_ibfk_1` FOREIGN KEY (`reconciled_by_user_id`) REFERENCES `tbuser` (`UID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
